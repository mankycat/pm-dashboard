# 資料模型：PM Dashboard V1

## Schema Definition

### Root Object
```typescript
interface Database {
  projects: Project[];
}
```

### Project Entity
```typescript
interface Project {
  id: string;          // UUID
  name: string;        // e.g., "EBM Phase 2"
  description?: string;
  status: 'active' | 'archived' | 'completed';
  tasks: Task[];
}
```

### Task Entity
```typescript
interface Task {
  id: string;          // UUID
  title: string;       // e.g., "Fix Firewalld Issue"
  startDate: string;   // ISO Date "YYYY-MM-DD"
  endDate: string;     // ISO Date "YYYY-MM-DD"
  progress: number;    // 0-100
  status: 'todo' | 'in-progress' | 'done';
  assignee?: string;   // Optional
}
```

## Example Data (`data/projects.json`)

```json
{
  "projects": [
    {
      "id": "p-001",
      "name": "EBM Phase 2",
      "status": "active",
      "description": "Evidence-Based Medicine LLM Service",
      "tasks": [
        {
          "id": "t-001",
          "title": "Define Spec V2",
          "startDate": "2026-02-01",
          "endDate": "2026-02-03",
          "progress": 100,
          "status": "done"
        }
      ]
    }
  ]
}
```
