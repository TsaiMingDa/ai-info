# Dev Daily Digest — Routine Prompt（Local · chrome-devtools 主力版）

---

你是我的每日開發者內容整理助理。這份 prompt 是 **Local Routine 主力版**，預設你在本機 Claude Code 內執行，且專案 `.mcp.json` 已啟用 `chrome-devtools` MCP server、連到正在背景運行的 Chrome（含登入狀態）。請依以下步驟執行今天（台北時間）的內容蒐集與整理。

> 與舊版 `routine/prompt.md` 的最大差異：把 chrome-devtools MCP 的工具序列、每個來源的 wait / 解析方式、重試與降級條件全部寫死，讓行為可重現。WebSearch 只在 chrome-devtools 完全失敗時才當作 fallback。

## 0. 適用情境與前置檢查

執行前確認三件事：

1. 本機 Chrome 已開啟並背景運行，並已登入 Threads（用於來源 1 / 4）。
2. Claude Code 此 session 已連上 `chrome-devtools` MCP（可從工具列表確認 `mcp__chrome-devtools__list_pages` 等工具存在）。
3. 工作目錄是 `ai-info` repo 根目錄，shell 為 PowerShell。

**若 chrome-devtools MCP 完全無法連線**（例如呼叫 `mcp__chrome-devtools__list_pages` 直接報 MCP error）：直接中止、不要產生任何 `posts/` 檔案、提示使用者「Chrome / chrome-devtools MCP 未就緒，跳過今日 routine」，由使用者修復後手動 Run now。

## 1. 取得今天日期 `{TODAY}` 與上次 digest 時間 `{LAST_DIGEST_TIME}`

```powershell
# 今天台北日期
Get-Date -Date ((Get-Date).ToUniversalTime().AddHours(8)) -Format 'yyyy-MM-dd'

# 上次 digest commit 的台北時間（ISO 8601，含時區）
git log --format="%ai" --grep="^digest:" -1
```

- 第一個指令結果即為 `{TODAY}`，後續所有 `{TODAY}` 都替換為這個字串。
- 第二個指令結果即為 `{LAST_DIGEST_TIME}`（格式如 `2026-05-21 21:16:38 +0800`），代表「上次 digest push 完的時刻」。若 git log 無結果（第一次執行），將 `{LAST_DIGEST_TIME}` 設為 `{TODAY} 00:00:00 +0800`。

### 1.1 計算目標日期範圍 `{TARGET_DATES}`

```powershell
# 從 {LAST_DIGEST_TIME} 取出日期部分（YYYY-MM-DD）
$lastDate = ('{LAST_DIGEST_TIME}' -split ' ')[0]

# 產生 $lastDate 到 {TODAY} 之間的所有日期（含頭尾）
$start = [datetime]::ParseExact($lastDate, 'yyyy-MM-dd', $null)
$end   = [datetime]::ParseExact('{TODAY}', 'yyyy-MM-dd', $null)
$dates = @()
$cur = $start
while ($cur -le $end) {
  $d = $cur.ToString('yyyy-MM-dd')
  $dates += [pscustomobject]@{
    Date = $d
    Mode = if (Test-Path "posts/$d.md") { 'supplement' } else { 'new' }
  }
  $cur = $cur.AddDays(1)
}
$dates | Format-Table -AutoSize
```

- `{TARGET_DATES}` = 上表所有日期（`{LAST_DIGEST_DATE}` ~ `{TODAY}`，含頭尾）。
- `Mode = new`：該日的 `posts/{DATE}.md` 不存在，需產生全新檔案。
- `Mode = supplement`：該日的檔案已存在，只需補充上次 digest 後才發布、且屬於該日的新貼文。
- 若 `{LAST_DIGEST_DATE}` == `{TODAY}`（同日重跑），`{TARGET_DATES}` 只有一個日期，且必定是 `supplement` mode（除非是第一次執行，此時為 `new`）。

## 2. 準備工作目錄

確認目前工作目錄是 `ai-info` repo 根目錄，且 `posts/` 目錄存在。

對 `{TARGET_DATES}` 中每個 **Mode = supplement** 的日期：
- 讀取 `posts/{DATE}.md` 的內容。
- 在各 section（`## boris_cherny · Threads`、`## trq212 (Thariq) · Thread Reader App`、`## claudeai · Anthropic Blog`、`## claudeai · Threads`、`## Claude Code · Changelog`）中找出所有 `**原文網址：**` 欄位值與 `**版本號 / 日期：**` 欄位值。
- 記下這些值為「已知 URL/版本號集合」，後續步驟去重時使用。

## 3. chrome-devtools 通用流程

### 3.1 工具分工

- `mcp__chrome-devtools__list_pages`：開頭先列出 Chrome 現有分頁，挑一個空白或可重用的；避免每個來源都開新分頁堆爆瀏覽器。
- `mcp__chrome-devtools__new_page`：第一個來源時開一個新分頁，後續來源用 `select_page` + `navigate_page` 在同一分頁切換 URL。
- `mcp__chrome-devtools__select_page`：在多分頁時切到目標分頁。
- `mcp__chrome-devtools__navigate_page`：載入目標 URL，`type: "url"`。
- `mcp__chrome-devtools__wait_for`：等待頁面就緒訊號（文字或元素出現）。每個來源有指定就緒條件，見 §4。
- `mcp__chrome-devtools__take_snapshot`：抓 accessibility tree 解析貼文清單、時間戳、連結。這是主要解析來源。
- `mcp__chrome-devtools__evaluate_script`：當 snapshot 拿不到原文全文（例如貼文被截斷、需要展開）或拿不到絕對時間戳時，才在頁面 context 跑 JS 抽取。**只讀不寫**：不要呼叫會修改 DOM 或送 request 的 JS。
- `mcp__chrome-devtools__take_screenshot`：失敗時截圖留檔（存到系統 temp 目錄，路徑寫進執行摘要供 debug，不 commit 到 repo）。

### 3.2 「新內容」判定與日期分桶規則

判定核心：**貼文 / 文章的發布時間必須晚於 `{LAST_DIGEST_TIME}`**，才視為「本次 digest 應收錄的新內容」。

收錄後，每則貼文需**依發布日期分桶**（以 Asia/Taipei 時區為準）：
- 將貼文的 UTC 發布時間轉為台北時間（UTC+8），取日期部分 → 該貼文歸入對應的 `posts/{DATE}.md`。
- 範例：datetime `2026-05-21T18:30:00.000Z`（UTC）→ 台北時間 `2026-05-22 02:30` → 歸入 `posts/2026-05-22.md`。
- 若換算後的台北日期不在 `{TARGET_DATES}` 範圍內（比 `{LAST_DIGEST_DATE}` 更早，或比 `{TODAY}` 更晚），忽略該貼文。

各來源時間戳取得方式：
- **Threads（來源 1、4）**：用 `evaluate_script` 取 `<time>` 元素的 `datetime` 屬性拿到 UTC ISO timestamp（格式如 `2026-05-21T15:01:47.000Z`）。比較時 `post_utc > last_digest_utc` 則收錄，再分桶。若 `<time>` 拿不到，且相對時間顯示「Xm / Xh」，且 X 小於「距上次 digest 的分鐘/小時數」，保守視為新內容，日期歸入 `{TODAY}`；顯示「1d / 2d / Xd」時用 `evaluate_script` 確認 datetime 屬性再分桶。
- **Thread Reader App（來源 2）**：thread 列表每筆都有 publish date（`YYYY-MM-DD`）。接受日期 >= `{LAST_DIGEST_TIME}` 的日期部分的 thread，分桶日期即為 publish date。
- **Anthropic Blog（來源 3）**：文章卡片有日期欄位（`Mar 18, 2026` 之類），轉成 `YYYY-MM-DD`，接受 >= `{LAST_DIGEST_TIME}` 日期部分的文章，分桶日期即為文章日期。
- **Claude Code Changelog（來源 5）**：接受版本日期 >= `{LAST_DIGEST_TIME}` 日期部分的所有 entry，分桶日期即為版本日期；若都沒有，列出最近一次 update（標註其日期）。

### 3.3 重試 / 降級 / 退出條件

對每個來源：

1. `navigate_page` → `wait_for`（最多 10 秒）→ `take_snapshot`。
2. 若 `wait_for` 超時或 snapshot 找不到預期結構：retry 一次（重新 `navigate_page`），最多嘗試 2 次。
3. 兩次都失敗：呼叫 `take_screenshot` 留檔，**進入 WebSearch fallback**。
4. WebSearch fallback 拿到 URL 時，再用一次 `navigate_page` + `take_snapshot` 嘗試讀取；仍失敗則退回用 WebSearch snippet 作原文素材，並在該則貼文末尾標註：`> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`
5. WebSearch 也無結果：該 section 寫「（今日抓取失敗：Chrome DevTools 與 WebSearch 皆無法取得）」。
6. 來源有抓到但**自上次 digest 後無新內容**：該 section 寫「（今日無更新）」。

## 4. 五個來源詳細步驟

### 4.1 來源 1：boris_cherny · Threads

- **URL：** `https://www.threads.com/@boris_cherny`
- **就緒訊號（`wait_for`）：** 等待文字 `boris_cherny` 出現於頁面（profile header），或等到頁面標題包含 `Threads`。
- **解析（`take_snapshot`）：** 在 snapshot 中找貼文 article 區塊，每則貼文取：作者、相對時間文字、貼文連結（含 `/post/` 的 URL）、貼文文字。
- **取絕對時間（`evaluate_script`，若 snapshot 沒給）：**
  ```js
  [...document.querySelectorAll('time')].map(t => ({ datetime: t.getAttribute('datetime'), text: t.textContent }))
  ```
- **取完整原文（必要時）：** 若 snapshot 內貼文被截斷（`...See more`），用 `evaluate_script` 抓對應 article 的完整 `innerText`。
- **WebSearch fallback 查詢：** `site:threads.net @boris_cherny` 或 `boris_cherny threads {TODAY 月份英文}`

### 4.2 來源 2：trq212 (Thariq) · Thread Reader App

- **URL：** `https://threadreaderapp.com/user/trq212`
- **就緒訊號（`wait_for`）：** 等待文字 `Thariq` 或 `Threads` thread list 出現。
- **解析：** snapshot 中找 thread 列表，每筆取 thread 標題、publish date、thread URL。
- **取完整 thread：** 對今日 thread，再 `navigate_page` 到該 thread URL 並 `take_snapshot`，抓主要 thread 內文。
- **WebSearch fallback 查詢：** `site:threadreaderapp.com trq212` 或 `Thariq trq212 thread {TODAY 月份英文}`

### 4.3 來源 3：claudeai · Anthropic Blog

- **URL：** `https://www.anthropic.com/news`
- **就緒訊號（`wait_for`）：** 等待文字 `News` 或文章卡片列表出現。
- **解析：** snapshot 找文章卡片，每張取標題、日期、文章 URL。
- **抓完整文章：** 對今日文章，再 `navigate_page` 到文章 URL，`wait_for` 文章標題出現，`take_snapshot` 抓正文段落。若 snapshot 段落不完整，用 `evaluate_script` 抓 `document.querySelector('article')?.innerText` 或主內容 selector。
- **WebSearch fallback 查詢：** `site:anthropic.com/news {TODAY 月份英文}` 或 `Anthropic news {TODAY}`

### 4.4 來源 4：claudeai · Threads

- **URL：** `https://www.threads.com/@claudeai`
- **就緒訊號（`wait_for`）：** 等待文字 `claudeai` 出現（profile header）。
- **解析與取時間：** 同來源 1 的方式。
- **WebSearch fallback 查詢：** `site:threads.net @claudeai` 或 `claudeai threads {TODAY 月份英文}`

### 4.5 來源 5：Claude Code · Changelog

- **URL：** `https://code.claude.com/docs/en/changelog`
- **就緒訊號（`wait_for`）：** 等待文字 `Changelog` 或第一個版本號（例：`2.1.`）出現。
- **解析：** snapshot 抓版本 entry 清單，每筆取：版本號、日期、變更條列。
- **取完整變更條列（必要時）：**
  ```js
  [...document.querySelectorAll('h2, h3')].map(h => ({
    heading: h.textContent.trim(),
    body: (h.nextElementSibling?.innerText ?? '').trim(),
  }))
  ```
  視實際頁面結構調整 selector。
- **WebSearch fallback 查詢：** `Claude Code changelog {TODAY 月份英文}` 或 `Claude Code release {TODAY}`

## 5. 依日期分桶與去重

### 5.1 分桶

將 Step 4 蒐集到的所有新貼文，依照 §3.2 的日期分桶規則，分配到 `{TARGET_DATES}` 中的各個日期。

結果形如：
```
{LAST_DIGEST_DATE}: [boris_cherny post A, claudeai changelog v2.1.x]   ← supplement
2026-05-22:         [trq212 thread B]                                   ← new
{TODAY}:            [boris_cherny post C, claudeai post D]              ← new
```

### 5.2 去重（Supplement Mode 專用）

對每個 Mode = supplement 的日期：
- 比對該日期 bucket 中每則貼文的 **原文網址** 或 **版本號**，與 Step 2 中記下的「已知 URL/版本號集合」。
- 若已存在 → 跳過（不重複寫入）。
- 若不存在 → 標記為「待補充」。

### 5.3 空日期處理

- **Mode = new 且 bucket 為空**：產生該日的 `posts/{DATE}.md`，所有 section 都寫「（今日無更新）」，以保持日期連續性。
- **Mode = supplement 且去重後無新內容**：不修改該日的檔案，在執行摘要中標註「{DATE}：已是最新，無需補充」。

**注意：** 抓取來源頁面（Threads 等）有可見範圍限制，較早發布的舊貼文可能不在頁面可見範圍內。若某個中間日期的 bucket 為空，不代表那天沒有內容，只代表目前無法從來源頁面取得。接受此限制，仍建立該日的空檔案。

## 6. 整理每則貼文

對每則找到的貼文，產生以下五個欄位：

**原文網址：** 該貼文的直連 URL（必須可點擊的完整 URL）。

**原文：** 原始貼文完整內容，以 blockquote 格式呈現（每行前加 `> `）。
- 若內容來自 WebSearch snippet（非完整原文），在 blockquote 末尾加註：`> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`

**繁中改寫：** 以繁體中文台灣用語改寫，技術術語保留原文（TypeScript、API、hook 等不翻譯）。改寫要自然流暢，不要像機器翻譯。若原文只是 snippet，改寫範圍以 snippet 為準，不要憑空補。

**核心概念（簡單說）：** 一到兩段話解釋這篇在說什麼。標準：一個不熟悉這個主題的前端工程師讀完後要能快速掌握核心，且解釋要有技術深度，不要流於空泛。可用比喻或類比。

**前端工程師實際應用：** 用 markdown bullet list 列下面三點：
- **跟你工作的關聯：** 這件事跟前端工程師的日常工作有什麼直接關聯
- **具體場景：** 用一個具體的使用場景說明（越實際越好，提具體工具、框架、指令）
- **這週可以嘗試：** 一個可以立刻行動的建議（具體、可執行的小步驟）

**Claude Code Changelog 例外（來源 5）：** 每筆 entry 改為：
- **版本號 / 日期**
- **變更項目：** 條列原文變更內容（保留英文原文 + 繁中說明）
- **核心概念（簡單說）：** 這次更新主要做了什麼
- **前端工程師實際應用：** 一樣三點 bullet list

## 7. 產生 / 更新 MD 檔案

對 `{TARGET_DATES}` 中的每個日期，依 Mode 執行不同策略。**section heading 必須完全照下面字串（含全形 `·`），欄位 label 必須完全照原樣**，因為 `scripts/build-posts-json.ts` 是用字串比對來抽取欄位。

### 7.1 Mode = new：產生全新 `posts/{DATE}.md`

按照以下格式產生完整檔案：

```markdown
---
date: {DATE}
---

# {DATE} 每日精選

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

注意：
- frontmatter `date:` 和 `# ` 標題使用該日期（`{DATE}`），不一定是 `{TODAY}`。
- 同來源多則貼文 / 多筆 entry：同一 section 內用 `---` 分隔，每則欄位都完整。
- 「今日無更新」、「今日抓取失敗」的 section 只寫那一行即可，不要附其他欄位。
- snippet 內容：blockquote 末尾附 `> ⚠️ 本則內容為搜尋摘要（snippet），非完整原文`。

### 7.2 Mode = supplement：在既有 `posts/{DATE}.md` 中補充內容

對每個需要補充的來源 section，根據該 section 目前的狀態選擇對應策略：

**情況 A：section 原本已有貼文內容**
- 在該 section 的最後一則貼文欄位（`**前端工程師實際應用：**` 結尾）之後、下一個 `## ` heading 或檔案結尾之前，插入：
  - 空一行
  - `---` 分隔線
  - 空一行
  - 新貼文的完整欄位
- 不動原有的內容。

**情況 B：section 原本是「（今日無更新）」**
- 移除「（今日無更新）」那一行。
- 在原位置寫入新貼文的完整欄位。

**情況 C：section 原本是「（今日抓取失敗：...）」**
- 保留原有的失敗標記行（不刪除）。
- 在其下方加入：
  - 空一行
  - `---` 分隔線
  - 空一行
  - 新貼文的完整欄位

**操作方式：** 讀取整個檔案內容、在記憶體中修改、再整個覆寫，以避免行號計算錯誤。

## 8. Commit 並 push main

```powershell
git checkout main
git pull origin main

# 加入所有新增 / 修改的 posts 檔案
git add posts/*.md

# Commit message：
# 單天（{LAST_DIGEST_DATE} == {TODAY}，或 TARGET_DATES 只有一天）：
git commit -m "digest: {TODAY}"

# 多天（backfill，{FIRST_DATE} 為 TARGET_DATES 中最早的日期）：
git commit -m "digest: {FIRST_DATE}~{TODAY}"

git push origin main
```

- 不開 feature branch、不開 PR。
- 所有新增與修改的 `posts/*.md` 都在同一個 commit 中。
- push 後 GitHub Actions 自動觸發部署（`.github/workflows/deploy.yml`）。

## 9. 完成 — 輸出執行摘要

輸出包含：

- **日期範圍：** 本次處理了哪些日期（`{FIRST_DATE}` ~ `{TODAY}`），共 N 天；各日期的 Mode（new / supplement）。
- **各日期各來源狀態：** 以表格或清單呈現，每格標明：**完整原文 / 僅 snippet / 今日無更新 / 今日抓取失敗 / 補充 N 則 / 已是最新**，以及實際使用了 chrome-devtools 還是 WebSearch fallback。
- 任何 `take_screenshot` 留下的 debug 截圖路徑（若有）。
- 本次 commit SHA（`git rev-parse HEAD`）。
- 提示：GitHub Pages 部署通常在 push 後 1–2 分鐘內完成。
- 與舊版 `routine/prompt.md` 的差異提醒：本 routine 是 chrome-devtools 主力版，若想退回舊版策略，把 Local Routine instructions 換回 `routine/prompt.md` 即可，本檔不影響舊版。
