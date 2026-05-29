# PM Dashboard (Spec-Driven)

這是一個基於 **Spec-Driven Development (SDD)** 方法論開發的專案管理儀表板。
主要目的是建立一套由 Agent 與 User 可以共同維護使用查看編輯的工作管理工具。

## 📁 文件與規格

所有的設計文件都位於 `docs/` 目錄：

- **[功能規格書 (Spec)](./docs/specs/001-pm-dashboard-v1/spec.md)**: 定義用戶故事與驗收標準。
- **[實作計畫 (Plan)](./docs/specs/001-pm-dashboard-v1/plan.md)**: 定義技術架構與實作步驟。
- **[資料模型 (Data Model)](./docs/specs/001-pm-dashboard-v1/data-model.md)**: JSON 資料結構定義。

## ✅ 目前進度 (Current Status)

- [x] **Phase 1: Initialization** (Repo setup, Next.js scaffold)
- [x] **Phase 2: Data Layer** (Server Actions, JSON DB)
- [x] **Phase 3: UI - List View** (Project CRUD, Task CRUD)
- [x] **Phase 4: UI - Visuals** (Gantt Chart, WBS Tree)
- [x] **Phase 5: Deployment** (Codespaces Integration)
- [x] **Phase 6: Advanced UX** (Activity Logging, Batch & Cascading Deletion, Project Dropdowns)

## 🚀 環境部署與啟動指令

1. **安裝依賴**:
   ```bash
   npm install
   ```

2. **開發環境 (Development)**:
   ```bash
   # 預設啟動 (Port 3000)
   npm run dev

   # 指定 Port 啟動 (例如 8080)
   npm run dev -- -p 8080
   ```

3. **正式環境打包與發布 (Production / Deploy)**:
   如果要將專案部署到正式環境，請先執行 `build` 進行打包，再執行 `start`。
   ```bash
   # 1. 打包編譯 (Package)
   npm run build

   # 2. 啟動正式伺服器 (預設 Port 3000)
   npm run start

   # 3. 指定 Port 啟動正式伺服器 (例如 8080)
   # 方法 A: 透過 npm 參數向下傳遞
   npm run start -- -p 8080
   
   # 方法 B: 透過環境變數指定
   PORT=8080 npm run start
   ```

## 🏗️ 架構說明

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Server Actions (Direct FS Access)
- **Database**: `/data/projects.json` (Local JSON File)

## 🤝 協作模式

- **User**: 透過 Web UI 操作，或直接修改代碼。
- **Agent**: 透過讀取 `docs/specs` 理解需求，並直接推送代碼更新。
