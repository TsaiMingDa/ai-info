## Context

Digest routine（`routine/prompt-local.md`）每次執行時抓取五個來源的新內容，寫入 `posts/{TODAY}.md`。目前流程假設每天都會執行，若中斷數天重跑，所有累積內容全部塞進當天檔案。

Build script（`scripts/build-posts-json.ts`）對每個 `## heading` section 只呼叫一次 parse 函式，導致同 section 內以 `---` 分隔的第二筆以後的貼文被忽略。已有資料受影響：`2026-05-20.md` 的 Changelog 有 v2.1.145 和 v2.1.144，但只有 v2.1.145 被解析。

## Goals / Non-Goals

**Goals:**

- 逐日補件：多天未執行時，為每個缺少的日期分別產出 `posts/{DATE}.md`
- 既有檔案補充：已存在的日期檔案中若有漏抓的貼文，追加到對應 section
- 修復 build script 的多筆貼文解析 bug
- 修復因多筆貼文產生的 React key 衝突

**Non-Goals:**

- 不改變 Threads/Blog/Changelog 的抓取方式（chrome-devtools MCP 工具序列不變）
- 不處理頁面需要捲動才能看到的舊貼文（接受 source page 可見範圍的限制）
- 不變動 `Post` type 或 `PostsData` 結構
- 不改變前端 UI 的呈現邏輯

## Decisions

### D1：貼文依發布時間分桶，而非抓取時間

以貼文的實際發布時間（Asia/Taipei 時區）決定歸入哪天的檔案。

**理由**：使用者期望「5/21 的檔案包含 5/21 發布的內容」，不論何時抓取。若用抓取時間，5/21 的貼文可能被歸到 5/23（補跑當天），違反直覺。

**替代方案**：全部歸入抓取日 → 行為與現有相同，不符需求。

### D2：Supplement 模式以 URL/版本號去重

對已存在的檔案，讀取各 section 中的 `**原文網址：**` 和 `**版本號 / 日期：**` 欄位值作為去重依據。新抓到的貼文若 URL 或版本號已存在，跳過不重複寫入。

**理由**：URL 是貼文的唯一識別，版本號是 changelog 的唯一識別，兩者都在既有格式中明確存在，無需額外基礎建設。

**替代方案**：用內容 hash 去重 → 過度工程，URL 已足夠。

### D3：空日期仍產出「今日無更新」檔案

backfill 時若某個中間日期完全沒有任何來源的新內容，仍建立該日的 `posts/{DATE}.md`，所有 section 寫「（今日無更新）」。

**理由**：保持日期連續性，讓前端日期列表不會有缺口。使用者可清楚看到「這天沒東西」vs「這天沒跑」。

**替代方案**：跳過空日期 → 無法區分「沒內容」和「漏跑」。

### D4：`splitByHorizontalRule` 以 `---` 為分隔線

在 section lines 中，以 `line.trim() === '---'` 切割 sub-entries。frontmatter 的 `---` 已被 `gray-matter` 剝離，不會干擾。section lines 也已被 `## ` heading 切割，不會跨 section。

**理由**：與現有 MD 格式完全吻合，無需引入新的分隔符。

### D5：`parsePostSection` 缺 sourceUrl 時降級為 warn + isFailed

改為 `console.warn` 並回傳 `isFailed: true` 的 Post 物件，而非 throw。

**理由**：一筆格式不正確的 sub-entry 不應導致整個 build 失敗。其餘正確的貼文仍應正常解析。

## Risks / Trade-offs

- **來源頁面可見範圍限制**：Threads profile 頁面預設只顯示最近的貼文，若中斷超過 3-5 天，較早的貼文可能不在可見範圍內。→ 接受限制，prompt 中加入「盡可能捲動以載入更多貼文」的提示，但不保證能抓到所有歷史貼文。
- **Supplement 追加格式風險**：在既有檔案中插入新內容若行號計算有誤可能破壞格式。→ 採「讀取整檔 → 記憶體中修改 → 整檔覆寫」策略，避免行號計算。
- **Commit message 格式變更**：多天時使用 `digest: {FIRST}~{TODAY}`，可能影響 `git log --grep` 查詢。→ 仍以 `digest:` 開頭，既有 grep pattern 不受影響。
