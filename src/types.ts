export interface Post {
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

export interface PostsData {
  posts: Post[]
  dates: string[]
  authors: string[]
  buildTime: string
}

export type AuthorFilter = 'all' | string
