## Why

使用者是前端工程師，想持續追蹤三位 Claude Code 領域核心開發者（@boris_cherny、@trq212/Thariq、@claudeai）的最新分享，但這些內容散落在不同平台、語言為英文、且未經過「跟我的工作有什麼關係」的轉譯。本變更建立一個每日自動執行的內容彙整管線，把這些貼文蒐集、用繁中改寫、解釋核心概念，並補上前端工程師的應用建議，作為個人的學習儀式與長期知識庫。

## What Changes

- 新建一個 GitHub Pages 個人網站，展示每日彙整的開發者貼文
- 建立 Claude Code Remote Routine 設定，每天定時抓取三個來源並產生當日 MD 檔
- 採用 PR 工作流：Routine 不直接 push main，改開 PR 給使用者每日 review 後 merge（學習儀式）
- 建立 GitHub Actions workflow，於 merge 後將 MD 轉成 JSON 並 build & deploy 到 GitHub Pages
- 使用 Fine-grained PAT 限定單一 repo + Contents 讀寫 + 90 天過期，存於 Routine secret config
- 不在範圍內：登入牆內容（X 直接抓）、使用者帳號、即時更新、PR 自動 merge timer

## Capabilities

### New Capabilities
- `content-ingestion`: 每日從三個公開來源（threads.com、threadreaderapp.com、anthropic.com/news）抓取貼文，由 Claude 整理為標準化的 daily MD 檔案，並透過 PR 流程提交至 repo
- `digest-site`: React + Vite 靜態網站，從 build 階段產生的 posts.json 讀取資料，提供日期導航、作者篩選、卡片列表與點擊展開詳細內容的瀏覽體驗
- `deployment-pipeline`: GitHub Actions workflow，在 PR merge 至 main 後將所有 posts/*.md 轉換為 posts.json、build React app 並部署至 GitHub Pages

### Modified Capabilities
（無，這是一個全新的專案）

## Impact

- **新建檔案**：
  - `posts/` 目錄（每日 MD 檔案）
  - `src/` React 應用程式碼
  - `scripts/build-posts-json.{js,ts}` MD → JSON 轉換器
  - `.github/workflows/deploy.yml` 部署 workflow
  - `vite.config.{js,ts}`、`package.json` 等前端工具設定
  - Routine 設定（記錄於 repo 內 `routine/` 文件，實際 secret 在 Anthropic 端）
- **新增依賴**：React、Vite、gray-matter（解析 MD frontmatter）、marked 或 react-markdown（渲染 MD）
- **新增系統整合**：
  - GitHub repo（空 repo，使用者已準備）
  - GitHub Pages 啟用
  - GitHub PAT（Fine-grained，使用者需建立）
  - Claude Code Remote Routine（使用者帳號內建立排程）
- **不影響**：本 repo 之外的任何系統；無資料遷移
