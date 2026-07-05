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
- 專案已設定 `chrome-devtools` MCP server，且 `.mcp.json` 使用 **`--browserUrl=http://127.0.0.1:9222`**（明確連線，**不要用 `--autoConnect`**，原因見下）
- Routine 執行前，**先用 `Chrome-MCP.bat` 開啟「專屬 debug profile」的 Chrome**（帶 port 9222、已登入 X）
- Claude Code 已啟用 `WebSearch` 工具（作為 Chrome DevTools 的 fallback）

### 為什麼要「專屬 profile + 9222 + browserUrl」（踩過的雷）

`chrome-devtools-mcp` 連接一個**已開啟 remote debugging port 的 Chrome**，直接使用其登入狀態（cookies / session）。但有兩個在 Windows 上會讓人卡很久的陷阱：

1. **日常 Chrome 的預設 profile 開不了 debug port。** 預設 profile 通常已被背景常駐程序（背景應用程式 / 擴充功能）佔用，此時即使用 `--remote-debugging-port=9222` 啟動，新程序只會叫既有視窗開分頁然後自己退出，**debug server 根本不會啟動**（`localhost:9222` 連不上）。
2. **`--autoConnect` 會自己 spawn 一個乾淨（未登入）的 Chrome。** 它不保證連到你指定的 9222，常常自行開一個全新 isolated browser，於是 X / 其他來源全部顯示未登入，抓回來的 digest 變成假性「今日無更新」。

**解法**：用一個**獨立 `user-data-dir`** 開帶 9222 的 Chrome（一定能開 port、登入狀態持久保存），並讓 MCP 用 `--browserUrl=http://127.0.0.1:9222` **明確** attach。

### 一次性設定

1. **`.mcp.json`**（已設定，確認長這樣）：

   ```json
   {
     "mcpServers": {
       "chrome-devtools": {
         "command": "cmd",
         "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
       }
     }
   }
   ```

2. **桌面 `Chrome-MCP.bat`**（已建立，單行內容）：

   ```bat
   start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\Users\Stanley\chrome-mcp-profile
   ```

   > Chrome 路徑依實際安裝為準（這台是 `Program Files (x86)`）。profile 路徑 `C:\Users\Stanley\chrome-mcp-profile` 與日常 Chrome 完全隔離。

3. **第一次**雙擊 `Chrome-MCP.bat` 開出視窗後，在裡面**登入 X 一次**（cookie 之後持久保存；過期再登一次即可）。

### 每次跑 routine 的正確流程

```
1. 雙擊桌面 Chrome-MCP.bat          ← 開專屬 profile + 9222（已登入 X，不影響日常 Chrome）
2. （首次／cookie 過期才需要）在該視窗登入 X
3. 開 Claude Code，跑 routine
   → routine 的 §0 會自動驗證 9222 已開、MCP 連對、X 為登入狀態，未通過會中止並提示
```

### 排程自動跑要多做一步（開機自啟）

如果用 Claude Code 排程（例如 09:00 無人值守）自動跑，沒有人會去雙擊 `Chrome-MCP.bat`，而 MCP 又**必須在 Claude Code 啟動時就連到 9222**。因此把專屬 Chrome 設為**開機自啟**：

1. `Win+R` 輸入 `shell:startup`，開啟啟動資料夾
2. 把 `Chrome-MCP.bat`（或它的捷徑）複製進去
3. 之後開機就會自動常駐 9222 專屬 Chrome，排程觸發的 Claude Code 一啟動就連得到

> routine `prompt-local.md` §0.1 也會在執行時自動偵測、必要時啟動 9222，但那只是「中途被關」的補救 —— 因為 MCP 在 Claude Code 啟動時就連線，9222 仍須先於 Claude Code 就緒，開機自啟最穩。

### 驗證連線

- 瀏覽器開 `http://localhost:9222/json/version` → 看到 JSON 代表 port OK
- Claude Code 裡 `mcp__chrome-devtools__list_pages` → 看得到你 Chrome-MCP 視窗的分頁，代表 MCP 連對了瀏覽器

> **改了 `.mcp.json` 要重啟才生效。** 修改後需重啟 Claude Code（重啟時保持 `Chrome-MCP.bat` 視窗開著，否則 MCP 啟動會因連不到 9222 而失敗）。`/mcp` 可查看 `chrome-devtools` 連線狀態。

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
- **所有來源都「今日無更新」/ 抓到未登入頁面（最常見的假陰性）**：代表 MCP 連到的是未登入的 Chrome。依序檢查：① `localhost:9222/json/version` 是否連得上（沒有 → 雙擊 `Chrome-MCP.bat`）；② `.mcp.json` 是否為 `--browserUrl=http://127.0.0.1:9222`（若還是 `--autoConnect` → 改掉並重啟 Claude Code）；③ 在 `Chrome-MCP.bat` 開的視窗手動開 `x.com/home` 確認確實登入。routine §0 的「登入狀態驗證關卡」會在這種情況直接中止而非產出假 digest。
- **`localhost:9222` 連不上**：多半是用「日常 Chrome」而非 `Chrome-MCP.bat` 開的；日常 Chrome 預設 profile 開不了 debug port（見〈所需環境設定〉）。請改用 `Chrome-MCP.bat`（獨立 profile）。
- **Chrome DevTools MCP 連線 timeout**：先確認 `Chrome-MCP.bat` 的視窗開著（9222 在跑），再輸入 `/mcp` 確認 `chrome-devtools` 為 connected；重啟 Claude Code 通常可解決（重啟時保持該視窗開著）。
- **抓不到內容但已登入**：prompt 會自動 fallback 到 WebSearch snippet，並在 MD 標註「本則內容為搜尋摘要」。只有當 Chrome DevTools 和 WebSearch 都查不到時才寫「今日抓取失敗」。
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
│   ├── README.md         ← 本文件（環境設定 / 故障排除）
│   ├── prompt-local.md   ← 主力版 prompt（chrome-devtools，本機 routine 實際使用）
│   └── prompt.md         ← 舊版 prompt 範本
├── scripts/
│   └── build-posts-json.ts  ← 將 posts/*.md 轉為 posts.json
└── .github/workflows/
    └── deploy.yml       ← Build & deploy workflow（main push 自動觸發）
```
