# Plane Agent

## cqrs
### commands

| Command                  | Purpose                                                           |
|--------------------------|-------------------------------------------------------------------|
| `plane.work-item.create` | Create a Plane work item from detected chat/meeting task          |
| `plane.work-item.update` | Update title, description, assignees, priority, due date or state |
| `plane.work-item.move`   | Move a work item to another Plane state                           |
| `plane.work-item.close`  | Close a work item by moving it to completed state                 |

### queries:

| Query                  | Purpose                                |
|------------------------|----------------------------------------|
| `plane.project.list`   | List Plane projects in workspace       |
| `plane.state.list`     | List states for configured project     |
| `plane.work-item.list` | List work items for configured project |

## http:

```bash
GET  /health
POST /commands
POST /queries
GET  /plane/projects
GET  /plane/states
GET  /plane/work-items
POST /plane/work-items
PATCH /plane/work-items/:workItemId
POST /plane/work-items/:workItemId/move
POST /plane/work-items/:workItemId/close
```
