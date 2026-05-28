## Why

目前 digest routine 若好幾天沒執行，重跑時會把所有中間天數的新內容全部塞進當天的 `posts/{TODAY}.md`，導致中間日期沒有對應檔案、內容集中在單一天不易查閱。同時，即使某天已經跑過 digest，該天稍後才出現的新文章也會被忽略或錯誤歸入隔天。

## What Changes

- **Routine prompt 邏輯重構**：修改 `routine/prompt-local.md`，加入日期範圍計算、貼文按發布日期分桶、逐日產出檔案、既有檔案去重補充等機制
- **Build script 多筆解析修復**：修改 `scripts/build-posts-json.ts`，修復同一 section 內有多筆貼文時只解析第一筆的 bug，新增 `splitByHorizontalRule` 函式
- **React key 衝突修復**：修改 `src/components/CardList.tsx`，為同來源同日多筆貼文的 key 加上 index 避免衝突

## Capabilities

### New Capabilities

- `digest-backfill`: 涵蓋逐日補件邏輯（日期範圍計算、貼文日期分桶、new/supplement 模式判定、既有檔案去重與追加）

### Modified Capabilities

- `content-ingestion`: 新增「多天未執行時逐日建檔」和「既有檔案補充」的 requirement，修改「新內容判定」規則加入日期分桶；修復 build script 多筆解析

## Impact

- `routine/prompt-local.md`：大幅修改（核心流程變更，新增多個 step）
- `scripts/build-posts-json.ts`：新增函式 + 修改 `parseFile` 解析迴圈
- `src/components/CardList.tsx`：一行修改（React key）
- 現有 `posts/*.md` 資料不受影響，修復後可正確解析已存在的多筆貼文（如 `2026-05-20.md` 的兩筆 changelog）
