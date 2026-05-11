## 1. 專案初始化

- [ ] 1.1 與使用者確認 repo 名稱、Routine 執行時間（建議 Asia/Taipei 08:00）、視覺風格偏好
- [ ] 1.2 在使用者已建立的空 repo 內初始化 Vite + React + TypeScript 專案結構
- [ ] 1.3 加入 `package.json` 依賴：`react`、`react-dom`、`vite`、`@vitejs/plugin-react`、`gray-matter`、`marked`（或 `react-markdown`）、`typescript`
- [ ] 1.4 設定 `vite.config.ts` 的 `base` 為 `/<repo-name>/`（GitHub Pages 子路徑）
- [ ] 1.5 建立 `posts/` 目錄與 `posts/.gitkeep`
- [ ] 1.6 建立 `posts/2026-05-10.md` sample 檔，作為前端開發與 build script 測試資料

## 2. MD → JSON 建置腳本

- [ ] 2.1 撰寫 `scripts/build-posts-json.ts`：以 `gray-matter` 解析 frontmatter，並按 section 標題切出三個來源
- [ ] 2.2 為每個 section 解析五個欄位（原文網址、原文、繁中改寫、核心概念、前端工程師實際應用），輸出符合 design.md Decision 7 結構的 `posts.json`
- [ ] 2.3 處理「（今日無更新）」與「（今日抓取失敗：...）」標記，對應的 post 物件設標記欄位
- [ ] 2.4 在 build 時注入 `buildTime`（Asia/Taipei 格式 `YYYY-MM-DD HH:mm`）
- [ ] 2.5 解析失敗時 throw error 終止 build（讓 deploy workflow 失敗、保留前一版網站）
- [ ] 2.6 在 `package.json` 加入 `npm run build:json` 與整合進 `npm run build`（先 build:json 再 vite build）
- [ ] 2.7 用 sample MD 檔驗證腳本，產出 `public/posts.json` 結構正確

## 3. 前端應用實作

- [ ] 3.1 規劃元件結構：`App` / `Header`（含最後更新時間）/ `Filters`（日期 + 作者）/ `CardList` / `Card` / `DetailView`
- [ ] 3.2 在 `App` 載入時 fetch `posts.json`，處理 loading 與錯誤狀態
- [ ] 3.3 實作日期篩選：下拉或日曆 picker，僅顯示有資料的日期；含「上一日／下一日」按鈕，邊界時 disabled
- [ ] 3.4 實作作者篩選：標籤式按鈕 `[全部] [boris_cherny] [trq212] [claudeai]`，與日期篩選取交集
- [ ] 3.5 實作卡片列表：作者、來源、日期、改寫摘要前 1-2 行、原文外連按鈕
- [ ] 3.6 實作詳細內容檢視（決定 modal 或 inline expand），含原文 blockquote、繁中改寫、核心概念、前端應用三段；支援 Esc 與背景點擊關閉
- [ ] 3.7 加入 footer 顯示 `buildTime` 的「最後更新」資訊
- [ ] 3.8 處理空狀態 UI：「（今日無更新）」「（今日抓取失敗）」需有清楚但不干擾的顯示
- [ ] 3.9 視覺設計實作（依 1.1 確認的風格）；至少需 responsive、桌機與手機可用
- [ ] 3.10 本機 `npm run dev` 驗證所有互動

## 4. GitHub Actions 部署 workflow

- [ ] 4.1 建立 `.github/workflows/deploy.yml`，trigger 為 `push: branches: [main]` 與 `workflow_dispatch`
- [ ] 4.2 設定 permissions：`contents: read`、`pages: write`、`id-token: write`
- [ ] 4.3 Steps：checkout → setup-node (LTS) → `npm ci` → `npm run build` → `actions/upload-pages-artifact` (path: `dist/`) → `actions/deploy-pages`
- [ ] 4.4 在 GitHub repo Settings → Pages 啟用 GitHub Actions 作為部署來源
- [ ] 4.5 push 一個 dummy MD 變更，驗證 workflow 跑成功且網站可訪問

## 5. Routine 設定與文件

- [ ] 5.1 撰寫 `routine/README.md`，說明 cron schedule、所需 env 變數名稱、PAT 設定步驟（不含實際 PAT 值）
- [ ] 5.2 撰寫 `routine/prompt.md` 範本，內容描述：每日工作流程、來源 URL 清單、MD 格式要求、找不到貼文時的處理（標記「（今日無更新）」）、抓取失敗時的處理、PR branch 命名 (`digest/YYYY-MM-DD`)、commit message 格式 (`digest: YYYY-MM-DD`)、PR 標題格式 (`每日精選 YYYY-MM-DD`)
- [ ] 5.3 使用者依文件建立 Fine-grained PAT：限定該 repo + `Contents: Read and write` + `Pull requests: Read and write` + 90 天過期
- [ ] 5.4 使用者於 Claude Code 建立 scheduled remote routine，設 cron 為 1.1 確認的時間，掛上 prompt 範本與 PAT secret
- [ ] 5.5 手動觸發一次 routine，驗證可成功 push branch + 開 PR

## 6. 端到端驗證與紀錄

- [ ] 6.1 在第一次 routine 自動執行隔天，驗證 PR 出現、內容符合格式、merge 後 deploy workflow 跑成功、網站更新
- [ ] 6.2 故意製造一個 MD 解析錯誤的 PR，驗證 deploy workflow fail 且網站維持上一版本
- [ ] 6.3 將 routine 故意指向錯誤 URL，驗證「抓取失敗」標記能正確產生並顯示於網站
- [ ] 6.4 把 PAT 設定步驟、Routine 維護方法、回滾流程整理成 `README.md` 對外說明
- [ ] 6.5 將本 change 透過 `/opsx:archive` 歸檔
