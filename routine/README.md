# Dev Daily Digest — Routine 設定說明

## 概覽

這個 Routine 每天在本機 Claude Code 執行，瀏覽五個開發者來源，由 Claude 整理成每日 MD 檔案，直接 commit 並 push 到 main，觸發 GitHub Pages 自動部署。

## 執行時間

- Claude Code Local Routine 排程：`Daily` / 09:00（依個人偏好調整）

## 來源

| 作者 | 平台 | URL |
|------|------|-----|
| boris_cherny | Threads | https://www.threads.com/@boris_cherny |
| trq212 (Thariq) | Thread Reader App | https://threadreaderapp.com/user/trq212 |
| claudeai | Anthropic Blog | https://www.anthropic.com/news |
| claudeai | Threads | https://www.threads.com/@claudeai |
| Claude Code | Changelog | https://code.claude.com/docs/en/changelog |

## 所需環境設定

### 前提條件

- 本機 git 可推送到 `origin/main`（`https://github.com/TsaiMingDa/ai-info.git`）
- 專案已設定 `chrome-devtools` MCP server（`npx -y chrome-devtools-mcp@latest`）— 已在 `.mcp.json` 中設定
- Routine 執行前，Chrome 瀏覽器必須在背景運行（開啟即可，不需特別設定）
- Claude Code 已啟用 `WebSearch` 工具（作為 Chrome DevTools 的 fallback）

> **為什麼用 Chrome DevTools MCP？** `chrome-devtools-mcp` 連接你**正在運行的 Chrome**，直接使用你的登入狀態（cookies / session）。Threads 需要登入才能看到貼文，這個方案能繞過登入牆，不同於 WebFetch（匿名 HTTP request）或 Playwright（全新 browser context）。

> **MCP 連線 timeout 怎麼辦？** 確認 Chrome 在背景運行，然後在 Claude Code 輸入 `/mcp` 確認 `chrome-devtools` 狀態為 connected。若仍 timeout，嘗試重新開啟 Claude Code。

## 在 Claude Code 建立 Local Routine

開啟 Claude Code → 左側 **Routines** → **New local routine**，依下表填寫：

| 欄位 | 值 |
|------|-----|
| **Name** | `daily-digest` |
| **Description** | `每日蒐集 5 個來源並 push 到 main` |
| **Instructions** | 貼上 `routine/prompt.md` 全文 |
| **Ask permissions** | `Default`（首次跑會問 git push 權限，確認後可在設定加入 allow list） |
| **Select folder** | `C:\Users\Stanley\Desktop\01_coding\vibe_code\ai-info` |
| **Worktree** | **不勾**（需要 commit 到 main 本身，勾 worktree 會卡） |
| **Schedule** | `Daily` / 上午 09:00 |

## Routine 執行後的工作流程

```
Routine 執行（09:00）
  ↓
抓取五來源 → 產生 posts/YYYY-MM-DD.md
  ↓
git commit -m "digest: YYYY-MM-DD"
git push origin main
  ↓
GitHub Actions 自動 build & deploy
  ↓
網站更新（約 1-2 分鐘後）
```

## 維護

### Routine 失敗

如果某天沒看到新內容，到 Claude Code Routines 頁面查看當天 run log。常見原因：

- **Git push 失敗**：檢查本機 git credential / remote URL 是否正確。執行 `git remote -v` 確認，或執行 `git push origin main` 看錯誤訊息。
- **Chrome DevTools MCP 無法取得內容**：確認 Chrome 已開啟且已登入 Threads 帳號；prompt 會自動 fallback 到 WebSearch snippet，並在 MD 標註「本則內容為搜尋摘要」。只有當 Chrome DevTools 和 WebSearch 都查不到時才寫「今日抓取失敗」。
- **Chrome DevTools MCP 連線 timeout**：確認 Chrome 瀏覽器在背景運行，再輸入 `/mcp` 確認連線狀態；重啟 Claude Code 通常可解決。
- **來源頁面結構改變**：手動瀏覽來源 URL 確認是否可存取。
- **找不到今日內容**：確認今天 Asia/Taipei 時間是否有發文，或搜尋條件是否需要調整。

可以在 Routine 頁面手動點 **Run now** 重新執行一次。

### 回滾

如果 deploy 後發現問題：

```bash
# 找到前一版 commit hash
git log --oneline -5

# revert 最後一次 commit
git revert <commit-hash>
git push origin main
# → GitHub Actions 自動重新 deploy 上一版
```

## 目錄結構

```
ai-info/
├── posts/               ← Routine 每天新增一個 .md 檔
├── routine/
│   ├── README.md        ← 本文件
│   └── prompt.md        ← Routine 使用的 prompt 範本
├── scripts/
│   └── build-posts-json.ts  ← 將 posts/*.md 轉為 posts.json
└── .github/workflows/
    └── deploy.yml       ← Build & deploy workflow（main push 自動觸發）
```
