import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'

interface Post {
  date: string
  author: string
  source: string
  sourceUrl: string
  originalText: string
  rewriteZh: string
  coreExplanation: string
  frontendApplication: string
  isEmpty: boolean
  isFailed: boolean
}

interface PostsJson {
  posts: Post[]
  dates: string[]
  authors: string[]
  buildTime: string
}

const AUTHOR_CONFIGS = [
  { key: 'boris_cherny', heading: 'boris_cherny · Threads', source: 'Threads' },
  { key: 'trq212', heading: 'trq212 (Thariq) · Thread Reader App', source: 'Thread Reader App' },
  { key: 'claudeai', heading: 'claudeai · Anthropic Blog', source: 'Anthropic Blog' },
]

const FIELD_PATTERNS: Array<{ key: keyof Omit<Post, 'date' | 'author' | 'source' | 'isEmpty' | 'isFailed'>; label: string }> = [
  { key: 'sourceUrl', label: '**原文網址：**' },
  { key: 'originalText', label: '**原文：**' },
  { key: 'rewriteZh', label: '**繁中改寫：**' },
  { key: 'coreExplanation', label: '**核心概念（簡單說）：**' },
  { key: 'frontendApplication', label: '**前端工程師實際應用：**' },
]

function extractField(sectionLines: string[], label: string, nextLabel?: string): string {
  const startIdx = sectionLines.findIndex(l => l.trim().startsWith(label))
  if (startIdx === -1) return ''

  // Content on the same line after the label (e.g. **原文網址：** https://...)
  const inline = sectionLines[startIdx].trim().slice(label.length).trim()

  let endIdx = sectionLines.length
  if (nextLabel) {
    const next = sectionLines.findIndex((l, i) => i > startIdx && l.trim().startsWith(nextLabel))
    if (next !== -1) endIdx = next
  }

  const subsequent = sectionLines.slice(startIdx + 1, endIdx)
    .map(l => l.replace(/^>\s?/, '').trim())
    .filter(l => l.length > 0)

  return [inline, ...subsequent].filter(l => l.length > 0).join('\n').trim()
}

function parseSection(sectionLines: string[], date: string, author: string, source: string): Post {
  const isEmpty = sectionLines.some(l => l.includes('（今日無更新）'))
  const isFailed = sectionLines.some(l => l.includes('（今日抓取失敗'))

  if (isEmpty || isFailed) {
    return { date, author, source, sourceUrl: '', originalText: '', rewriteZh: '', coreExplanation: '', frontendApplication: '', isEmpty, isFailed }
  }

  const fields: Partial<Post> = {}
  for (let i = 0; i < FIELD_PATTERNS.length; i++) {
    const { key, label } = FIELD_PATTERNS[i]
    const nextLabel = FIELD_PATTERNS[i + 1]?.label
    fields[key] = extractField(sectionLines, label, nextLabel)
  }

  if (!fields.sourceUrl) {
    throw new Error(`[${date}][${author}] 缺少 **原文網址：** 欄位`)
  }

  return {
    date,
    author,
    source,
    sourceUrl: fields.sourceUrl ?? '',
    originalText: fields.originalText ?? '',
    rewriteZh: fields.rewriteZh ?? '',
    coreExplanation: fields.coreExplanation ?? '',
    frontendApplication: fields.frontendApplication ?? '',
    isEmpty: false,
    isFailed: false,
  }
}

function parseFile(filePath: string): Post[] {
  const raw = readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const rawDate = data.date
  let date: string
  if (!rawDate) {
    date = basename(filePath, '.md')
  } else if (rawDate instanceof Date) {
    const y = rawDate.getFullYear()
    const m = String(rawDate.getMonth() + 1).padStart(2, '0')
    const d = String(rawDate.getDate()).padStart(2, '0')
    date = `${y}-${m}-${d}`
  } else {
    date = String(rawDate).substring(0, 10)
  }

  const lines = content.split('\n')
  const posts: Post[] = []

  for (const config of AUTHOR_CONFIGS) {
    const headingLine = lines.findIndex(l =>
      l.startsWith('## ') && l.includes(config.heading)
    )
    if (headingLine === -1) continue

    const nextHeadingLine = lines.findIndex(
      (l, i) => i > headingLine && l.startsWith('## ')
    )
    const sectionEnd = nextHeadingLine === -1 ? lines.length : nextHeadingLine
    const sectionLines = lines.slice(headingLine + 1, sectionEnd)

    posts.push(parseSection(sectionLines, date, config.key, config.source))
  }

  return posts
}

function getBuildTime(): string {
  return new Date().toLocaleString('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('T', ' ').substring(0, 16)
}

const postsDir = join(process.cwd(), 'posts')
const outputPath = join(process.cwd(), 'public', 'posts.json')

const mdFiles = readdirSync(postsDir)
  .filter(f => f.endsWith('.md') && f !== '.gitkeep')
  .sort()
  .reverse()

const allPosts: Post[] = []

for (const file of mdFiles) {
  const filePath = join(postsDir, file)
  try {
    const posts = parseFile(filePath)
    allPosts.push(...posts)
  } catch (err) {
    console.error(`解析失敗：${file}`)
    throw err
  }
}

const dates = [...new Set(allPosts.map(p => p.date))].sort().reverse()
const authors = ['boris_cherny', 'trq212', 'claudeai']

const output: PostsJson = {
  posts: allPosts,
  dates,
  authors,
  buildTime: getBuildTime(),
}

writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✓ posts.json 產出完成（${allPosts.length} 筆，${dates.length} 天）`)
