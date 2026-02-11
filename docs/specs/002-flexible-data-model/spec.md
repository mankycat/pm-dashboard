# 功能規格說明: PM Dashboard V2 (Flexible Core)

**功能分支**: `002-flexible-data-model`
**建立日期**: 2026-02-05
**狀態**: 草稿 (Draft)

## 概述

為了滿足「像 Notion 一樣自由調整欄位」以及「Agent 深度協作」的需求，V2 版本將重構核心資料層。
不再鎖死 `Project` 與 `Task` 的欄位，而是引入 `Database` (資料庫) 與 `Property` (屬性) 的概念。

## 用戶情境

### User Story 1 - 自定義資料庫欄位
作為 User，我希望能為 "Tasks" 資料庫新增一個 "Difficulty" (Select) 欄位，並定義選項 (Easy, Medium, Hard)，以便我能更精細地分類任務。

- **驗收標準**:
    1. 前端或 Config 支援新增 Property。
    2. 新增後，既有資料不受影響，新資料可選取該選項。
    3. UI 列表應能顯示新欄位。

### User Story 2 - Agent 協作更新
作為 OpenClaw (Agent)，我需要能讀取 `data/` 目錄下的 JSON 結構，理解當前的 Schema，並插入一條新的 Task，包含正確的屬性值 (如 Status=Todo, Difficulty=Hard)。

- **驗收標準**:
    1. 資料結構需足夠清晰 (Self-describing)，Agent 讀取 `databases.json` 即可知曉填寫規則。
    2. Agent 產生的 JSON 寫入後，前端需能正常讀取顯示。

### User Story 3 - 多維度視圖 (未來的基礎)
作為 User，我希望能切換不同的視圖 (Table, Board)，系統應根據我定義的 "Status" 欄位自動分組。

## 功能需求 (Functional Requirements)

- **FR-CORE-001**: 系統需支援讀寫 `databases.json` 定義 Schema。
- **FR-CORE-002**: 系統需支援依據 `databaseId` 分檔儲存 Pages (`data/pages/{id}.json`)。
- **FR-CORE-003**: 支援以下基礎屬性類型：
    - Text
    - Number
    - Select (Single Selection)
    - Status (Special Select with semantic groups)
    - Date (Single or Range)
- **FR-UI-001**: 專案列表頁應改為 "Databases List"。
- **FR-UI-002**: 資料庫詳情頁應支援 "Table View" (動態渲染表頭)。

## 技術限制與決策

- **儲存**: 維持 Local JSON，但進行正規化拆分，避免單一檔案過大。
- **ID 生成**: 全面使用 UUID v4。
- **並發處理**: 暫不考慮多人同時寫入的鎖機制 (因為是單人+Agent 協作，且多為串行操作)。
