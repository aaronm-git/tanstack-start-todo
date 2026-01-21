# Subtasks

Break down your todos into simple, actionable steps using subtasks. Inspired by Wunderlist, subtasks are simple checklist items that help you track progress on complex tasks.

## What are subtasks?

Subtasks are simple checklist items with just a name and completion status. Unlike full todos, they don't have descriptions, priorities, or due dates - they're meant to be quick, lightweight steps you can check off as you work.

## How to use subtasks

### Adding a subtask

1. **Open a todo** in the detail panel (click on any todo)
2. **Click "Add subtask"** in the Subtasks section
3. **Enter a name** for your subtask (e.g., "Buy milk", "Call vendor", "Review draft")
4. **Click "Create"**

### Completing a subtask

Simply click the checkbox next to any subtask to mark it complete. The subtask stays in its original position - we don't move completed subtasks to the bottom like some other apps do.

### Editing a subtask

1. Click the **three-dot menu** (⋮) next to the subtask
2. Select **"Edit"**
3. Update the name and save

### Deleting a subtask

1. Click the **three-dot menu** (⋮) next to the subtask
2. Select **"Delete"**
3. Confirm deletion

## Examples

### Shopping list
**Todo**: "Buy groceries"
**Subtasks**:
- Buy milk
- Buy eggs
- Buy bread
- Buy coffee

### Project task
**Todo**: "Launch new website"
**Subtasks**:
- Finalize design
- Deploy to production
- Update DNS settings
- Test all pages
- Announce launch

### Event planning
**Todo**: "Organize team party"
**Subtasks**:
- Book venue
- Send invitations
- Order catering
- Prepare playlist
- Set up decorations

## Best practices

- **Keep subtasks simple**: One action per subtask
- **Use verbs**: Start with action words like "Buy", "Call", "Review", "Send"
- **Break down complexity**: If a todo feels overwhelming, add subtasks to make it manageable
- **Order matters**: Add subtasks in the order you plan to complete them

## Tips

- Subtasks are automatically saved as you create them
- Completed subtasks show a strike-through but stay in place
- The detail panel shows a progress counter: "3 of 7 completed"
- Deleting a todo automatically deletes all its subtasks
- You can have as many subtasks as you need for any todo

## Developer documentation

- [Database Schema](../dev/typescript-types.md)
- [Subtask Server Functions](../../src/lib/server/subtasks.ts)
