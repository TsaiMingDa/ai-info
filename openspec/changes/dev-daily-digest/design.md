## Context

使用者是前端工程師，目前以個人時間追蹤 Claude Code 領域三位核心開發者的內容（@boris_cherny、@trq212、@claudeai），但內容散落、語言為英文、缺乏「跟自己工作的關聯」的轉譯。本系統的目標是把這個追蹤動作自動化、結構化，並產生長期可回顧的個人知識庫。

關鍵約束：
- 三個來源都必須走「公開可存取」的 URL（不處理 X 登入牆內容）
- 部署目標是 GitHub Pages（純靜態託管）
- Claude Code Remote Routine 在 Anthropic 雲端執行，環境是 ephemeral
- 使用者偏好「PR 審核」工作流，把每日 merge 當成學習儀式
- 使用者已熟悉 GitHub 與 Routine 操作，但對「整合機制」較陌生

## Goals / Non-Goals

**Goals:**
- 每日固定時間自動蒐集五個來源最新內容（貼文 + Changelog）
- 由 Claude 產生標準化的繁中改寫 + 核心解釋 + 前端應用建議
- 透過 PR 流程讓使用者每日 review，達成學習目的
- Merge 後自動部署到 GitHub Pages
- 個人網站可按日期/作者篩選，點擊看詳細內容
- 安全憑證最小授權（Fine-grained PAT 限定單 repo）

**Non-Goals:**
- 不抓登入牆後的內容（X 直接抓需登入，因此用 Thread Reader App 替代）
- 不做使用者帳號／多人系統（個人專案）
- 不做即時或多次更新（一天一次足夠）
- 初期不做 PR 自動 merge timer（可後續再加）
- 不在 PR 階段加 Claude auto-review（維持「使用者手動 merge」做為學習儀式）
- 不做手動觸發 routine 的 UI（用 Claude Code 既有功能即可）
- 不做歷史貼文回填（從上線當日往後）

## Decisions

### Decision 1：Remote Routine + GitHub Actions 雙系統，而非純 GitHub Actions

**選擇：** Claude Code Remote Routine 負責「抓取＋產生 MD」，GitHub Actions 只負責「build & deploy」。

**為什麼：**
- 使用者已有 Claude 訂閱，Routine 用量包含在內，不會有額外 API 費用驚喜
- Routine 用 prompt 描述工作即可，不需自己寫 fetch + parse + prompt 腳本
- Claude 直接瀏覽網頁，省去處理動態 HTML / Cloudflare 等麻煩
- GitHub Actions 角色單純，使用者較易理解與除錯

**替代方案：** 純 GitHub Actions + Anthropic API。較有自動化純粹度但需寫程式碼、額外 API 帳單、且要處理瀏覽器化抓取。對「學習為主」的使用者過度工程化。

### Decision 2：PR 工作流，而非直接 push main，且不加 Claude auto-review

**選擇：** Routine 將每日 MD 推到 `digest/YYYY-MM-DD` branch 並開 PR，使用者手動 merge 後才部署。不在 PR 階段加 Claude auto-review。

**為什麼：**
- 使用者明確說明「我要學習用」——PR 把每日內容變成必讀儀式
- Claude 偶有失誤時可在 PR 內直接編輯修正
- 部署不會在使用者沒看內容的情況下發生
- 加 Claude auto-review 會引入額外 GitHub Action 設定 + Anthropic API key，且使用者明確選擇維持原流程

**替代方案：**
- 直接 push main：全自動但失去學習迴圈
- PR + 24h 自動 merge：避免休假斷更，但初期先不做以免增加複雜度
- PR + Claude auto-review：多一層 QA 但使用者選擇不加

### Decision 3：MD 一天一檔，section 切分五來源

**選擇：** `posts/YYYY-MM-DD.md` 一個檔案，內部用 `## boris_cherny ...`、`## trq212 ...`、`## claudeai · Anthropic Blog`、`## claudeai · Threads`、`## Claude Code · Changelog` section 區分。

**為什麼：**
- 使用者明確要求一天一檔
- 一檔包含全天內容，PR review 時一次看完最自然
- Frontmatter 只記 `date`，作者資訊由 section heading 表達，前端解析時拆 section 即可
- claudeai 兩個來源（Blog 與 Threads）共用 `author='claudeai'`，靠 `source` 欄位區分

**替代方案：** 一貼文一檔（`posts/2026-05-10/boris.md`）。檔案數爆炸、PR diff 變散，且使用者明確不要這樣。

### Decision 4：Build 時 MD → JSON，前端讀 JSON

**選擇：** GitHub Actions 在 build 階段執行 `scripts/build-posts-json` 把所有 `posts/*.md` 解析成單一 `posts.json`，React app fetch 這個 JSON。

**為什麼：**
- 前端不需要在 client 端 parse markdown frontmatter，效能好
- 一次 fetch 拿到全站 metadata（日期清單、作者清單），篩選 UI 可瞬間反應
- 詳細內容（rendered HTML）也預先 build 好，省 client 端負擔
- React app 純靜態，部署簡單

**替代方案：**
- Static Site Generator（Eleventy / Astro）：建置流程更複雜，學習成本較高
- 瀏覽器端解析 MD：第一次載入要抓所有檔案，效能差

### Decision 5：Fine-grained PAT，限定單一 repo + Contents Read/Write + 90 天過期

**選擇：** 不用 Classic PAT、不用 Bot 帳號、不用 Deploy Key。

**為什麼：**
- Fine-grained PAT 已能把爆炸半徑限縮到「該 repo 的內容」這個層級
- Bot 帳號雖更安全但增設帳號維護負擔，個人專案 over-engineering
- Deploy Key 是 SSH-based，但 Routine 通常用 HTTPS git，PAT 較相容
- 90 天過期強制定期輪替，符合最小授權原則

**替代方案見上述。**

### Decision 6：React + Vite，而非框架（Next.js / Remix）或純 HTML

**選擇：** React + Vite，純 SPA。

**為什麼：**
- 使用者是前端工程師，想藉此練習熟悉的技術棧
- Vite build 快、設定簡單，部署到 GitHub Pages 成熟
- Next.js / Remix 都需要 Node runtime，與 GitHub Pages 純靜態不相容（除非用 export 模式，徒增複雜）
- 純 HTML 失去元件化練習機會

### Decision 7：JSON 結構平面化（per-post 物件陣列）

**選擇：** `posts.json` 形如：
```
{
  "posts": [
    { "type": "post", "date": "2026-05-10", "author": "boris_cherny", "source": "Threads",
      "isSnippet": false,
      "sourceUrl": "...", "originalText": "...", "rewriteZh": "...",
      "coreExplanation": "...", "frontendApplication": "..." },
    { "type": "changelog", "date": "2026-05-10", "author": "claude_code", "source": "Changelog",
      "isSnippet": false,
      "version": "1.2.0 / 2026-05-10", "changes": "...",
      "coreExplanation": "...", "frontendApplication": "..." },
    ...
  ],
  "dates": ["2026-05-10", ...],
  "authors": ["boris_cherny", "trq212", "claudeai", "claude_code"]
}
```

`type` 欄位（`'post' | 'changelog'`）讓前端依類型切換渲染邏輯；`isSnippet` 標記 WebSearch fallback 的 snippet 內容。

**為什麼：** 前端篩選邏輯最直觀（filter by date / author），不需巢狀解析。

## Risks / Trade-offs

- **[Threads / Thread Reader App 結構改版]** Claude 可能某天抓不到貼文 → 緩解：Routine prompt 設計成「找不到貼文時產生空 daily MD 並標記 `## (今日無更新)`」，PR 仍會開讓使用者察覺
- **[Anthropic 部落格沒有當日更新]** 大多數天會是空的 → 緩解：同上，正常標記空狀態
- **[Claude 改寫品質不穩定]** 偶爾解釋過淺或脫離前端視角 → 緩解：PR review 階段使用者可直接編輯 MD 後再 merge
- **[PAT 洩漏]** → 緩解：Fine-grained 限單 repo + 90 天過期，洩漏時最壞只影響該 repo 內容
- **[使用者休假堆積 PR]** → 緩解：初期接受，後續可加 24h auto-merge 機制
- **[Routine cron 漂移或失敗]** → 緩解：使用者每天若沒收到 PR，自然知道 Routine 出問題；可手動觸發
- **[GitHub Pages 部署失敗]** → 緩解：Actions 失敗會 email，且 PR merge 後若部署失敗網站維持上一版本，不會壞掉
- **[一年後 posts.json 太大]** → 緩解：保留作為未來優化議題（可改成按月切檔 lazy load），初期不處理

## Migration Plan

這是新專案，無遷移。上線步驟：
1. 完成 React app 與 GitHub Actions
2. 啟用 GitHub Pages（從 main branch 的 `/dist` 或 `gh-pages` branch）
3. 建立 Fine-grained PAT 並設定到 Routine
4. 設定 Routine cron schedule
5. 等隔天首次自動執行，驗證 PR 流程

回滾：純靜態網站，回滾就是 revert 那次 merge commit，Actions 自動重新部署上一版本。

## Open Questions

- 每天 routine 執行的具體時間？（建議：使用者習慣的早晨時段，例如台北時區 08:00）
- repo 名稱？（建議：`dev-daily-digest` 或使用者偏好的命名）
- React app 的視覺風格？（建議：實作階段提供 2-3 個風格 mockup 讓使用者選擇）
- 是否要在網站上顯示「最後更新時間」？（建議：是，從 build time 取）
