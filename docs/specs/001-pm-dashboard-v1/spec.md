# 功能規格說明: PM Dashboard V1 (Project Management System)

**功能分支**: `001-pm-dashboard-v1`
**建立日期**: 2026-02-03
**狀態**: 草稿
**輸入**: 用戶描述: "建立一個多項目管理工具，支援 WBS、Gantt，並允許助手與用戶共同編輯維護。"

## 用戶情境與測試

### User Story 1 - 專案與任務管理 (Priority: P1)

作為一名 PM，我需要能夠建立多個專案，並在專案下新增、修改、刪除任務 (Tasks)，設定截止日期與狀態，以便追蹤進度。

**優先級說明**: 這是系統的核心資料維護功能，沒有它就無法產生報表。

**獨立測試方式**: 可透過 UI 建立一個新專案，新增三個任務，並成功修改其中一個任務的狀態。

**驗收情境**:
1. **Given** 系統無資料, **When** 用戶點擊「新增專案」並輸入名稱, **Then** 專案列表應顯示該新專案。
2. **Given** 已有專案, **When** 用戶新增一個帶有 Start/End Date 的任務, **Then** 任務列表應顯示該任務及其時間區間。
3. **Given** 任務進行中, **When** 用戶將進度拉至 100%, **Then** 任務狀態應自動變更為 "Done"。

---

### User Story 2 - 甘特圖與 WBS 視圖 (Priority: P1)

作為一名 PM，我需要以視覺化的甘特圖 (Gantt Chart) 或 WBS 樹狀圖來檢視任務的時間軸與層級關係。

**優先級說明**: 這是 PM 掌握專案全貌的關鍵視圖。

**獨立測試方式**: 輸入一組有時間順序的任務，檢查甘特圖是否正確繪製出時間條 (Bars) 與相依性。

**驗收情境**:
1. **Given** 專案有多個任務, **When** 切換至甘特圖模式, **Then** 應依據時間軸顯示任務長條圖。
2. **Given** 兩個任務有相依性, **When** 前置任務延後, **Then** 後續任務應在視覺上反映出影響 [NEEDS CLARIFICATION: 是否需自動推算連動時間? 或是僅視覺顯示?]

---

### User Story 3 - Agent 協作整合 (Priority: P2)

作為 Amber (Agent)，我需要能夠透過讀寫底層資料檔案，替用戶更新專案進度，而不需透過 UI 點擊。

**優先級說明**: 這是實現「共同維護」與「自動匯報」的基礎。

**獨立測試方式**: Agent 直接修改 JSON 檔，重新整理網頁後，UI 應顯示更新後的資料。

**驗收情境**:
1. **Given** Dashboard 運作中, **When** Agent 在後台更新 `data/projects.json`, **Then** 用戶在前端刷新頁面可見最新狀態。

## 需求

### 功能性需求

- **FR-001**: 系統必須支援多專案 (Multi-project) 的 CRUD。
- **FR-002**: 系統必須支援 WBS 層級結構（至少支援 Project -> Task -> Subtask 兩層）。
- **FR-003**: 系統必須提供甘特圖視圖，支援以週/月為單位的縮放。
- **FR-004**: 資料必須儲存為 [NEEDS CLARIFICATION: JSON file 或是 SQLite? 考量 Agent 易讀性建議 JSON] 格式，以便 Agent 讀寫。
- **FR-005**: 系統必須具備簡易驗證機制 (Simple Auth)，防止未授權的公網訪問。

### 主要實體

- **Project**: 包含 ID, Name, Description, Status。
- **Task**: 包含 ID, Name, StartDate, EndDate, Progress, Assignee, Dependencies。

## 成功標準

### 可衡量成果

- **SC-001**: 用戶可在 30 秒內完成一個新專案的建立與任務拆解。
- **SC-002**: Agent 可成功讀取資料檔案並生成準確的 Morning Brief。
