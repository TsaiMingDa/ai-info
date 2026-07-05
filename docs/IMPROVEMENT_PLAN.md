# ai-info 改善計畫（2026-07-05）

本文件記錄專案總體檢的發現問題與完成狀態。詳細分析見 `~/.claude/plans/code-review-sonnet5-encapsulated-wombat.md`。

## 完成狀態

### A. 資安

- [x] **A1** `sourceUrl` 未驗證 scheme — `normalizeSourceUrl()` 加 `http/https` 白名單（`scripts/build-posts-json.ts`）
- [x] **A2** `settings.local.json` 權限過寬 — 移除 `Stop-Process -Force`、`Read(Desktop/**)` 等高風險項目，收斂萬用字元 git/npx/npm 指令，`enableAllProjectMcpServers: false`（本機檔案，未 commit）
- [x] **A3** npm 套件弱點 — 升級 `vite@8`、`@vitejs/plugin-react`、`tsx`，0 vulnerabilities
- [x] **A4** Prompt injection 防護 — `routine/prompt-local.md` 加入「⚠️ 安全守則」章節

### B. Build Script 正確性

- [x] **B1** `extractField` 結尾判定改為「所有後續 label」，修復欄位缺漏時的吞欄位 bug
- [x] **B2** `authors` 陣列改為從 `AUTHOR_CONFIGS` 動態導出，消除與 AUTHOR_CONFIGS 的重複
- [x] **B3** frontmatter 日期解析改用 `getUTC*()` getter，修復負時差 CI 環境偏移一天的潛在問題

### C. 前端品質

- [x] **C1** `App.tsx` fetch 加 unmount cleanup（`cancelled` flag）
- [x] **C2** `Card.tsx` keyboard a11y：加 Space 鍵支援；`DetailView.tsx`：body scroll lock + close button autoFocus

### D. Repo 衛生

- [x] **D1** `.gitignore` 加入 `ui_prototype/`；commit 工作區積累變更（`.mcp.json`、`routine/`、posts 刪除）
