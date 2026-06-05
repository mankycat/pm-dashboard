#!/usr/bin/env python3
import os
import json
import sys
import argparse
import urllib.request
import urllib.error

def get_base_url():
    # Priority 1: config.json in the same directory as this script's parent
    script_dir = os.path.dirname(os.path.abspath(__file__))
    skill_dir = os.path.dirname(script_dir)
    config_path = os.path.join(skill_dir, "config.json")
    
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
                if "DASHBOARD_URL" in config:
                    return config["DASHBOARD_URL"].rstrip("/")
        except Exception:
            pass

    # Priority 2: Environment Variable
    env_url = os.environ.get("PM_DASHBOARD_URL")
    if env_url:
        return env_url.rstrip("/")

    # Priority 3: Default
    return "http://localhost:3000"

def make_request(method, path, data=None):
    url = f"{get_base_url()}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
    
    try:
        with urllib.request.urlopen(req, data=body) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"Error: HTTP {e.code} - {e.reason}", file=sys.stderr)
        try:
            print(e.read().decode("utf-8"), file=sys.stderr)
        except:
            pass
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Error: Failed to reach server at {url}. Is the Dashboard running?", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="PM Dashboard API CLI Client")
    subparsers = parser.add_subparsers(dest="action", help="Action to perform")

    # Command: databases
    subparsers.add_parser("databases", help="List all databases")

    # Command: pages
    pages_parser = subparsers.add_parser("pages", help="Manage pages")
    pages_parser.add_argument("--db", required=True, help="Database ID")
    pages_parser.add_argument("--project", help="Filter by Project ID")

    # Command: create
    create_parser = subparsers.add_parser("create", help="Create a new item")
    create_parser.add_argument("--db", required=True, help="Database ID")
    create_parser.add_argument("--title", required=True, help="Item title")
    create_parser.add_argument("--props", help="Properties JSON string")
    create_parser.add_argument("--content", help="Page content")

    # Command: update
    update_parser = subparsers.add_parser("update", help="Update an item")
    update_parser.add_argument("--db", required=True, help="Database ID")
    update_parser.add_argument("--id", required=True, help="Page ID")
    update_parser.add_argument("--title", help="New title")
    update_parser.add_argument("--props", help="Properties JSON string")
    update_parser.add_argument("--content", help="New content")

    # Command: delete
    delete_parser = subparsers.add_parser("delete", help="Delete an item")
    delete_parser.add_argument("--db", required=True, help="Database ID")
    delete_parser.add_argument("--id", required=True, help="Page ID")

    args = parser.parse_args()

    if args.action == "databases":
        result = make_request("GET", "/api/databases")
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.action == "pages":
        path = f"/api/pages?databaseId={args.db}"
        if args.project:
            path += f"&projectId={args.project}"
        result = make_request("GET", path)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.action == "create":
        props = json.loads(args.props) if args.props else {}
        data = {
            "databaseId": args.db,
            "title": args.title,
            "properties": props,
            "content": args.content or ""
        }
        result = make_request("POST", "/api/pages", data)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.action == "update":
        props = json.loads(args.props) if args.props else {}
        data = {
            "databaseId": args.db,
            "pageId": args.id,
            "title": args.title,
            "properties": props,
            "content": args.content
        }
        result = make_request("PATCH", "/api/pages", data)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.action == "delete":
        data = { "databaseId": args.db, "pageId": args.id }
        result = make_request("DELETE", "/api/pages", data)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
