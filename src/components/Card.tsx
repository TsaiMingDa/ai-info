import type { Post } from '../types'

const AUTHOR_ICON: Record<string, string> = {
  boris_cherny: '🧵',
  trq212: '🐦',
  claudeai: '🤖',
  claude_code: '📋',
}

interface CardProps {
  post: Post
  onSelect: (p: Post) => void
}

export default function Card({ post, onSelect }: CardProps) {
  if (post.isEmpty) {
    return (
      <div className="card card--empty">
        <div className="card-author">
          <span className="card-icon">{AUTHOR_ICON[post.author] ?? '📄'}</span>
          <span className="card-author-name">{post.author}</span>
          <span className="card-source">{post.source}</span>
        </div>
        <p className="card-status">今日無更新</p>
      </div>
    )
  }

  if (post.isFailed) {
    return (
      <div className="card card--failed">
        <div className="card-author">
          <span className="card-icon">{AUTHOR_ICON[post.author] ?? '📄'}</span>
          <span className="card-author-name">{post.author}</span>
          <span className="card-source">{post.source}</span>
        </div>
        <p className="card-status">今日抓取失敗</p>
      </div>
    )
  }

  const isChangelog = post.type === 'changelog'
  const preview = isChangelog
    ? (post.changes ?? '').split('\n').slice(0, 2).join(' ')
    : (post.rewriteZh ?? '').split('\n').slice(0, 2).join(' ')

  return (
    <article className="card" onClick={() => onSelect(post)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(post)}>
      <div className="card-author">
        <span className="card-icon">{AUTHOR_ICON[post.author] ?? '📄'}</span>
        <span className="card-author-name">{post.author}</span>
        <span className="card-source">{post.source}</span>
        <span className="card-date">{post.date}</span>
        {post.isSnippet && <span className="card-badge--snippet">摘要</span>}
      </div>
      {isChangelog && post.version && (
        <p className="card-version">{post.version}</p>
      )}
      <p className="card-preview">{preview}</p>
      <div className="card-footer">
        {!isChangelog && post.sourceUrl && (
          <a
            className="card-link"
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            原文 ↗
          </a>
        )}
        <span className="card-expand">展開詳細 ▼</span>
      </div>
    </article>
  )
}
