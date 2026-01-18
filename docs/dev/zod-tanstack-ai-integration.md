# Zod 4 + TanStack AI Integration

This document explains how we integrated Zod 4 with TanStack AI for structured AI outputs in our todo application.

## Problem Statement

Initially, we encountered "Expected string, received undefined" errors when using TanStack AI's `outputSchema` with Zod 4. The error occurred during the internal schema conversion process in TanStack AI, specifically when the AI returned objects with nested arrays (subtasks).

## Root Cause

The issue was a combination of:
1. **Incompatibility between Zod 4 syntax and TanStack AI 0.2.2**
   - TanStack AI's internal `parseWithStandardSchema` had edge cases with Zod 4
   - Complex nested structures (arrays of objects) were particularly problematic

2. **Incorrect Zod modifiers**
   - Using `.nullable()` or `.optional()` instead of `.nullish()`
   - OpenAI returns `null` for empty fields, but `.optional()` expects `undefined`
   - `.nullable()` doesn't handle missing fields

3. **Insufficient field descriptions**
   - Vague descriptions didn't guide the AI model effectively
   - Missing examples and context led to inconsistent outputs

## Solution

### 1. Update to Latest Packages

```bash
pnpm update @tanstack/ai @tanstack/ai-openai zod
```

Current versions:
- `@tanstack/ai`: 0.2.2
- `zod`: 4.3.5
- `@tanstack/ai-openai`: latest

### 2. Use `.nullish()` Instead of `.nullable()` or `.optional()`

**Before:**
```typescript
description: z.string().nullable()
dueDate: z.string().optional()
```

**After:**
```typescript
description: z.string().nullish() // Accepts missing, null, or undefined
dueDate: z.string().nullish()
```

### 3. Add Detailed Descriptions

**Before:**
```typescript
name: z.string()
```

**After:**
```typescript
name: z.string().describe(
  'A concise, actionable task name. Should be clear and specific. ' +
  'Start with a verb when appropriate (e.g., "Complete quarterly report", ' +
  '"Schedule dentist appointment").'
)
```

### 4. Use TanStack AI's `chat()` with `outputSchema`

**Before (Direct OpenAI API):**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    model: 'gpt-4.1-nano',
    messages: [/* ... */],
    response_format: { type: 'json_schema', json_schema: { /* manual schema */ } }
  })
})
const result = aiResponseSchema.parse(JSON.parse(await response.json()))
```

**After (TanStack AI):**
```typescript
import { chat } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'

const result = await chat({
  adapter: openaiText('gpt-4.1-nano'),
  systemPrompts: [systemPrompt],
  messages: [{ role: 'user', content: prompt }],
  outputSchema: aiGeneratedTodoSchema, // Zod 4 schema with .nullish()
})
// Result is automatically validated and fully typed!
```

## Schema Design Best Practices

### 1. Use `.nullish()` for Optional Fields

```typescript
// ✅ GOOD - Accepts missing, null, or undefined
description: z.string().nullish()

// ❌ BAD - Only accepts null, not missing or undefined
description: z.string().nullable()

// ❌ BAD - Only accepts undefined or missing, not null
description: z.string().optional()
```

### 2. Provide Detailed Descriptions

```typescript
// ✅ GOOD - Clear guidance for AI
priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).describe(
  'Priority level based on urgency and importance: ' +
  '"low" for routine/nice-to-have tasks, ' +
  '"medium" for normal work items, ' +
  '"high" for important tasks needing attention soon, ' +
  '"urgent" for time-sensitive tasks needing immediate attention, ' +
  '"critical" for emergency tasks that must be done ASAP.'
)

// ❌ BAD - Vague, no examples
priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical'])
```

### 3. Use Plain Enums for AI Schemas

```typescript
// ✅ GOOD - Plain Zod enum
const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent', 'critical'] as const
priority: z.enum(PRIORITY_VALUES)

// ❌ BAD - drizzle-zod generated enum (complex for AI schema converter)
priority: createSelectSchema(priorityEnum)
```

### 4. Keep Nested Objects Simple

```typescript
// ✅ GOOD - Simple nested object
subtasks: z.array(z.object({
  name: z.string().describe('Subtask name'),
  description: z.string().nullish().describe('Optional description')
}))

// ❌ BAD - Complex nested structure with transforms
subtasks: z.array(z.object({
  name: z.string().transform(v => v.toUpperCase()),
  metadata: z.record(z.unknown())
}))
```

## Files Modified

### 1. `src/lib/tasks.ts`
- Updated `aiSubtaskSchema` and `aiGeneratedTodoSchema`
- Changed all `.nullable()` to `.nullish()`
- Added detailed `.describe()` strings with examples

### 2. `src/lib/server/ai.ts`
- Removed direct `fetch()` calls to OpenAI API
- Implemented `chat()` from `@tanstack/ai`
- Removed manual JSON Schema definition
- Let TanStack AI handle schema conversion automatically

## Testing

Tested with various prompts:
- ✅ Simple tasks: "Call mom tomorrow"
- ✅ Tasks with priority: "Finish quarterly report, high priority"
- ✅ Tasks with subtasks: "Buy groceries - milk, eggs, bread"
- ✅ Complex requests: "Generate grocery list with cat items, max 5 subtasks, best products by brand"

All tests passed without validation errors.

## Benefits of This Approach

1. **Type Safety**: Full TypeScript inference from Zod to result
2. **Automatic Validation**: No manual JSON parsing and validation
3. **Better Error Messages**: Zod provides detailed validation errors
4. **Framework Agnostic**: Works with any TanStack AI adapter
5. **Provider Flexibility**: Easy to swap OpenAI for Anthropic, Gemini, etc.
6. **Maintainability**: Single schema definition, no duplicate JSON Schema

## Future Improvements

1. **Streaming Support**: Implement streaming responses using TanStack AI's streaming capabilities
2. **Tool Support**: Add function calling tools for dynamic category creation
3. **Multi-model Support**: Test with Anthropic Claude and Google Gemini
4. **Prompt Engineering**: Refine system prompts for better categorization and prioritization
5. **Error Recovery**: Implement fallback strategies for partial AI responses

## References

- [TanStack AI Documentation](https://tanstack.com/ai/latest/docs/getting-started/overview)
- [TanStack AI Structured Outputs Guide](https://tanstack.com/ai/latest/docs/guides/structured-outputs)
- [Zod 4 Migration Guide](https://github.com/colinhacks/zod/releases/tag/v4.0.0)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
