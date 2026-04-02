# OpenClaw PM Dashboard Skill Integration

本資源包含將 OpenClaw 與 PM Dashboard 串接所需的專業 Skill。

## 📂 快速安裝 (Recommended)

我們提供了一個自動化腳本來處理絕對路徑的連結，避免符號連結失效：

1. **進入專案目錄**：
   ```bash
   cd pm-dashboard
   ```
2. **執行安裝腳本**：
   ```bash
   bash skills/pm-dashboard-api/install.sh
   ```

這個腳本會自動將 `skills/pm-dashboard-api` 連結到 `~/.openclaw/workspace/skills/pm-dashboard-api`。

---

## 🛠️ 手動安裝 (Manual)

如果您偏好手動操作，請務必使用 **絕對路徑**：

```bash
# 1. 確保目錄存在
mkdir -p ~/.openclaw/workspace/skills

# 2. 建立絕對路徑連結 (請將 /path/to 替換為實際路徑)
ln -s $(realpath skills/pm-dashboard-api) ~/.openclaw/workspace/skills/pm-dashboard-api

# 3. 賦予權限
chmod +x skills/pm-dashboard-api/scripts/pm_client.py
```

## ⚙️ 修改 Port 不需要重啟 Gateway

當您的 Dashboard 啟動在自定義 Port (例如 `58081`) 時，請直接修改 Skill 目錄下的 `config.json`：

```json
{
  "DASHBOARD_URL": "http://localhost:58081"
}
```

修改後，Agent 下次呼叫指令時會即時生效。

## 📡 驗證安裝 (Verification)

1. 在 OpenClaw 對話中輸入 `/new`。
2. 問 Agent：`"這是一個開發測試，請列出目前的資料庫清單作為確認"`。
3. Agent 應該會調用 `python3 scripts/pm_client.py databases`。
