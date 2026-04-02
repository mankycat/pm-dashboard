#!/bin/bash

# 取得腳本所在的絕對路徑
SKILL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="$HOME/.openclaw/workspace/skills/pm-dashboard-api"

echo "🚀 正在安裝 PM Dashboard API Skill..."
echo "📍 來源路徑: $SKILL_DIR"

# 確保目標父目錄存在
mkdir -p "$HOME/.openclaw/workspace/skills"

# 如果目標已存在，先刪除（舊的可能連結壞了）
if [ -L "$TARGET_DIR" ] || [ -d "$TARGET_DIR" ]; then
    echo "♻️ 清除舊的安裝路覽..."
    rm -rf "$TARGET_DIR"
fi

# 建立整個資料夾的絕對路徑連結
ln -s "$SKILL_DIR" "$TARGET_DIR"

# 確保腳本具備執行權限
chmod +x "$SKILL_DIR/scripts/pm_client.py"

echo "✅ 安裝完成！"
echo "👉 現在請在 OpenClaw 中輸入 '/new' 重新載入，或重啟 Gateway。"
echo "🔍 您可以執行 'openclaw skills list' 檢查是否出現 pm-dashboard-api。"
