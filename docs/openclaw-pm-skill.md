# OpenClaw PM Dashboard Skill Integration

本資源包含將 OpenClaw 與 PM Dashboard 串接所需的專業 Skill 目錄架構與安裝指南。

## 📂 專業型 Skill 目錄結構 (Official Support)

我們在專案根目錄下維護了一個模組化的 OpenClaw Skill：
```
skills/pm-dashboard-api/
├── manifest.json      # 核心元數據 (Casing: lowercase)
├── SKILL.md           # Agent 執行指令 (Casing: Uppercase)
├── config.json        # 本地連線配置 (極重要)
├── scripts/
│   └── pm_client.py   # Python API 客戶端
└── README.md          # 技能部署說明
```

## 🚀 安裝步驟 (Installation)

1. **建立存放目錄**：
   ```bash
   (no needed for openclaw)
   mkdir -p ~/.gemini/antigravity/skills/pm-dashboard-api

   chmod +x skills/pm-dashboard-api/scripts/pm_client.py
   ```
2. **連結目錄 (Symlink)**：
   我們強烈建議直接連結整個目錄，這樣腳本與配置才能保持完整：
   ```bash
   # 請根據您的實際路徑調整
   ln -s /path/to/pm-dashboard/skills/pm-dashboard-api/* ~/.gemini/antigravity/skills/pm-dashboard-api/
   ```

## ⚙️ 修改 Port 不需要重啟 Gateway

當您的 Dashboard 啟動在自定義 Port (例如 `9991`) 時，請**直接修改 Skill 目錄下的 `config.json`**：

```json
{
  "DASHBOARD_URL": "http://localhost:9991"
}
```

修改後，OpenClaw Agent 會在下次呼叫指令時自動讀取 `config.json` 中的新 URL，**無需重啟 Gateway**。

## 📡 驗證安裝 (Verification)

安裝後，問 OpenClaw：
> "幫我看看目前 Dashboard 有哪些專案？"

Agent 會自動調用 `scripts/pm_client.py` 進行數據抓取。您可以在日誌中看到：
`python3 scripts/pm_client.py databases`

---

## ⚡ 進階：開發人員調核

如果您想手動測試 API 通訊，可以嘗試直接執行：
```bash
python3 skills/pm-dashboard-api/scripts/pm_client.py databases
```
這將確保您的 Python 環境與網路連線皆正常運作。
