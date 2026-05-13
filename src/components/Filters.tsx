import type { AuthorFilter } from '../types'

const AUTHOR_LABELS: Record<string, string> = {
  boris_cherny: 'boris_cherny',
  trq212: 'trq212',
  claudeai: 'claudeai',
}

interface FiltersProps {
  dates: string[]
  selectedDate: string
  onDateChange: (d: string) => void
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  authors: string[]
  authorFilter: AuthorFilter
  onAuthorChange: (a: AuthorFilter) => void
}

export default function Filters({
  dates, selectedDate, onDateChange,
  hasPrev, hasNext, onPrev, onNext,
  authors, authorFilter, onAuthorChange,
}: FiltersProps) {
  return (
    <div className="filters">
      <div className="date-nav">
        <button className="nav-btn" onClick={onPrev} disabled={!hasPrev} aria-label="上一日">◀</button>
        <select
          className="date-select"
          value={selectedDate}
          onChange={e => onDateChange(e.target.value)}
        >
          {dates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="nav-btn" onClick={onNext} disabled={!hasNext} aria-label="下一日">▶</button>
      </div>

      <div className="author-tabs">
        <button
          className={`author-tab ${authorFilter === 'all' ? 'active' : ''}`}
          onClick={() => onAuthorChange('all')}
        >
          全部
        </button>
        {authors.map(a => (
          <button
            key={a}
            className={`author-tab author-tab--${a} ${authorFilter === a ? 'active' : ''}`}
            onClick={() => onAuthorChange(a)}
          >
            {AUTHOR_LABELS[a] ?? a}
          </button>
        ))}
      </div>
    </div>
  )
}
