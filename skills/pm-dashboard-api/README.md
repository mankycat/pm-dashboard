# PM Dashboard API Skill for OpenClaw

這是一個專門為 PM Dashboard 設計的進階 OpenClaw Skill，採用 Python 腳本封裝 API 邏輯，確保 Agent 操作的穩定性。

## 📁 目錄結構 (Structure)

```
pm-dashboard-api/
├── manifest.json      # 元數據規範
├── SKILL.md           # Agent 執行指令 (核心)
├── config.json        # 本地連線配置 (極重要)
├── scripts/
│   └── pm_client.py   # Python API 客戶端
└── README.md          # 本文件
```

## ⚙️ 配置指南 (Configuration)

當您的 Dashboard Port 變更時，**不需要重啟 OpenClaw Gateway**。請直接修改此目錄下的 `config.json`：

```json
{
  "DASHBOARD_URL": "http://localhost:9991"
}
```

修改後，Agent 會在下一次執行指令時自動讀取新的 URL。

## 🚀 部署人員須知

1. **Python 依賴**：本 Skill 使用 Python 內建的 `urllib` 與 `json` 庫，無需額外安裝 `pip` 套件。
2. **權限要求**：OpenClaw 需要具備 `shell` 與 `network` 權限方可執行 Python 腳本並訪問本地 API。
3. **路徑建議**：在 `SKILL.md` 中已知路徑為 `scripts/pm_client.py`，請確保安裝時維持此目錄結構。
