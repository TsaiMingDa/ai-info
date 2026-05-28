## 1. Build Script 多筆解析修復

- [x] 1.1 在 `scripts/build-posts-json.ts` 新增 `splitByHorizontalRule(sectionLines: string[]): string[][]` 函式：以 `line.trim() === '---'` 切割 section 為 sub-entries，過濾空白 sub-entry，含「今日無更新」或「今日抓取失敗」時不切割
- [x] 1.2 修改 `parseFile` 中的 for 迴圈（line 156-173）：切出 sectionLines 後先呼叫 `splitByHorizontalRule`，對每個 sub-entry 分別呼叫 `parsePostSection` / `parseChangelogSection`
- [x] 1.3 修改 `parsePostSection`（line 79-81）：`sourceUrl` 缺失時改為 `console.warn` + 回傳 `isFailed: true` 的 Post，不 throw
- [x] 1.4 驗證：執行 `npx tsx scripts/build-posts-json.ts`，確認 2026-05-20 的 Changelog 產出 2 筆（v2.1.145 + v2.1.144），總 post 數增加

## 2. React Key 衝突修復

- [x] 2.1 修改 `src/components/CardList.tsx` line 17：`posts.map(p =>` 改為 `posts.map((p, i) =>`，key 加上 `-${i}`

## 3. Routine Prompt 逐日補件邏輯

- [x] 3.1 在 `routine/prompt-local.md` Step 1 後新增 Step 1.1「計算目標日期範圍」：PowerShell 腳本列出 LAST_DIGEST_DATE ~ TODAY 所有日期，標記 new/supplement
- [x] 3.2 修改 Step 2「準備工作目錄」：supplement 模式讀取既有檔案，記下各 section 已有的 URL 和版本號
- [x] 3.3 修改 Step 3.2「新內容判定」：加入日期分桶規則，貼文依 Asia/Taipei 發布日期歸入對應 DATE
- [x] 3.4 新增 Step 5「依日期分桶與去重」：分桶邏輯、supplement 去重、空日期處理
- [x] 3.5 修改 Step 6（原 5）到 Step 7（原 6）：新增 Mode=new 和 Mode=supplement 兩種檔案產出策略，含三種 supplement 情境（已有貼文/今日無更新/今日抓取失敗）
- [x] 3.6 修改 Step 8（原 7）：git add posts/*.md，commit message 依單天/多天使用不同格式
- [x] 3.7 修改 Step 9（原 8）：執行摘要加入日期範圍報告和各日期狀態

## 4. 驗證

- [x] 4.1 執行 `npx tsx scripts/build-posts-json.ts` 確認 build 成功且多筆貼文正確解析
- [x] 4.2 啟動 dev server 確認多筆貼文的日期頁面無 React key 警告
- [x] 4.3 檢視修改後的 `prompt-local.md` 確認邏輯完整、步驟編號連貫、格式模板正確
