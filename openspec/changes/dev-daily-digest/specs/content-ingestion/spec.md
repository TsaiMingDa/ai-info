## ADDED Requirements

### Requirement: 每日定時抓取五來源
系統 SHALL 每天於設定的固定時間（透過 Claude Code Remote Routine 的 cron schedule）執行一次抓取流程，依序處理五個來源：`https://www.threads.com/@boris_cherny`、`https://threadreaderapp.com/user/trq212`、`https://www.anthropic.com/news`、`https://www.threads.com/@claudeai`、`https://code.claude.com/docs/en/changelog`。

抓取策略採兩階段流程：**WebSearch 探索**（找出今日內容的 URL 與摘要）→ **WebFetch 取得完整內容**（若失敗則 fallback 到 snippet，並在 MD 內標註 `⚠️ 本則內容為搜尋摘要（snippet），非完整原文`）。

#### Scenario: 五來源皆有當日新內容
- **WHEN** Routine 於排程時間觸發
- **THEN** 系統依序處理五個來源，擷取當日（依台北時區）的新貼文/更新，並彙整為單一 daily MD 檔案

#### Scenario: 部分來源無當日新內容
- **WHEN** Routine 執行時，某來源無當日新貼文
- **THEN** 該來源 section 內容標記為「（今日無更新）」，仍產生 MD 檔並進入 PR 流程

#### Scenario: 來源頁面無法存取
- **WHEN** Routine 執行時，某來源 URL 回傳錯誤或結構大幅改變導致無法擷取
- **THEN** 該來源 section 標記為「（今日抓取失敗：[簡短原因]）」，其他來源仍正常處理

### Requirement: 每日 MD 檔案格式
系統 SHALL 為每個成功執行的日期產生一個檔案 `posts/YYYY-MM-DD.md`，格式包含 YAML frontmatter 與三個來源 section。

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
- **THEN** 同一個 section 內以子標題或分隔線區分多則，每則皆包含上述五個欄位

### Requirement: PR 工作流程
系統 SHALL 不直接 push 到 main branch，而是透過 PR 提交每日 MD 檔案。

#### Scenario: 正常產出 PR
- **WHEN** Routine 完成 MD 產生
- **THEN** Routine 以 `digest/YYYY-MM-DD` 命名 branch、commit 訊息為 `digest: YYYY-MM-DD` 的格式 push，並開啟對應 PR；PR 標題為 `每日精選 YYYY-MM-DD`

#### Scenario: 同日重複執行
- **WHEN** 同一天 Routine 被觸發第二次（例如手動重跑）
- **THEN** 若 `digest/YYYY-MM-DD` branch 已存在，則 force-update 該 branch 並更新對應 PR；不開新 PR

### Requirement: 安全憑證使用
系統 SHALL 使用 Fine-grained Personal Access Token，且僅授權必要範圍。

#### Scenario: PAT 範圍限定
- **WHEN** 設定 Routine 使用的 GitHub PAT
- **THEN** PAT 必須為 Fine-grained 類型，僅授權目標 repo（不是 All repositories）；權限僅 `Contents: Read and write` 與 `Pull requests: Read and write`；過期時間設為 90 天

#### Scenario: PAT 不入版本控制
- **WHEN** 任何 commit 進入 repo
- **THEN** PAT 字串不出現在任何 tracked 檔案；PAT 僅存在 Routine 的 secret config

### Requirement: Routine 設定文件化
系統 SHALL 在 repo 內以可讀文件記錄 Routine 的設定方式（不含實際 PAT）。

#### Scenario: 文件提供
- **WHEN** 開發者查看 repo
- **THEN** `routine/README.md` 描述 Routine 的 prompt 範本、cron schedule、所需環境變數名稱、以及 PAT 設定步驟（不含 PAT 值）
