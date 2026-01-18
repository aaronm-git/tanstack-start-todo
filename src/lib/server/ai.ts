import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { chat } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { db } from '../../db'
import { todos, todoCategories } from '../../db/schema'
import { eq } from 'drizzle-orm'

// Import schemas from single source of truth
import {
  generateTodoInputSchema,
  aiGeneratedTodoSchema,
  todoWithRelationsQueryConfig,
  type TodoWithRelations,
  type Priority,
} from '../tasks'

// Generate and create a todo using AI
export const generateTodoWithAI = createServerFn({ method: 'POST' })
  .inputValidator((data) => {
    console.log('[AI] Raw input data:', JSON.stringify(data, null, 2))
    const result = generateTodoInputSchema.safeParse(data)
    if (!result.success) {
      console.error('[AI] Input validation failed:', result.error.format())
      const errorMessages = result.error.issues
        .map((issue) => `${String(issue.path.join('.'))}: ${issue.message}`)
        .join(', ')
      throw new Error(`Input validation failed: ${errorMessages}`)
    }
    console.log('[AI] Input validation passed')
    return result.data
  })
  .handler(async (ctx): Promise<TodoWithRelations> => {
    return Sentry.startSpan({ name: 'generateTodoWithAI' }, async () => {
      try {
        const { prompt, categories } = ctx.data
        console.log('[AI] Handler started with prompt:', prompt)
        console.log('[AI] Categories count:', categories.length)

        // Build category list for the system prompt
        const categoryList =
          categories.length > 0
            ? categories.map((c) => `- ${c.name}`).join('\n')
            : 'No categories available'

        // Get today's date for context
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' })

        const systemPrompt = `You are a helpful task assistant that creates well-structured todos from natural language descriptions.

Today is ${dayOfWeek}, ${todayStr}.

When creating a task:
1. NAME: Create a concise, actionable task name (start with a verb when appropriate)
2. DESCRIPTION: Add helpful details, context, or steps if the user's request implies them. Omit or use null if no description needed.
3. PRIORITY: Choose based on implied urgency:
   - low: routine tasks, nice-to-haves
   - medium: normal tasks, standard work items
   - high: important tasks that need attention soon
   - urgent: time-sensitive tasks that need immediate attention
   - critical: emergency tasks that must be done ASAP
4. DUE DATE: Parse relative dates (tomorrow, next Monday, in 3 days, end of week) into ISO 8601 format (YYYY-MM-DD). If no date is mentioned or implied, omit or use null.
5. CATEGORIES: Match to available categories below. If none match well, return an empty array.
6. SUBTASKS: If the user mentions multiple items that should be tracked separately, create subtasks for each item. Examples:
   - "Buy groceries tomorrow - milk, eggs, and bread" → Main task: "Buy groceries", Subtasks: [{name: "Buy milk"}, {name: "Buy eggs"}, {name: "Buy bread"}]
   - "Call mom" → No subtasks (single action), subtasks: []
   - Only create subtasks when there are clearly multiple distinct items/actions to track.

Available categories:
${categoryList}

Return a well-structured task based on the user's input.`

        console.log('[AI] Calling TanStack AI chat with outputSchema...')

        // Use TanStack AI with outputSchema for structured output
        const result = await chat({
          adapter: openaiText('gpt-4.1-nano'),
          systemPrompts: [systemPrompt],
          messages: [{ role: 'user', content: prompt }],
          outputSchema: aiGeneratedTodoSchema,
        })

        console.log(
          '[AI] AI response validated:',
          JSON.stringify(result, null, 2),
        )

        // Match suggested categories to actual category IDs
        const categoryIds: string[] = []
        if (result.suggestedCategories && result.suggestedCategories.length > 0) {
          for (const suggestedName of result.suggestedCategories) {
            const matchedCategory = categories.find(
              (c) => c.name.toLowerCase() === suggestedName.toLowerCase(),
            )
            if (matchedCategory) {
              categoryIds.push(matchedCategory.id)
            }
          }
        }

        // Parse the due date if provided
        let dueDate: Date | null = null
        if (result.dueDate) {
          const parsed = new Date(result.dueDate)
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed
          }
        }

        console.log('[AI] Creating todo in database...')

        // Create the todo in the database
        const insertResult = await db
          .insert(todos)
          .values({
            name: result.name,
            description: result.description || '',
            priority: result.priority as Priority,
            dueDate: dueDate,
            parentId: null,
          })
          .returning()

        if (!Array.isArray(insertResult) || insertResult.length === 0) {
          throw new Error('Failed to create todo - no result returned')
        }

        const newTodo = insertResult[0]
        console.log('[AI] Todo created with ID:', newTodo.id)

        // Assign categories if any matched
        if (categoryIds.length > 0) {
          await db.insert(todoCategories).values(
            categoryIds.map((categoryId) => ({
              todoId: newTodo.id,
              categoryId,
            })),
          )
          console.log('[AI] Categories assigned:', categoryIds)
        }

        // Create subtasks if any were generated
        if (result.subtasks && result.subtasks.length > 0) {
          await db.insert(todos).values(
            result.subtasks.map((subtask) => ({
              name: subtask.name,
              description: subtask.description || '',
              priority: result.priority as Priority,
              dueDate: dueDate,
              parentId: newTodo.id,
            })),
          )
          console.log('[AI] Subtasks created:', result.subtasks.length)
        }

        // Fetch the complete todo with relations using shared config
        const todoWithRelations = await db.query.todos.findFirst({
          where: eq(todos.id, newTodo.id),
          with: todoWithRelationsQueryConfig,
        })

        if (!todoWithRelations) {
          throw new Error('Failed to fetch created todo')
        }

        console.log('[AI] Successfully created todo with relations')
        return todoWithRelations as TodoWithRelations
      } catch (error) {
        console.error('[AI] Error in handler:', error)
        console.error(
          '[AI] Error stack:',
          error instanceof Error ? error.stack : 'No stack',
        )
        throw error
      }
    })
  })
