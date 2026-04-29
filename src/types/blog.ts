export type PostCategory = 'AI 工程' | '模型应用' | '产品设计' | '开发实践'

export type DraftStatus = 'idea' | 'review' | 'ready'

export type ListingStatus = 'unlisted' | 'listed'

export interface Author {
  id: string
  name: string
  role: string
  avatar: string
  bio: string
  aiPreference: string
}

export interface Post {
  id: string
  title: string
  summary: string
  content: string[]
  authorId: string
  category: PostCategory
  tags: string[]
  cover: string
  readMinutes: number
  heat: number
  publishedAt: string
}

export interface Topic {
  id: string
  title: string
  description: string
  tags: string[]
}

export interface Draft {
  id: string
  title: string
  summary: string
  content: string
  status: DraftStatus
  listingStatus: ListingStatus
  source: 'AI 生成' | '手写'
  updatedAt: string
  tags: string[]
}

export interface GenerateArticleOptions {
  style: string
  length: string
  tags: string[]
}
