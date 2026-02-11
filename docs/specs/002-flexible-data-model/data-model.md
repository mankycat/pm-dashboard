# Data Model: PM Dashboard V2 (Flexible)

## Overview

Moving from a rigid "Project > Task" hierarchy to a flexible "Database > Page > Property" system, inspired by Notion.

- **Workspace**: Root container (implicitly the entire data folder).
- **Database**: A collection of Pages with a defined Schema (Properties).
- **Page**: An item within a Database (e.g., a Task, a Project, a Note).
- **Property**: A field definition (e.g., "Status", "Due Date").
- **PropertyValue**: The actual value of a Property for a specific Page.

## Schema Definitions

### 1. Database Definition (`data/databases.json`)

Stores the metadata and schema for each "Database" (e.g., "Projects", "Tasks", "Epics").

```typescript
type PropertyType = 'text' | 'number' | 'select' | 'multi-select' | 'status' | 'date' | 'person' | 'checkbox' | 'relation';

interface PropertySchema {
  id: string;          // UUID, e.g., "prop-status"
  name: string;        // e.g., "Status"
  type: PropertyType;
  options?: {          // For select/status types
    id: string;
    name: string;
    color?: string;
  }[];
}

interface Database {
  id: string;          // UUID
  name: string;        // e.g., "Master Task List"
  description?: string;
  schema: PropertySchema[]; // Replacing fixed columns
}
```

### 2. Page (Item) Definition (`data/pages/{databaseId}.json`)

Stores the actual data items.

```typescript
interface PropertyValue {
  [propertyId: string]: any; // Value depends on PropertyType
  // text -> string
  // number -> number
  // select -> optionId (string)
  // date -> ISO string or { start, end }
  // person -> userId
}

interface Page {
  id: string;           // UUID
  databaseId: string;   // Reference to parent Database
  title: string;        // The primary "Name" property (special case or just a property?) -> Let's keep it explicit for simplicity.
  properties: PropertyValue;
  content?: string;     // Markdown body (optional, for detailed notes)
  createdAt: string;
  updatedAt: string;
}
```

## JSON File Structure

To support scalability and Agent readability, we split data:

```
/data
  ├── system.json           // Global settings, maybe user list
  ├── databases.json        // List of all databases and their schemas
  └── pages/
      ├── {database-uuid-1}.json  // All pages for Database 1
      └── {database-uuid-2}.json  // All pages for Database 2
```

## Example: "Tasks" Database

**`data/databases.json`**:
```json
[
  {
    "id": "db-tasks",
    "name": "Engineering Tasks",
    "schema": [
      {
        "id": "prop-status",
        "name": "Status",
        "type": "status",
        "options": [
          { "id": "opt-todo", "name": "To Do", "color": "gray" },
          { "id": "opt-doing", "name": "In Progress", "color": "blue" },
          { "id": "opt-done", "name": "Done", "color": "green" }
        ]
      },
      {
        "id": "prop-priority",
        "name": "Priority",
        "type": "select",
        "options": [
          { "id": "opt-p1", "name": "High", "color": "red" },
          { "id": "opt-p2", "name": "Medium", "color": "yellow" }
        ]
      }
    ]
  }
]
```

**`data/pages/db-tasks.json`**:
```json
[
  {
    "id": "page-001",
    "databaseId": "db-tasks",
    "title": "Refactor Data Layer",
    "properties": {
      "prop-status": "opt-doing",
      "prop-priority": "opt-p1"
    },
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-02-05T10:05:00Z"
  }
]
```
