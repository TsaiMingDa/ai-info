## MODIFIED Requirements

### Requirement: 每日定時抓取五來源
系統 SHALL 每天於設定的固定時間（透過 Claude Code Remote Routine 的 cron schedule 或本機手動執行）執行一次抓取流程，依序處理五個來源：`https://www.threads.com/@boris_cherny`、`https://threadreaderapp.com/user/trq212`、`https://www.anthropic.com/news`、`https://www.threads.com/@claudeai`、`https://code.claude.com/docs/en/changelog`。

抓取後，系統 SHALL 將所有新貼文依發布時間（Asia/Taipei 時區）分桶到對應日期，並為每個目標日期分別產出或補充 `posts/{DATE}.md` 檔案。

#### Scenario: 五來源皆有當日新內容
- **WHEN** Routine 於排程時間觸發
- **THEN** 系統依序處理五個來源，擷取自上次 digest 後的新貼文/更新，依發布日期分桶後彙整為對應日期的 MD 檔案

#### Scenario: 部分來源無當日新內容
- **WHEN** Routine 執行時，某來源自上次 digest 後無新貼文
- **THEN** 該來源在每個目標日期的 section 內容標記為「（今日無更新）」（若為新建檔案）或維持不動（若為既有檔案）

#### Scenario: 來源頁面無法存取
- **WHEN** Routine 執行時，某來源 URL 回傳錯誤或結構大幅改變導致無法擷取
- **THEN** 該來源 section 標記為「（今日抓取失敗：[簡短原因]）」，其他來源仍正常處理

#### Scenario: 多天未執行後重跑
- **WHEN** Routine 距上次執行已超過一天
- **THEN** 系統為每個缺少的日期分別產出 `posts/{DATE}.md`，貼文依發布日期歸入對應檔案

#### Scenario: 既有檔案有漏抓的貼文
- **WHEN** 某天已有 digest 檔案，但該天稍後有新貼文發布（在上次 digest 執行之後）
- **THEN** 系統以原文網址或版本號去重後，將新貼文追加到既有檔案的對應 section

### Requirement: 每日 MD 檔案格式
系統 SHALL 為每個成功執行的日期產生一個檔案 `posts/YYYY-MM-DD.md`，格式包含 YAML frontmatter 與五個來源 section。

#### Scenario: 標準 MD 結構
- **WHEN** 產生 daily MD 檔案
- **THEN** 檔案包含：
  - YAML frontmatter，至少含 `date: YYYY-MM-DD`
  - 一級標題 `# YYYY-MM-DD 每日精選`
  - 五個二級標題 section，依序為 `## boris_cherny · Threads`、`## trq212 (Thariq) · Thread Reader App`、`## claudeai · Anthropic Blog`、`## claudeai · Threads`、`## Claude Code · Changelog`

#### Scenario: 一般貼文來源 section 內含的欄位
- **WHEN** 某貼文來源（boris_cherny / trq212 / claudeai）該日有貼文內容
- **THEN** 該 section 包含五個粗體標籤欄位，依序為：`**原文網址：**`（可點擊 URL）、`**原文：**`（blockquote 引用原文；若為 snippet 則末尾附 `⚠️` 標註）、`**繁中改寫：**`（繁體中文台灣用語改寫，保留技術術語原文）、`**核心概念（簡單說）：**`（一段易懂但不失專業深度的說明）、`**前端工程師實際應用：**`（含跟工作關聯、具體場景、本週可嘗試行動三項要點）

#### Scenario: Changelog section 內含的欄位
- **WHEN** Claude Code Changelog 有當日版本更新
- **THEN** 該 section 包含四個粗體標籤欄位：`**版本號 / 日期：**`（版本號與日期）、`**變更項目：**`（條列變更內容，保留英文原文加繁中說明）、`**核心概念（簡單說）：**`、`**前端工程師實際應用：**`

#### Scenario: 同來源同日多則貼文
- **WHEN** 某來源該日有多則貼文
- **THEN** 同一個 section 內以 `---` 水平線分隔多則，每則皆包含完整欄位
