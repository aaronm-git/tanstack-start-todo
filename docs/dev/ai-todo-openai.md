# AI Todo Creation (OpenAI)

AI-powered task creation feature that uses OpenAI's GPT-4.1-nano model via TanStack AI to parse natural language prompts and automatically generate structured todos with subtasks, priorities, due dates, and list suggestions.

## Where to look in the code

- **Server function**: `src/lib/server/ai.ts` - `generateTodoWithAI` server function
- **UI component**: `src/components/todos/ai-todo-dialog.tsx` - Dialog component for AI prompt input
- **Integration**: `src/routes/dashboard.tsx` - Button and handlers for opening AI dialog
- **Type definitions**: `src/lib/tasks.ts` - `TodoWithRelations` schema and types

## Architecture

### Flow

```
User Input (Natural Language)
    ↓
AITodoDialog Component
    ↓
generateTodoWithAI Server Function
    ↓
TanStack AI chat() with outputSchema
    ↓
OpenAI API (gpt-4.1-nano) with Structured Output
    ↓
Automatic Zod Schema Validation
    ↓
Database Insert (todos + subtasks)
    ↓
Return TodoWithRelations
```

### Key Components

#### Server Function (`src/lib/server/ai.ts`)

- **Input**: `{ prompt: string, lists: Array<{id, name}> }`
- **Output**: `TodoWithRelations` (validated via Zod schema)
- **Implementation**: Uses TanStack AI's `chat()` function with `outputSchema` for structured output
- **Process**:
  1. Builds system prompt with current date and available lists
  2. Calls TanStack AI's `chat()` with:
     - `adapter`: `openaiText('gpt-4.1-nano')`
     - `systemPrompts`: Array with instructions
     - `messages`: User's prompt
     - `outputSchema`: `aiGeneratedTodoSchema` (Zod 4 schema)
  3. TanStack AI automatically validates response against Zod schema
  4. Matches suggested lists to actual list IDs
  5. Parses and validates due date
  6. Creates main todo in database
  7. Creates subtasks (if any) - simple checklist items with just a name
  8. Assigns matched list (single list per todo)
  9. Returns complete todo with relations

#### AI Schema (`aiGeneratedTodoSchema`)

Defines the structured output format using Zod 4:
- `name`: Task name - String with detailed description for AI guidance
- `description`: Detailed description - Uses `.nullish()` to accept null, undefined, or omitted
- `priority`: Enum ['low', 'medium', 'high', 'urgent', 'critical'] with detailed descriptions
- `dueDate`: ISO 8601 date string - Uses `.nullish()` to accept null, undefined, or omitted
- `suggestedLists`: Array of list names to match from available lists
- `subtasks`: Array of simple subtask objects (just a name) - Empty array if no breakdown needed

**Key improvements**:
- Uses `.nullish()` instead of `.nullable()` or `.optional()` for better OpenAI compatibility
- Each field has detailed `.describe()` strings with examples to guide the AI
- Subtasks are kept simple (Wunderlist-style) - just a name, no extra properties

#### UI Component (`src/components/todos/ai-todo-dialog.tsx`)

- Uses `useMutation` from TanStack Query
- Validates server response with `todoWithRelationsSchema.parse()`
- Provides example prompts for user guidance
- Handles loading states and error messages

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (required)
- `OPENAI_API_PROJECT_ID` - OpenAI project ID (optional, for usage tracking)

### Model Configuration

Currently uses `gpt-4.1-nano` model via TanStack AI. To change:
1. Edit `src/lib/server/ai.ts` in the `chat()` call
2. Update the `adapter` parameter: `openaiText('model-name')`
3. See [TanStack AI OpenAI adapter docs](https://tanstack.com/ai/latest/docs/adapters/openai) for available models

## System Prompt

The system prompt instructs the AI to:
1. Create concise, actionable task names
2. Add helpful descriptions when context is implied
3. Infer priority from urgency indicators
4. Parse relative dates (tomorrow, next Monday, etc.) to ISO 8601
5. Match tasks to available lists
6. Create subtasks when multiple items are mentioned (e.g., "Buy groceries - milk, eggs, bread")

## Subtask Detection

The AI automatically detects when a prompt contains multiple items and creates subtasks:
- **Example**: "Buy groceries tomorrow - milk, eggs, and bread"
  - Main task: "Buy groceries" (with priority and due date)
  - Subtasks: Simple checklist items with just names: "Buy milk", "Buy eggs", "Buy bread"
- Subtasks are simple checklist items (Wunderlist-style) - they only have a name and completion status

## Type Safety

This feature relies on Zod schemas for both:

- **AI output** validation (`aiGeneratedTodoSchema`)
- **Database/query result** validation (`todoWithRelationsSchema`)

For deeper guidance on Zod 4 + TanStack AI schema design and troubleshooting, see:

- [Zod 4 + TanStack AI Integration](./zod-tanstack-ai-integration.md)

## Error Handling

- Server function throws errors for database failures
- Client component shows toast notifications for errors
- Zod validation ensures response structure matches expected schema

## Sentry Instrumentation

The server function is wrapped with Sentry instrumentation:
```typescript
Sentry.startSpan({ name: 'generateTodoWithAI' }, async () => {
  // ... implementation
})
```

## User documentation

- [How to use AI Todo Creation](../user/ai-todo.md)
