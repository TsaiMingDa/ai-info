## ADDED Requirements

### Requirement: 靜態前端應用
系統 SHALL 提供一個 React + Vite 建置的靜態前端網站，部署於 GitHub Pages。

#### Scenario: 網站載入
- **WHEN** 使用者瀏覽網站根路徑
- **THEN** React app 載入，並 fetch `posts.json` 取得所有貼文資料

#### Scenario: 載入失敗處理
- **WHEN** `posts.json` 無法載入或解析
- **THEN** 網站顯示錯誤訊息「無法載入內容，請稍後重試」，不顯示空白畫面

### Requirement: 卡片列表顯示
系統 SHALL 以卡片列表形式呈現貼文摘要，類似搜尋結果樣式。

#### Scenario: 預設顯示最新一日
- **WHEN** 使用者首次開啟網站
- **THEN** 預設顯示最近一日的所有貼文卡片，依作者順序排列

#### Scenario: 卡片摘要欄位
- **WHEN** 列出每張卡片
- **THEN** 卡片至少顯示：作者名稱、來源平台名稱、日期、繁中改寫前 1-2 行摘要、原文網址外連按鈕

### Requirement: 日期篩選與導航
系統 SHALL 提供日期篩選與導航控制。

#### Scenario: 日期選擇器
- **WHEN** 使用者操作日期篩選控制
- **THEN** 提供日期下拉或日曆 picker，僅可選擇實際有資料的日期（從 posts.json 的 `dates` 陣列產生）

#### Scenario: 上一日／下一日導航
- **WHEN** 使用者點擊「上一日」或「下一日」按鈕
- **THEN** 跳到資料中相鄰的有效日期；若已是邊界，按鈕 disabled

### Requirement: 作者篩選
系統 SHALL 提供作者篩選功能。

#### Scenario: 作者快速切換
- **WHEN** 使用者點擊作者標籤（[全部][boris_cherny][trq212][claudeai]）
- **THEN** 卡片列表即時篩選為該作者的貼文；可與日期篩選同時生效（取交集）

### Requirement: 詳細內容展開
系統 SHALL 支援點擊卡片查看完整內容。

#### Scenario: 展開詳細內容
- **WHEN** 使用者點擊卡片
- **THEN** 顯示完整詳細內容，包含：原文網址、原文（blockquote 樣式）、繁中改寫、核心概念說明、前端工程師實際應用三段；可採模態視窗或卡片展開兩種互動方式

#### Scenario: 收合或關閉
- **WHEN** 使用者操作關閉動作（按 X、按 Esc、或點擊背景）
- **THEN** 詳細內容收合或關閉，回到卡片列表狀態

### Requirement: 最後更新時間顯示
系統 SHALL 在頁面顯示最後更新時間。

#### Scenario: 顯示 build time
- **WHEN** 使用者瀏覽任一頁面
- **THEN** 頁面 footer 或 header 顯示「最後更新：YYYY-MM-DD HH:mm」（取自 build 階段注入的時間戳，依台北時區）
