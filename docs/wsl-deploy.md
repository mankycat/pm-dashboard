# PM Dashboard - WSL Deployment Guideline

這份指南將協助您在 Windows Subsystem for Linux (WSL) 環境下，穩定部署並長期運行此 PM Dashboard。部署完成後，您將能在 Windows 本機瀏覽器訪問系統，同時 WSL 內的 OpenClaw AI Assistant 也能透過 API 存取讀取與更新專案。

## 1. 系統環境準備

請確保您的 WSL (推薦 Ubuntu) 內已安裝 Node.js：

```bash
# 安裝 nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重啟終端機後，安裝 Node.js (推薦 v20 LTS)
nvm install 20
nvm use 20
```

## 2. 應用程式建置 (Build)

將本專案複製或移動至 WSL 資料夾後，進入專案目錄安裝依賴並打包：

```bash
cd pm-dashboard

# 安裝所有必要套件
npm install

# 進行生產環境打包 (Production Build)
npm run build
```

*(此打包過程會對 Next.js 的路由進行最佳化並檢查 TypeScript 語法錯誤)*

## 3. 背景長期運行系統 (PM2)

為了讓 PM Dashboard 能在您關閉終端機後依然在背景執行，強烈建議使用 `pm2` 來進行進程管理：

```bash
# 全局安裝 pm2 工具
npm install -g pm2

# 在背景啟動 Next.js 伺服器，並命名為 'pm-dashboard'
pm2 start npm --name "pm-dashboard" -- start

# 指定 port
pm2 start npm --name "pm-dashboard" -- start -- -p 58081

# 綁定所有網卡
pm2 start npm --name "pm-dashboard" -- start -- -H 0.0.0.0 -p 58081

# 設定開機自動重啟 pm2 (選用)
pm2 startup
pm2 save
pm2 list

# 常用 pm2 指令：
# 監控運行狀態: pm2 monit
# 查看日誌:    pm2 logs pm-dashboard
# 重新啟動:    pm2 restart pm-dashboard
# 停止服務:    pm2 stop pm-dashboard
```

## 4. 網路埠號映射 (Network Bridging)

預設情況下，應用會啟動在 WSL 內部的 `http://localhost:3000`。
Windows 10/11 的 WSL2 通常已自動處理 `localhost` 轉發，這意味著：

1. **對於 OpenClaw AI (執行在 WSL 內)**：它是直接存取 `http://localhost:3000`，完全不需任何設定。
2. **對於 Windows 本機瀏覽器**：您只需要打開 Chrome/Edge 並輸入 `http://localhost:3000` 即可無縫存取。

### Troubleshooting: 無法從 Windows 存取

如果 `http://localhost:3000` 拒絕連線，可能是綁定的 IP 問題。請透過修改啟動腳本，強制讓系統監聽 `0.0.0.0`：

建立一個名為 `server.sh` 的檔案：
```bash
#!/bin/bash
npm run start -- -H 0.0.0.0 -p 3000
```
然後用 pm2 啟動該腳本：
`pm2 start server.sh --name "pm-dashboard"`
如此一來，Windows 就能透過 `localhost:3000` 或是 `WSL_IP:3000` 進行訪問。

## 5. AI Agent API 存取與 OpenClaw Skill 安裝

部署完成後，OpenClaw AI 即可透過 API 隧道控制此專案。API 核心端點：
- `GET http://localhost:3000/api/databases` (用來取得可用的欄位 UUID)
- `GET/POST/PATCH/DELETE http://localhost:3000/api/pages` (查閱或編輯個別的 Task/Project)

為協助 OpenClaw 更精確地理解這些端點，專案內已準備了一份符合原廠封裝標準的 AI 技能檔案：
👉 **`pm-dashboard-api.skill`** (位於專案根目錄) 
👉 以及原始碼 **`docs/openclaw-pm-skill.md`**。

### 如何將技能指派給 OpenClaw？

請依照您 OpenClaw (Clawdbot) 實際佈署的情況挑選以下方案進行安裝：

#### 方案 A：Web / 終端機介面最速安裝 (推薦)
若您有使用類似網頁版或提供附件檔案上傳功能的 Client 端：
1. 將專案底下的 `pm-dashboard-api.skill` 檔案上傳或拖曳給 OpenClaw。
2. 對它說：*「請幫我安裝這份技能庫，這是 PM Dashboard 的 API 操作教學。」*
3. 安裝後，OpenClaw 就會常駐這套系統規則，能自動將您的文字轉換為 REST API Request 來讀寫資料庫。

#### 方案 B：Linux Docker Server 手動掛載 (適合背景持久環境)
如果您是把 OpenClaw 架設在遠端的 Linux Docker Container 中（如您先前的部署經驗）：
1. 在宿主機 (Host) 上定位出對應至 OpenClaw 內部的 `skills` 映射目錄 (如 `~/.gemini/antigravity/skills/` 或是 `./agents/skills/`)。
2. 建立新資料夾 `pm-dashboard-api`。
3. 把 `docs/openclaw-pm-skill.md` 裡的文字內容（或將 `.skill` 檔解壓縮拿出的 `SKILL.md`）放入該資料夾：
   ```bash
   # 預期檔案路徑長相：
   /your/host/mapped/skills/pm-dashboard-api/SKILL.md
   ```
4. 確認檔案存入後，重啟該 Docker Container 或是開啟全新 Session。
5. 接著您就能遠端向內部的 AI 下令：*「請讀取 API 幫我梳理這個禮拜未完成的工單」*，而 AI 將能順利呼叫 `localhost:3000` (或 Docker network IP) 來完成工作。
