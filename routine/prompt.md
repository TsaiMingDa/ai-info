# Dev Daily Digest — Routine Prompt

---

你是我的每日開發者內容整理助理。請依照以下步驟執行今天（台北時間）的內容蒐集與整理任務。

## 1. 取得今天的日期

工作目錄為 `ai-info` repo 根目錄，環境為 Windows / PowerShell。執行：

```powershell
Get-Date -Date ((Get-Date).ToUniversalTime().AddHours(8)) -Format 'yyyy-MM-dd'
```

結果即為 `{TODAY}`，後續步驟所有 `{TODAY}` 都替換為這個字串。

## 2. 準備工作目錄

確認目前工作目錄是 `ai-info` repo 的根目錄，且 `posts/` 目錄存在。
如果 `posts/{TODAY}.md` 已存在，覆蓋它。

## 3. 蒐集五個來源的內容（Chrome DevTools MCP 優先策略）

### 抓取策略總則

使用 `chrome-devtools` MCP 連接你**正在運行的 Chrome 瀏覽器**（含登入狀態），可直接存取 Threads 等需要登入的網站。

每個來源都遵循以下三階段流程：

**階段 A — Chrome DevTools MCP 直接瀏覽（主要策略）**
用 chrome-devtools MCP 開啟來源頁面並取得完整渲染後的內容：
1. `navigate_page` 導航到目標 URL（type: "url"）
2. `wait_for` 等待頁面主要內容載入（等待貼文或文章清單出現）
3. `take_snapshot` 取得頁面 accessibility snapshot，從中解析**今天（台北時區）發布**的貼文

**成功 →** 使用 Chrome DevTools 取得的完整頁面內容進行整理。
**Chrome DevTools 無法取得今日內容**（MCP 未連線、找不到今日貼文）→ 進入階段 B。

**階段 B — WebSearch 探索（Fallback）**
用 WebSearch 找出該作者/網站今天的內容：
- `site:<domain> <關鍵字> <日期或近期關鍵字>`
- 例如：`site:threads.net @boris_cherny 2026`、`site:anthropic.com/news`

從搜尋結果中篩選出**今天（台北時區）發布**的條目，取得 URL 與 snippet。
若找到 URL，可再嘗試用 `navigate_page` + `take_snapshot` 取得完整內容。
若仍無法取得，退回使用 WebSearch snippet 作為原文素材，並在該則貼文末尾標註：
`> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`

**找不到今天內容時：** 在該 section 內寫「（今日無更新）」。
**階段 A 與階段 B 皆失敗時：** 在該 section 內寫「（今日抓取失敗：Chrome DevTools MCP 未連線且 WebSearch 無結果）」。

---

### 來源 1：boris_cherny（Threads）

- **Chrome DevTools 目標 URL：** `https://www.threads.com/@boris_cherny`
- **等待條件：** `wait_for` 等待頁面載入貼文清單
- **備註：** Threads 需登入；chrome-devtools MCP 連接已登入的 Chrome，可直接看到內容
- **WebSearch Fallback 查詢：** `site:threads.net @boris_cherny` 或 `boris_cherny threads {TODAY 月份}`

### 來源 2：trq212 / Thariq（Thread Reader App）

- **Chrome DevTools 目標 URL：** `https://threadreaderapp.com/user/trq212`
- **等待條件：** `wait_for` 等待 thread 清單出現
- **WebSearch Fallback 查詢：** `site:threadreaderapp.com trq212` 或 `Thariq trq212 thread {TODAY 月份}`

### 來源 3：claudeai（Anthropic Blog）

- **Chrome DevTools 目標 URL：** `https://www.anthropic.com/news`
- **等待條件：** `wait_for` 等待文章清單出現
- **備註：** 找到今日文章 URL 後，可再 `navigate_page` 到文章頁取得完整正文
- **WebSearch Fallback 查詢：** `site:anthropic.com/news {TODAY 月份}` 或 `Anthropic news {TODAY}`

### 來源 4：claudeai（Threads）

- **Chrome DevTools 目標 URL：** `https://www.threads.com/@claudeai`
- **等待條件：** `wait_for` 等待頁面載入貼文清單
- **備註：** 同來源 1，連接已登入的 Chrome 直接存取
- **WebSearch Fallback 查詢：** `site:threads.net @claudeai` 或 `claudeai threads {TODAY 月份}`

### 來源 5：Claude Code Changelog

- **Chrome DevTools 目標 URL：** `https://code.claude.com/docs/en/changelog`
- **等待條件：** `wait_for` 等待 changelog 內容載入
- **備註：** Changelog 通常可正常存取；內容是版本更新紀錄，以「版本號 / 日期 / 變更項目」形式整理
- **WebSearch Fallback 查詢：** `Claude Code changelog {TODAY 月份}`

## 4. 整理每則貼文

對每則找到的貼文，產生以下五個欄位：

**原文網址：** 該貼文的直連 URL（必須是可點擊的完整 URL）

**原文：** 原始貼文完整內容，以 blockquote 格式呈現（每行前加 `> `）
- 若內容來自 WebSearch snippet（非完整原文），在 blockquote 末尾加註：`> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`

**繁中改寫：** 以繁體中文台灣用語改寫，技術術語保留原文（例如 TypeScript、API、hook 不翻譯）。改寫要自然流暢，不要像機器翻譯。
- 若原文只是 snippet，改寫範圍以 snippet 為準，不要憑空補充內容。

**核心概念（簡單說）：** 用一到兩段話解釋這篇在說什麼。標準：一個不熟悉這個主題的前端工程師讀完後，要能快速掌握核心，但解釋要有技術深度，不要流於空泛。可以用比喻或類比。

**前端工程師實際應用：** 以下三點，用 markdown bullet list 格式：
- **跟你工作的關聯：** 這件事跟前端工程師的日常工作有什麼直接關聯
- **具體場景：** 用一個具體的使用場景說明（越實際越好，可以提到具體的工具、框架、指令）
- **這週可以嘗試：** 一個可以立刻行動的建議（具體、可執行的小步驟）

**Claude Code Changelog 例外：** 來源 5 的格式略有不同，每筆 entry 只需要：
- **版本號 / 日期**
- **變更項目：** 條列原文變更內容（保留英文原文 + 繁中說明）
- **核心概念（簡單說）：** 這次更新主要做了什麼
- **前端工程師實際應用：** 一樣三點 bullet list（跟你工作的關聯 / 具體場景 / 這週可以嘗試）

## 5. 產生 MD 檔案

按照以下格式產生 `posts/{TODAY}.md`：

```markdown
---
date: {TODAY}
---

# {TODAY} 每日精選

## boris_cherny · Threads

**原文網址：** [URL]

**原文：**
> [原文內容，每行前有 > ]

**繁中改寫：**
[改寫內容]

**核心概念（簡單說）：**
[解釋]

**前端工程師實際應用：**
- **跟你工作的關聯：** [...]
- **具體場景：** [...]
- **這週可以嘗試：** [...]

---

## trq212 (Thariq) · Thread Reader App

[同格式]

---

## claudeai · Anthropic Blog

[同格式]

---

## claudeai · Threads

[同格式]

---

## Claude Code · Changelog

**版本號 / 日期：** [version / date]

**變更項目：**
- [變更內容 1]
- [變更內容 2]

**核心概念（簡單說）：**
[解釋]

**前端工程師實際應用：**
- **跟你工作的關聯：** [...]
- **具體場景：** [...]
- **這週可以嘗試：** [...]
```

**注意：**
- 如果某來源有多則貼文 / 多筆 entry，在同一 section 內用 `---` 分隔，每則都有完整欄位
- 「今日無更新」和「今日抓取失敗」的 section 只要寫那一行即可，不需要其他欄位
- 若整則內容來自 snippet，「原文」欄位末尾要附上 `> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`

## 6. Commit 並 push 到 main

執行以下 git 操作（PowerShell）：

```powershell
git checkout main
git pull origin main
git add posts/{TODAY}.md
git commit -m "digest: {TODAY}"
git push origin main
```

注意：
- 不再開 feature branch、不再開 PR
- 若 `posts/{TODAY}.md` 已存在被覆寫，commit message 維持同一句，git 視為一般更新 commit
- push 後 GitHub Actions 會自動觸發部署（`.github/workflows/deploy.yml`），不需額外操作

## 7. 完成

輸出執行摘要：
- 哪些來源有找到今日內容（並標註：完整原文 / 僅 snippet）
- 哪些來源無更新或抓取失敗
- 本次 commit 的 SHA（可由 `git rev-parse HEAD` 取得）
- 提示：GitHub Pages 部署通常在 push 後 1-2 分鐘內完成，屆時即可在網站看到新內容
