# OpenClaw PM Dashboard Skill Integration

This directory contains the `SKILL.md` required for OpenClaw (your AI agent) to natively interact with the PM Dashboard.

## How to Install this Skill to OpenClaw

To make OpenClaw aware of this PM Dashboard and its APIs, you need to register it as an official "Skill" in the OpenClaw agent's directory.

1. **Locate your OpenClaw Skills Folder:**
   Usually, this is located in your home directory at `~/.gemini/antigravity/skills/` or within your workspace at `.agents/skills/`.
2. **Create the Skill Directory:**
   ```bash
   mkdir -p ~/.gemini/antigravity/skills/pm-dashboard-api
   ```
3. **Create the `SKILL.md` file:**
   Copy the entire markdown block below and paste it into `~/.gemini/antigravity/skills/pm-dashboard-api/SKILL.md`.
4. **Usage:**
   Once installed, you can simply ask OpenClaw: *"Please check the PM Dashboard for tasks in the Mobile App Launch project"*, and OpenClaw will automatically use this skill to curl the local API endpoints and provide you a summary!

---

## 📄 The SKILL.md Content

Copy the content between the `---` delimiters below, ensuring you include the YAML frontmatter at the top.

```markdown
---
name: pm-dashboard-api
description: Interacts with the local PM Dashboard via REST API to read, create, update, and manage Projects, Tasks, and Issues.
---

# PM Dashboard API Skill

You are designated as an intelligent assistant capable of managing a local Project Management (PM) Dashboard. The dashboard runs locally at `http://localhost:3000`. 
Instead of modifying the JSON database files directly, you MUST use the provided REST API endpoints. This ensures data consistency and prevents file lock collisions with the active web application.

## System Architecture

The database is built on a few core Tables (Databases). Each database contains multiple `Pages` (items like a specific Task or Project).

- **`db-projects`**: The master list of all Projects.
- **`db-tasks`**: The master list of all Tasks. Tasks are linked to a project via a `Project ID` property.
- **`db-issues`**: The master list of all Issues.

## Core API Endpoints

### 1. Get All Databases (Schemas)
Fetch this to understand the UUID keys for each property (like Status, Assignee, Project ID).
- **Command:** `curl -s http://localhost:3000/api/databases`
- **Output:** Returns JSON containing `id`, `name`, and `schema`.

### 2. Get Pages (List Tasks/Projects)
- **Command:** `curl -s "http://localhost:3000/api/pages?databaseId=db-tasks"`
- **Optional Filter:** Add `&projectId=<Project-UUID>` to filter tasks for a specific project.
- **Output:** Returns JSON array of `pages` belonging to the database.

### 3. Create a Page (Add a Task)
- **Command Example:**
  ```bash
  curl -s -X POST http://localhost:3000/api/pages \
    -H "Content-Type: application/json" \
    -d '{
      "databaseId": "db-tasks",
      "title": "Fix Login Bug",
      "properties": {
        "prop-12345678": "opt-1",
        "prop-abcdefgh": "Project-UUID-Here"
      },
      "content": "Detailed markdown description of the bug."
    }'
  ```
  *(Note: You must fetch the databases schema first to know which `prop-XXXX` matches "Status" or "Project ID").*

### 4. Update a Page (Change Status of a Task)
- **Command Example:**
  ```bash
  curl -s -X PATCH http://localhost:3000/api/pages \
    -H "Content-Type: application/json" \
    -d '{
      "databaseId": "db-tasks",
      "pageId": "Page-UUID-Here",
      "properties": {
        "prop-12345678": "opt-3"
      }
    }'
  ```

### 5. Delete a Page (Task/Project/Issue)
- **Command Example:**
  ```bash
  curl -s -X DELETE http://localhost:3000/api/pages \
    -H "Content-Type: application/json" \
    -d '{
      "databaseId": "db-tasks",
      "pageId": "Page-UUID-Here"
    }'
  ```

## Working Protocol

1. **When Asked to List Tasks:** First `curl /api/databases` to get the database schemas and Property IDs. Then `curl /api/pages?databaseId=db-tasks`.
2. **When Asked to Create a Project/Task:** Always fetch the target Database Schema first to ensure you map your properties to the correct `prop-XXX` UUIDs. Then fire the `POST /api/pages` request.
3. **When Asked to Delete an Entity:** Obtain the `pageId` and `databaseId` first, then securely use the `DELETE /api/pages` API.
4. **DO NOT MODIFY JSON FILES:** Never use file manipulation tools (`sed`, `echo`, node scripts) to bypass the API. Always use `curl`.
```
