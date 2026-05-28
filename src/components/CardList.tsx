import type { Post } from '../types'
import Card from './Card'

interface CardListProps {
  posts: Post[]
  onSelect: (p: Post) => void
}

export default function CardList({ posts, onSelect }: CardListProps) {
  if (posts.length === 0) {
    return <div className="empty-state">這一天沒有任何內容</div>
  }

  return (
    <div className="card-list">
      {posts.map((p, i) => (
        <Card key={`${p.date}-${p.author}-${p.source}-${i}`} post={p} onSelect={onSelect} />
      ))}
    </div>
  )
}
