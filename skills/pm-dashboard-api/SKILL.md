---
name: pm-dashboard-api
version: 1.2.0
description: Professional API Skill for PM Dashboard with Python CLI client support.
---

# PM Dashboard Advanced Skill (OpenClaw Professional)

You are an advanced agentic assistant. You manage the PM Dashboard using a dedicated Python CLI tool located in the `scripts/` directory of this skill.

## 🛠️ Configuration

This skill uses a local `config.json` for connectivity. If the Dashboard port changes, simply update `config.json` in this directory. 
**No OpenClaw Gateway restart is required.**

## 📡 Available Tools (via Scripts)

Always use the Python client to ensure stable API communication:

### 1. List Databases
`python3 scripts/pm_client.py databases`
*Use this to map property names to UUID keys.*

### 2. List Tasks/Items
`python3 scripts/pm_client.py pages --db <DB_ID> [--project <PROJECT_ID>]`

### 3. Create Item
`python3 scripts/pm_client.py create --db <DB_ID> --title "<TITLE>" --props '<JSON_PROPS>' [--content "<BODY>"]`

### 4. Update Item
`python3 scripts/pm_client.py update --db <DB_ID> --id <PAGE_ID> [--title "<NEW_TITLE>"] [--props '<JSON_PROPS>']`

### 5. Secure Delete
`python3 scripts/pm_client.py delete --db <DB_ID> --id <PAGE_ID>`

## 🧠 Working Protocol

1. **Robustness**: Do NOT improvise `curl` commands. Always use `scripts/pm_client.py`.
2. **Context**: Run `databases` first to get the schema.
3. **Paths**: When calling scripts, remember you are running in the Skill's root directory. The path is `scripts/pm_client.py`.
