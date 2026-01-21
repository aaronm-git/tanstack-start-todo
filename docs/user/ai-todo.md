# AI Todo Creation

Create tasks quickly using natural language. The AI automatically extracts task details, sets priorities, suggests due dates, and can break down complex requests into subtasks.

## What you can do

- Create tasks by describing them in plain English
- Automatically set priority based on urgency keywords
- Parse relative dates (tomorrow, next Monday, end of week, etc.)
- Match tasks to existing lists
- Create subtasks when multiple items are mentioned
- Get structured tasks with descriptions and metadata

## How to use it

1. **Open the AI Create dialog**
   - Click the "AI Create" button (sparkles icon) in the dashboard header
   - Or use the example prompts shown in the dialog

2. **Describe your task**
   - Type a natural language description of what you need to do
   - Examples:
     - "Schedule a team meeting for next Monday to discuss Q1 goals"
     - "Buy groceries tomorrow - milk, eggs, and bread"
     - "Finish the quarterly report by end of week, high priority"
     - "Call mom on her birthday next Saturday"

3. **Review and create**
   - Click "Create Task" to generate the task
   - The AI will parse your description and create a structured task
   - The new task will open automatically in the detail panel

## Examples

### Simple Task
**Input**: "Call dentist tomorrow"
**Result**: 
- Name: "Call dentist"
- Due Date: Tomorrow
- Priority: Medium (default)

### Task with Priority
**Input**: "Finish quarterly report by end of week, high priority"
**Result**:
- Name: "Finish quarterly report"
- Due Date: End of current week
- Priority: High
- Description: May include context about the report

### Task with Subtasks
**Input**: "Buy groceries tomorrow - milk, eggs, and bread"
**Result**:
- Main Task: "Buy groceries"
  - Due Date: Tomorrow
  - Priority: Medium
  - Subtasks (simple checklist items):
    - "Buy milk"
    - "Buy eggs"
    - "Buy bread"
- Subtasks are simple checklist items - just a name you can check off

### Task with List Matching
**Input**: "Schedule doctor appointment next week"
**Result**:
- Name: "Schedule doctor appointment"
- Due Date: Next week
- Lists: Automatically matched if "Health" or similar list exists

## Tips

- **Be specific**: Include dates, priorities, and context for better results
- **Use natural language**: Write as you would describe the task to someone
- **Multiple items**: List items with dashes or commas to create subtasks
- **Relative dates**: Use phrases like "tomorrow", "next Monday", "in 3 days", "end of week"
- **Priority keywords**: Words like "urgent", "important", "ASAP" will set higher priorities

## Limitations

- Maximum prompt length: 2000 characters
- Task name: 1-255 characters
- Description: Maximum 1000 characters
- List matching is case-insensitive but requires exact name matches
- Date parsing works best with common relative date phrases

## Developer documentation

- [How AI Todo Creation is implemented](../dev/ai-todo-openai.md)
