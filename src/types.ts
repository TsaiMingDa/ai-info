export type PostType = 'post' | 'changelog'

export interface Post {
  type: PostType
  date: string
  author: string
  source: string
  isSnippet: boolean
  // post-only fields
  sourceUrl?: string
  originalText?: string
  rewriteZh?: string
  // changelog-only fields
  version?: string
  changes?: string
  // shared fields
  coreExplanation: string
  frontendApplication: string
  isEmpty: boolean
  isFailed: boolean
}

export interface PostsData {
  posts: Post[]
  dates: string[]
  authors: string[]
  buildTime: string
}

export type AuthorFilter = 'all' | string
