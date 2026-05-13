# Dev Daily Digest

每日自動蒐集三位 Claude Code 核心開發者的貼文，由 Claude 以繁體中文改寫並解釋與前端工程師工作的關聯，部署為個人 GitHub Pages 網站。

## 功能

- 每天 Asia/Taipei 02:00 自動抓取三個來源
- Claude 產生：繁中改寫、核心概念說明、前端工程師應用建議
- PR 工作流：每天收到 PR → 閱讀 → Merge → 自動部署
- 網站支援日期篩選、作者篩選、點擊展開詳細內容

## 追蹤來源

| 作者 | 平台 | 說明 |
|------|------|------|
| boris_cherny | Threads | TypeScript / 開發工具 |
| trq212 (Thariq Shihipar) | Thread Reader App | Anthropic 工程師，Claude Code 核心開發者 |
| claudeai | Anthropic Blog | Claude 官方公告與功能更新 |

## 技術架構

```
Claude Code Remote Routine (每日 02:00 Asia/Taipei)
  → 瀏覽三來源 → 產生 posts/YYYY-MM-DD.md → 開 PR
    → 你 review & merge
      → GitHub Actions: build:json + vite build → GitHub Pages
```

## 本機開發

```bash
npm install
npm run dev        # 開發伺服器 http://localhost:5173/ai-info/
npm run build      # 完整 build（build:json + vite build）
npm run build:json # 只跑 MD → JSON 轉換
```

## 設定 Routine

詳見 [routine/README.md](routine/README.md)，包含：
- GitHub Fine-grained PAT 建立步驟
- Claude Code Routine 設定方式
- 維護與回滾流程

## 專案結構

```
ai-info/
├── posts/                    每日 MD 檔案（Routine 自動新增）
├── public/posts.json         Build 產出（不需 commit）
├── src/                      React 前端源碼
│   └── components/
├── scripts/
│   └── build-posts-json.ts  MD → JSON 轉換器
├── routine/
│   ├── README.md             Routine 設定說明
│   └── prompt.md             Routine prompt 範本
└── .github/workflows/
    └── deploy.yml            GitHub Pages 部署 workflow
```
