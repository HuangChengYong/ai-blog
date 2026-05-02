export type PostCategory = string

export type DraftStatus = 'idea' | 'review' | 'ready' | 'published'

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
  content: string
  authorId: string
  category: PostCategory
  categoryId?: string
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
  source: string
  updatedAt: string
  tags: string[]
  authorId?: string
  categoryId?: string
}

export interface GenerateArticleOptions {
  style: string
  length: string
  tags: string[]
}
