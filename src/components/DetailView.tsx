import ReactMarkdown from 'react-markdown'
import type { Post } from '../types'

interface DetailViewProps {
  post: Post
  onClose: () => void
}

export default function DetailView({ post, onClose }: DetailViewProps) {
  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal>
      <div className="detail" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="關閉">✕</button>

        <div className="detail-header">
          <span className="detail-author">{post.author}</span>
          <span className="detail-source">{post.source}</span>
        </div>

        <div className="detail-meta-bar">
          <span className="detail-meta-date">{post.date}</span>
          {post.sourceUrl && (
            <>
              <span className="detail-meta-sep">·</span>
              <a
                className="detail-meta-url"
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {post.sourceUrl} ↗
              </a>
            </>
          )}
        </div>

        {post.type === 'changelog' ? (
          <>
            {post.version && (
              <p className="detail-version">{post.version}</p>
            )}
            <section className="detail-section">
              <h3>變更項目</h3>
              <div className="detail-markdown">
                <ReactMarkdown>{post.changes ?? ''}</ReactMarkdown>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="detail-section">
              <h3>原文</h3>
              {post.isSnippet && (
                <p className="detail-snippet-warning">⚠️ 本則內容為搜尋摘要（snippet），非完整原文</p>
              )}
              <blockquote className="detail-blockquote">{post.originalText}</blockquote>
            </section>
            <section className="detail-section">
              <h3>繁中改寫</h3>
              <p className="detail-text">{post.rewriteZh}</p>
            </section>
          </>
        )}

        <section className="detail-section">
          <h3>核心概念（簡單說）</h3>
          <p className="detail-text">{post.coreExplanation}</p>
        </section>

        <section className="detail-section detail-section--highlight">
          <h3>前端工程師實際應用</h3>
          <div className="detail-markdown">
            <ReactMarkdown>{post.frontendApplication}</ReactMarkdown>
          </div>
        </section>
      </div>
    </div>
  )
}
