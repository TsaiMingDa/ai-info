## ADDED Requirements

### Requirement: main push 觸發部署
系統 SHALL 在 main branch 收到 push 時自動觸發部署流程。

#### Scenario: 直接 push 後自動跑
- **WHEN** main branch 收到任何 push（包含 Local Routine 自動 commit 或人工 commit）
- **THEN** GitHub Actions workflow 自動觸發，依序執行：解析 MD → 產 JSON → build React app → 部署 GitHub Pages

#### Scenario: 非內容相關的 push 不重複部署
- **WHEN** 變更僅涉及 `routine/`、`openspec/`、`README.md` 等非影響網站輸出的路徑
- **THEN** workflow 仍可執行但結果應與前一版相同（不需特別 skip，但避免不必要的 path 限制以保持簡單）

### Requirement: MD 轉 JSON 建置步驟
系統 SHALL 在 build 階段將 `posts/*.md` 全部解析為單一 `posts.json`。

#### Scenario: JSON 結構
- **WHEN** 執行 `scripts/build-posts-json` 解析 MD
- **THEN** 產出的 `posts.json` 結構為：
  ```
  {
    "posts": [{ "date", "author", "source", "sourceUrl", "originalText",
                "rewriteZh", "coreExplanation", "frontendApplication" }, ...],
    "dates": ["YYYY-MM-DD", ...] (descending),
    "authors": ["boris_cherny", "trq212", "claudeai"],
    "buildTime": "YYYY-MM-DD HH:mm" (Asia/Taipei)
  }
  ```

#### Scenario: 解析錯誤處理
- **WHEN** 某個 MD 檔解析失敗（frontmatter 缺失、section 結構不符）
- **THEN** Build 步驟 fail，整個 deploy workflow fail，網站維持上一版本不更新

### Requirement: GitHub Pages 部署
系統 SHALL 將 build 產出部署到 GitHub Pages。

#### Scenario: 成功部署
- **WHEN** Build 與 JSON 產出皆成功
- **THEN** 透過 `actions/deploy-pages` 將 `dist/` 內容部署到 GitHub Pages

#### Scenario: 部署失敗
- **WHEN** 部署步驟失敗
- **THEN** GitHub Actions 標記 workflow 為 failed，使用者收到 email 通知；網站維持上一個成功版本

### Requirement: Workflow 觸發條件
系統 SHALL 同時支援自動與手動觸發 workflow。

#### Scenario: 自動觸發
- **WHEN** main branch 有新的 commit（routine 自動 push 或人工 push）
- **THEN** workflow 自動執行

#### Scenario: 手動觸發
- **WHEN** 使用者於 GitHub Actions UI 手動 dispatch workflow
- **THEN** workflow 從 main 最新狀態執行一次 build & deploy
