## ADDED Requirements

### Requirement: 日期範圍計算
Routine 執行時 SHALL 計算從上次 digest commit 日期（`{LAST_DIGEST_DATE}`）到今天（`{TODAY}`）之間的所有日期，並對每個日期判定為 `new`（檔案不存在）或 `supplement`（檔案已存在）模式。

#### Scenario: 多天未執行後重跑
- **WHEN** 上次 digest 日期為 2026-05-20，今天為 2026-05-23
- **THEN** 系統計算出 TARGET_DATES = [2026-05-20, 2026-05-21, 2026-05-22, 2026-05-23]，其中 2026-05-20 為 supplement（檔案已存在），其餘為 new

#### Scenario: 同日重跑
- **WHEN** 上次 digest 日期與今天相同
- **THEN** TARGET_DATES 只有一個日期，模式為 supplement

#### Scenario: 首次執行
- **WHEN** 無任何 digest commit 存在
- **THEN** TARGET_DATES 只有今天，模式為 new

### Requirement: 貼文依發布日期分桶
所有抓取到的新貼文 SHALL 依其發布時間（轉換為 Asia/Taipei 時區後取日期部分）分配到對應日期的檔案中。

#### Scenario: UTC 時間跨日轉換
- **WHEN** 一則貼文的 UTC 發布時間為 2026-05-21T18:30:00Z
- **THEN** 轉換為台北時間 2026-05-22 02:30，歸入 posts/2026-05-22.md

#### Scenario: 貼文日期不在目標範圍內
- **WHEN** 一則貼文的發布日期早於 LAST_DIGEST_DATE 或晚於 TODAY
- **THEN** 該貼文被忽略，不寫入任何檔案

### Requirement: 逐日產出新檔案
對每個 mode=new 的日期，系統 SHALL 產出完整的 `posts/{DATE}.md` 檔案，格式與現有每日 digest 完全相同。

#### Scenario: 有內容的新日期
- **WHEN** 2026-05-22 為 new 模式，且有兩則 boris_cherny 貼文歸入此日期
- **THEN** 產出 posts/2026-05-22.md，boris_cherny section 包含兩則貼文（以 --- 分隔），其餘來源 section 寫「（今日無更新）」

#### Scenario: 無內容的新日期
- **WHEN** 2026-05-21 為 new 模式，但無任何貼文歸入此日期
- **THEN** 仍產出 posts/2026-05-21.md，所有 section 皆寫「（今日無更新）」

### Requirement: 既有檔案去重補充
對每個 mode=supplement 的日期，系統 SHALL 讀取既有檔案，以原文網址（post 類型）或版本號（changelog 類型）作為去重依據，僅追加尚未存在的貼文。

#### Scenario: 補充新貼文到已有內容的 section
- **WHEN** posts/2026-05-20.md 的 boris_cherny section 已有一則貼文（URL-A），新抓到一則新貼文（URL-B）
- **THEN** 在該 section 最後一則貼文後加 `---` 分隔線，再寫入 URL-B 的完整欄位

#### Scenario: 補充貼文到「今日無更新」section
- **WHEN** posts/2026-05-20.md 的 claudeai Threads section 為「（今日無更新）」，新抓到一則貼文
- **THEN** 移除「（今日無更新）」行，寫入新貼文的完整欄位

#### Scenario: 補充貼文到「今日抓取失敗」section
- **WHEN** 某 section 為「（今日抓取失敗：...）」，新抓到一則貼文
- **THEN** 保留失敗標記行，在其下方加 `---` 分隔線，再寫入新貼文的完整欄位

#### Scenario: 去重跳過已存在的貼文
- **WHEN** 新抓到的貼文 URL 已存在於該 section 中
- **THEN** 跳過該貼文，不重複寫入

#### Scenario: 去重後無新內容
- **WHEN** supplement 模式的某日期，去重後所有貼文都已存在
- **THEN** 不修改該日的檔案

### Requirement: 多檔案 Commit
系統 SHALL 以單一 commit 提交所有新增和修改的 posts 檔案。

#### Scenario: 單天 commit
- **WHEN** TARGET_DATES 只有一天（TODAY）
- **THEN** commit message 為 `digest: {TODAY}`

#### Scenario: 多天 backfill commit
- **WHEN** TARGET_DATES 跨越多天（FIRST_DATE 到 TODAY）
- **THEN** commit message 為 `digest: {FIRST_DATE}~{TODAY}`

### Requirement: Build script 多筆貼文解析
`scripts/build-posts-json.ts` SHALL 正確解析同一 section 內以 `---` 分隔的多筆貼文，每筆獨立產出一個 Post 物件。

#### Scenario: 同 section 兩筆 changelog
- **WHEN** 解析 posts/2026-05-20.md 的 Claude Code Changelog section，其中有 v2.1.145 和 v2.1.144 兩筆以 --- 分隔
- **THEN** 產出兩個 Post 物件，version 分別為 "2.1.145 / 2026-05-19" 和 "2.1.144 / 2026-05-19"

#### Scenario: 單筆貼文 section 不受影響
- **WHEN** 解析只有一筆貼文的 section（無 --- 分隔）
- **THEN** 行為與修改前完全相同，產出一個 Post 物件

#### Scenario: 空的或失敗的 section 不受影響
- **WHEN** section 內容為「（今日無更新）」或「（今日抓取失敗）」
- **THEN** 不做 sub-entry 分割，行為與修改前相同

#### Scenario: 單筆 sourceUrl 缺失不影響整體 build
- **WHEN** 某 sub-entry 缺少 `**原文網址：**` 欄位
- **THEN** 輸出 console.warn，回傳 isFailed=true 的 Post 物件，其餘 sub-entry 正常解析

### Requirement: React key 唯一性
`CardList.tsx` 中的 React key SHALL 在同來源同日多筆貼文時保持唯一。

#### Scenario: 同來源兩筆貼文
- **WHEN** 同一天的同一 author/source 有兩筆 Post
- **THEN** 兩張 Card 的 React key 不同，瀏覽器 console 無 key 重複警告
