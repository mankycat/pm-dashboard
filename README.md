# PM Dashboard (Spec-Driven)

這是一個基於 **Spec-Driven Development (SDD)** 方法論開發的專案管理儀表板。
由 Agent (Amber) 與 User (Bruce) 共同維護。

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

## 🚀 快速開始

1.  **安裝依賴**:
    ```bash
    npm install
    ```
2.  **啟動開發伺服器**:
    ```bash
    npm run dev
    ```
3.  **訪問**: `http://localhost:3000`

## 🏗️ 架構說明

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Server Actions (Direct FS Access)
- **Database**: `/data/projects.json` (Local JSON File)

## 🤝 協作模式

- **User**: 透過 Web UI 操作，或直接修改代碼。
- **Agent**: 透過讀取 `docs/specs` 理解需求，並直接推送代碼更新。
