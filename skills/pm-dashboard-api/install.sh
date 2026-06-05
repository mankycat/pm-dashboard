#!/bin/bash

# 取得腳本所在的絕對路徑
SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="$HOME/.openclaw/workspace/skills/pm-dashboard-api"

echo "🚀 正在安裝 PM Dashboard API Skill..."
echo "📍 來源路徑: $SKILL_DIR"

# 確保目標父目錄存在
mkdir -p "$HOME/.openclaw/workspace/skills"

# 如果目標已存在，先移除（舊版可能是會被 OpenClaw 拒絕的外部 symlink）
if [ -L "$TARGET_DIR" ] || [ -d "$TARGET_DIR" ]; then
    echo "♻️ 清除舊的安裝路徑..."
    if command -v trash >/dev/null 2>&1; then
        trash "$TARGET_DIR"
    elif command -v gio >/dev/null 2>&1; then
        gio trash "$TARGET_DIR"
    else
        mv "$TARGET_DIR" "${TARGET_DIR}.bak.$(date +%Y%m%d%H%M%S)"
    fi
fi

# OpenClaw 會拒絕 workspace/skills 底下指向外部 repo 的 symlink，
# 因此這裡改成複製實體 skill 目錄。
cp -a "$SKILL_DIR" "$TARGET_DIR"

# 確保腳本具備執行權限
chmod +x "$TARGET_DIR/scripts/pm_client.py"

echo "✅ 安裝完成！"
echo "👉 現在請在 OpenClaw 中輸入 '/new' 重新載入，或重啟 Gateway。"
echo "🔍 您可以執行 'openclaw skills list' 檢查是否出現 pm-dashboard-api。"
