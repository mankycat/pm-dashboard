# Agent Integration Guide (OpenClaw)

This guide describes how an AI Agent (like OpenClaw or YOU) should interact with the PM Dashboard's data layer.

## Philosophy

The PM Dashboard is designed to be "Agent-First". Data is stored in simple, human-readable JSON files. An Agent can read these files to understand the current state of projects and tasks, and write to them (via tools or direct file edits, though tools/API are safer) to update status, add comments, or generate reports.

## Data Structure

### 1. Databases (`data/databases.json`)
Defines the schema for different types of items (e.g., Projects, Tasks).
- **Read-Only** for most operations. Agents should generally not modify the schema unless explicitly asked to "add a new field".

### 2. Pages (`data/pages/{databaseId}.json`)
Contains the actual items (records).
- **Format**: JSON Array of `Page` objects.
- **Key Fields**:
    - `id`: UUID (do not change).
    - `title`: String.
    - `properties`: Object mapping `propertyId` to values.

## Interaction Protocol

### Reading Data
To get context, an agent should:
1.  Read `data/databases.json` to understand what properties exist (map `id` to `name`).
2.  Read `data/pages/{databaseId}.json` to get the actual data.

### Writing Data
Agents should prefer using the provided **Server Actions** or **Tool Wrappers** if available (to handle locking/concurrency).
If editing JSON files directly (e.g. via `sed` or `write_to_file`), **BEWARE OF RACE CONDITIONS**.
*The system now implements a mutex lock for API calls, but direct file edits bypass this.*

**Safe Pattern:**
1.  Read file.
2.  Apply change in memory.
3.  Write file back (atomic write preferred).

## Automated Tasks

### Daily Summary Generation
The system includes a utility to generate daily summaries of active tasks.
- **Trigger**: Can be run via CLI or scheduled.
- **Output**: Markdown report or direct status update.

## Future Specifications
- **Webhooks**: Notify Agent when a user updates a task.
- **Chat Interface**: Embedded chat in the dashboard to talk to the Agent.
