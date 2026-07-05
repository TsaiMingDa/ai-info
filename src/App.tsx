import { useState, useEffect } from 'react'
import type { PostsData, Post, AuthorFilter } from './types'
import Header from './components/Header'
import Filters from './components/Filters'
import CardList from './components/CardList'
import DetailView from './components/DetailView'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [data, setData] = useState<PostsData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${BASE}posts.json`)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((d: PostsData) => {
        if (cancelled) return
        setData(d)
        if (d.dates.length > 0) setSelectedDate(d.dates[0])
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPost(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) return <div className="loading">載入中...</div>
  if (error || !data) return <div className="error">無法載入內容，請稍後重試</div>

  const dateIndex = data.dates.indexOf(selectedDate)
  const hasPrev = dateIndex < data.dates.length - 1
  const hasNext = dateIndex > 0

  const filteredPosts = data.posts.filter(p => {
    const dateMatch = p.date === selectedDate
    const authorMatch = authorFilter === 'all' || p.author === authorFilter
    return dateMatch && authorMatch
  })

  return (
    <>
      <Header buildTime={data.buildTime} />
      <main className="main">
        <Filters
          dates={data.dates}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={() => setSelectedDate(data.dates[dateIndex + 1])}
          onNext={() => setSelectedDate(data.dates[dateIndex - 1])}
          authors={data.authors}
          authorFilter={authorFilter}
          onAuthorChange={setAuthorFilter}
        />
        <CardList posts={filteredPosts} onSelect={setSelectedPost} />
      </main>
      {selectedPost && (
        <DetailView post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  )
}
