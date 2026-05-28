import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import type { Post, PostType } from '../src/types'

interface PostsJson {
  posts: Post[]
  dates: string[]
  authors: string[]
  buildTime: string
}

interface AuthorConfig {
  key: string
  heading: string
  source: string
  type: PostType
}

const AUTHOR_CONFIGS: AuthorConfig[] = [
  // X（新來源，取代 Threads）
  { key: 'boris_cherny', heading: 'boris_cherny · X', source: 'X', type: 'post' },
  // 舊 Threads heading — 保留向下相容（解析既有 post 檔案）
  { key: 'boris_cherny', heading: 'boris_cherny · Threads', source: 'Threads', type: 'post' },
  { key: 'trq212', heading: 'trq212 · X', source: 'X', type: 'post' },
  { key: 'trq212', heading: 'trq212 (Thariq) · Thread Reader App', source: 'Thread Reader App', type: 'post' },
  { key: 'claudeai', heading: 'claudeai · Anthropic Blog', source: 'Anthropic Blog', type: 'post' },
  // X（新來源，取代 Threads）
  { key: 'claudeai', heading: 'claudeai · X', source: 'X', type: 'post' },
  // 舊 Threads heading — 保留向下相容
  { key: 'claudeai', heading: 'claudeai · Threads', source: 'Threads', type: 'post' },
  { key: 'claude_code', heading: 'Claude Code · Changelog', source: 'Changelog', type: 'changelog' },
]

const POST_FIELD_PATTERNS: Array<{ key: string; label: string }> = [
  { key: 'sourceUrl', label: '**原文網址：**' },
  { key: 'originalText', label: '**原文：**' },
  { key: 'rewriteZh', label: '**繁中改寫：**' },
  { key: 'coreExplanation', label: '**核心概念（簡單說）：**' },
  { key: 'frontendApplication', label: '**前端工程師實際應用：**' },
]

const CHANGELOG_FIELD_PATTERNS: Array<{ key: string; label: string }> = [
  { key: 'version', label: '**版本號 / 日期：**' },
  { key: 'changes', label: '**變更項目：**' },
  { key: 'coreExplanation', label: '**核心概念（簡單說）：**' },
  { key: 'frontendApplication', label: '**前端工程師實際應用：**' },
]

const SNIPPET_MARKER = '⚠️ 本則內容為搜尋摘要'

function splitByHorizontalRule(sectionLines: string[]): string[][] {
  if (
    sectionLines.some(l => l.includes('（今日無更新）')) ||
    sectionLines.some(l => l.includes('（今日抓取失敗'))
  ) {
    return [sectionLines]
  }

  const entries: string[][] = []
  let current: string[] = []

  for (const line of sectionLines) {
    if (line.trim() === '---') {
      if (current.some(l => l.trim().length > 0)) {
        entries.push(current)
      }
      current = []
    } else {
      current.push(line)
    }
  }

  if (current.some(l => l.trim().length > 0)) {
    entries.push(current)
  }

  return entries.length > 0 ? entries : [sectionLines]
}

function extractField(sectionLines: string[], label: string, nextLabel?: string): string {
  const startIdx = sectionLines.findIndex(l => l.trim().startsWith(label))
  if (startIdx === -1) return ''

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

function parsePostSection(sectionLines: string[], date: string, author: string, source: string): Post {
  const isEmpty = sectionLines.some(l => l.includes('（今日無更新）'))
  const isFailed = sectionLines.some(l => l.includes('（今日抓取失敗'))

  if (isEmpty || isFailed) {
    return { type: 'post', date, author, source, isSnippet: false, sourceUrl: '', originalText: '', rewriteZh: '', coreExplanation: '', frontendApplication: '', isEmpty, isFailed }
  }

  const fields: Record<string, string> = {}
  for (let i = 0; i < POST_FIELD_PATTERNS.length; i++) {
    const { key, label } = POST_FIELD_PATTERNS[i]
    const nextLabel = POST_FIELD_PATTERNS[i + 1]?.label
    fields[key] = extractField(sectionLines, label, nextLabel)
  }

  if (!fields.sourceUrl) {
    console.warn(`[${date}][${author}] 缺少 **原文網址：** 欄位，跳過此 sub-entry`)
    return { type: 'post', date, author, source, isSnippet: false, sourceUrl: '', originalText: '', rewriteZh: '', coreExplanation: '', frontendApplication: '', isEmpty: false, isFailed: true }
  }

  const isSnippet = fields.originalText?.includes(SNIPPET_MARKER) ?? false
  const cleanedOriginalText = fields.originalText
    ?.split('\n')
    .filter(l => !l.includes(SNIPPET_MARKER))
    .join('\n')
    .trim() ?? ''

  return {
    type: 'post',
    date,
    author,
    source,
    isSnippet,
    sourceUrl: fields.sourceUrl,
    originalText: cleanedOriginalText,
    rewriteZh: fields.rewriteZh ?? '',
    coreExplanation: fields.coreExplanation ?? '',
    frontendApplication: fields.frontendApplication ?? '',
    isEmpty: false,
    isFailed: false,
  }
}

function parseChangelogSection(sectionLines: string[], date: string, author: string, source: string): Post {
  const isEmpty = sectionLines.some(l => l.includes('（今日無更新）'))
  const isFailed = sectionLines.some(l => l.includes('（今日抓取失敗'))

  if (isEmpty || isFailed) {
    return { type: 'changelog', date, author, source, isSnippet: false, version: '', changes: '', coreExplanation: '', frontendApplication: '', isEmpty, isFailed }
  }

  const fields: Record<string, string> = {}
  for (let i = 0; i < CHANGELOG_FIELD_PATTERNS.length; i++) {
    const { key, label } = CHANGELOG_FIELD_PATTERNS[i]
    const nextLabel = CHANGELOG_FIELD_PATTERNS[i + 1]?.label
    fields[key] = extractField(sectionLines, label, nextLabel)
  }

  return {
    type: 'changelog',
    date,
    author,
    source,
    isSnippet: false,
    version: fields.version ?? '',
    changes: fields.changes ?? '',
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
    const subEntries = splitByHorizontalRule(sectionLines)

    for (const entry of subEntries) {
      const post = config.type === 'changelog'
        ? parseChangelogSection(entry, date, config.key, config.source)
        : parsePostSection(entry, date, config.key, config.source)
      posts.push(post)
    }
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
const authors = ['boris_cherny', 'trq212', 'claudeai', 'claude_code']

const output: PostsJson = {
  posts: allPosts,
  dates,
  authors,
  buildTime: getBuildTime(),
}

mkdirSync(join(process.cwd(), 'public'), { recursive: true })
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✓ posts.json 產出完成（${allPosts.length} 筆，${dates.length} 天）`)
