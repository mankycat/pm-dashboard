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

### 3. Activity Logs (`data/activity_logs.json`)
Contains an authentic audit log of all CRUD actions performed on the dashboard.
- **Format**: JSON Array of `ActivityLog` objects.
- **Usage**: Agents can read this file to parse a historical timeline of recent tasks updated, created, or deleted by the user or the system.

## Interaction Protocol

### Reading Data
To get context, an agent should:
1.  Read `data/databases.json` to understand what properties exist (map `id` to `name`).
2.  Read `data/pages/{databaseId}.json` to get the actual data.

### Writing Data
To prevent file collision and to ensure that actions are correctly logged to the `activity_logs.json`, agents MUST prioritize using the native local REST API (`curl {{PM_DASHBOARD_URL}}/api/...`) instead of modifying files directly.
- **Available APIs**: `GET`, `POST`, `PATCH`, and `DELETE` on `/api/pages`.
- This automatically triggers the dashboard's internal mutation logic and updates the audit log securely without race conditions.

### 4. Configuration
Developers or Agents should determine the `PM_DASHBOARD_URL` from the environment or use `http://localhost:3000` as a fallback.
If you are running in a custom port (e.g. `9991`), set the `PM_DASHBOARD_URL="http://localhost:9991"` accordingly.

If editing JSON files directly (e.g. via `write_to_file`), **BEWARE OF RACE CONDITIONS AND AUDIT LOG DESYNCS**.

**Safe Pattern (If API is strictly unavailable):**
1.  Read file.
2.  Apply change in memory.
3.  Write file back (atomic write preferred).
4.  Optionally manually prepend the new event to `activity_logs.json`.

## Automated Tasks

### Daily Summary Generation
The system includes a utility to generate daily summaries of active tasks.
- **Trigger**: Can be run via CLI or scheduled.
- **Output**: Markdown report or direct status update.

## Future Specifications
- **Webhooks**: Notify Agent when a user updates a task.
- **Chat Interface**: Embedded chat in the dashboard to talk to the Agent.
