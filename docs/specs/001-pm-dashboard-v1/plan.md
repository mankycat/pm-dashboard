# 實作計畫：PM Dashboard V1

**分支**：`001-pm-dashboard-v1` | **日期**：2026-02-03
**規格**：[spec.md](./spec.md)

## 摘要

建立一個基於 Next.js 的專案管理儀表板，使用本地 JSON 檔案作為資料庫。支援專案與任務的 CRUD，並提供甘特圖視覺化。重點在於實現 Agent 與 User 的「共同編輯」能力。

## 技術上下文

**語言／版本**：TypeScript 5.x, Node.js 18+
**主要相依性**：Next.js 14+ (App Router), Tailwind CSS
**儲存方式**：JSON File System (`data/projects.json`)
**測試**：Manual Validation (V1), Jest (Future)
**目標平台**：GitHub Codespaces (Linux Container)
**專案類型**：Web Application (Monorepo-style in Skill assets)

## 專案憲章檢查

### Phase -1: Pre-Implementation Gates
#### Simplicity Gate (Article VII)
- [x] Using ≤3 projects? (Yes, single Next.js app)
- [x] No future-proofing? (Yes, V1 visual only, no complex scheduling engine)

#### Anti-Abstraction Gate (Article VIII)
- [x] Using framework directly? (Yes, Server Actions for data mutation)
- [x] Single model representation? (Yes, direct JSON mapping)

## 專案結構

### 原始碼 (`assets/pm-dashboard`)

```text
app/
├── actions.ts           # Server Actions (CRUD logic)
├── page.tsx             # Main Dashboard View
├── layout.tsx           # Global Layout
└── components/
    ├── ProjectList.tsx  # Sidebar / List view
    ├── TaskBoard.tsx    # Task Management view
    └── GanttChart.tsx   # Timeline view
lib/
└── data.ts              # Low-level JSON read/write utilities
data/
└── projects.json        # The "Database"
```

## 實作步驟 (Tasks)

1.  **Data Layer**: 定義 `Project` 與 `Task` 的 TypeScript Interface，並實作 `lib/data.ts` (讀寫 JSON)。
2.  **Seed Data**: 建立初始的 `data/projects.json`。
3.  **UI Components**:
    - 實作左側專案列表。
    - 實作任務列表 (CRUD)。
    - 實作甘特圖 (使用簡易 CSS Grid 或 SVG 繪製)。
4.  **Integration**: 將 UI 按鈕綁定至 Server Actions。
