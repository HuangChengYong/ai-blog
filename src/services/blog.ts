import { reactive } from 'vue'
import { request, type PageResult } from './api'
import type { Author, Draft, DraftStatus, GenerateArticleOptions, ListingStatus, Post, Topic } from '../types/blog'

interface ArticleDto {
  id: string | null
  title: string
  summary: string
  content: string
  authorId: string
  authorName?: string
  categoryId: string
  category?: string
  tags: string[]
  source: string
  status: string
  listingStatus: string
  cover: string
  readMinutes: number
  heat: number
  publishedAt?: string
  updatedAt?: string
}

interface AuthorDto {
  id: string
  name: string
  role: string
  avatar: string
  bio: string
  aiPreference: string
}

interface TopicDto {
  id: string
  title: string
  description: string
  tags: string[]
}

const publicPosts = reactive<Post[]>([])
const authors = reactive<Author[]>([])
const topics = reactive<Topic[]>([])
const draftStore = reactive<Draft[]>([])
const approvalDraftStore = reactive<Draft[]>([])

export async function loadPublicArticles() {
  const page = await request<PageResult<ArticleDto>>('/public/articles?page=1&size=100')
  replace(publicPosts, page.records.map(toPost))
  return publicPosts
}

export function getPosts() {
  return publicPosts
}

export async function loadPublicArticleById(id: string) {
  const article = await request<ArticleDto>(`/public/articles/${id}`)
  const post = toPost(article)
  const index = publicPosts.findIndex((item) => item.id === post.id)

  if (index >= 0) {
    publicPosts.splice(index, 1, post)
  } else {
    publicPosts.push(post)
  }

  return post
}

export function getPostById(id: string) {
  return publicPosts.find((post) => post.id === id)
}

export function getPublicArticles() {
  return publicPosts
}

export function getPublicArticleById(id: string) {
  return publicPosts.find((post) => post.id === id)
}

export async function loadAuthors() {
  const result = await request<AuthorDto[]>('/public/authors')
  replace(authors, result.map((author) => ({ ...author, id: String(author.id) })))
  return authors
}

export function getAuthorById(id: string) {
  return authors.find((author) => author.id === id)
}

export async function loadTopics() {
  const result = await request<TopicDto[]>('/public/topics')
  replace(topics, result.map((topic) => ({ ...topic, id: String(topic.id) })))
  return topics
}

export function getTopics() {
  return topics
}

export async function loadDrafts() {
  const page = await request<PageResult<ArticleDto>>('/admin/articles?page=1&size=100')
  replace(draftStore, page.records.map(toDraft))
  return draftStore
}

export function getDrafts() {
  return draftStore
}

export async function loadApprovalDrafts() {
  const page = await request<PageResult<ArticleDto>>('/admin/approvals/articles?page=1&size=100')
  replace(approvalDraftStore, page.records.map(toDraft))
  return approvalDraftStore
}

export function getApprovalDrafts() {
  return approvalDraftStore
}

export async function createDraft(payload: Omit<Draft, 'id' | 'updatedAt'>) {
  const article = await request<ArticleDto>('/admin/articles', {
    method: 'POST',
    body: JSON.stringify(toArticleRequest(payload)),
  })
  const draft = toDraft(article)
  draftStore.unshift(draft)
  return draft
}

export async function updateDraft(id: string, payload: Partial<Omit<Draft, 'id' | 'updatedAt'>>) {
  const current = draftStore.find((item) => item.id === id)

  if (!current) {
    return undefined
  }

  const article = await request<ArticleDto>(`/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toArticleRequest({ ...current, ...payload })),
  })
  const draft = toDraft(article)
  const index = draftStore.findIndex((item) => item.id === id)
  draftStore.splice(index, 1, draft)
  return draft
}

export async function approveDraft(id: string) {
  return patchDraft(id, 'approve')
}

export async function sendDraftToReview(id: string) {
  return patchDraft(id, 'submit')
}

export async function rejectDraft(id: string) {
  return patchDraft(id, 'reject')
}

export async function setDraftListingStatus(id: string, listingStatus: ListingStatus) {
  const article = await request<ArticleDto>(`/admin/articles/${id}/listing`, {
    method: 'PATCH',
    body: JSON.stringify({ listingStatus: listingStatus.toUpperCase() }),
  })
  return replaceDraft(article)
}

export async function deleteDraft(id: string) {
  await request<void>(`/admin/articles/${id}`, { method: 'DELETE' })
  removeDraft(id)
  return true
}

export async function generateArticle(prompt: string, options: GenerateArticleOptions) {
  const article = await request<ArticleDto>('/admin/articles/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, style: options.style, length: options.length, tags: options.tags }),
  })

  return {
    title: article.title,
    summary: article.summary,
    content: article.content,
    tags: article.tags,
  }
}

export function getRelatedPosts(current: Post) {
  return getPublicArticles()
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length + (post.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.post.heat - a.post.heat)
    .slice(0, 3)
    .map(({ post }) => post)
}

export function statusLabel(status: DraftStatus) {
  return {
    idea: '灵感',
    review: '待审核',
    ready: '可发布',
    published: '已发布',
  }[status]
}

export function listingStatusLabel(status: ListingStatus) {
  return {
    unlisted: '未上架',
    listed: '已上架',
  }[status]
}

async function patchDraft(id: string, action: 'submit' | 'approve' | 'reject') {
  const article = await request<ArticleDto>(`/admin/articles/${id}/${action}`, { method: 'PATCH' })
  return replaceDraft(article)
}

function replaceDraft(article: ArticleDto) {
  const draft = toDraft(article)
  const index = draftStore.findIndex((item) => item.id === draft.id)

  if (index >= 0) {
    draftStore.splice(index, 1, draft)
  } else {
    draftStore.unshift(draft)
  }

  const approvalIndex = approvalDraftStore.findIndex((item) => item.id === draft.id)
  if (draft.status === 'review') {
    if (approvalIndex >= 0) {
      approvalDraftStore.splice(approvalIndex, 1, draft)
    } else {
      approvalDraftStore.unshift(draft)
    }
  } else if (approvalIndex >= 0) {
    approvalDraftStore.splice(approvalIndex, 1)
  }

  return draft
}

function removeDraft(id: string) {
  const index = draftStore.findIndex((item) => item.id === id)
  if (index >= 0) {
    draftStore.splice(index, 1)
  }
  const approvalIndex = approvalDraftStore.findIndex((item) => item.id === id)
  if (approvalIndex >= 0) {
    approvalDraftStore.splice(approvalIndex, 1)
  }
}

function toPost(article: ArticleDto): Post {
  return {
    id: String(article.id),
    title: article.title,
    summary: article.summary,
    content: article.content,
    authorId: String(article.authorId),
    categoryId: String(article.categoryId),
    category: article.category || '未分类',
    tags: article.tags || [],
    cover: article.cover,
    readMinutes: article.readMinutes || 3,
    heat: article.heat || 0,
    publishedAt: formatDate(article.publishedAt || article.updatedAt),
  }
}

function toDraft(article: ArticleDto): Draft {
  return {
    id: String(article.id),
    title: article.title,
    summary: article.summary,
    content: article.content,
    status: normalizeStatus(article.status),
    listingStatus: normalizeListingStatus(article.listingStatus),
    source: normalizeSource(article.source),
    updatedAt: formatDateTime(article.updatedAt),
    tags: article.tags || [],
    authorId: String(article.authorId),
    categoryId: String(article.categoryId),
  }
}

function toArticleRequest(draft: Omit<Draft, 'id' | 'updatedAt'> | Draft) {
  return {
    title: draft.title,
    summary: draft.summary,
    content: draft.content,
    tags: draft.tags,
    authorId: draft.authorId,
    categoryId: draft.categoryId,
    source: draft.source === 'AI 生成' ? 'AI_GENERATED' : 'MANUAL',
  }
}

function normalizeStatus(status: string): DraftStatus {
  const normalized = status.toLowerCase()

  if (normalized === 'published') {
    return 'published'
  }

  if (normalized === 'ready' || normalized === 'review' || normalized === 'idea') {
    return normalized
  }

  return 'idea'
}

function normalizeListingStatus(status: string): ListingStatus {
  return status.toLowerCase() === 'listed' ? 'listed' : 'unlisted'
}

function normalizeSource(source: string) {
  return source === 'AI_GENERATED' ? 'AI 生成' : '手写'
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : ''
}

function formatDateTime(value?: string) {
  if (!value) {
    return ''
  }

  return value.replace('T', ' ').slice(0, 16)
}

function replace<T>(target: T[], values: T[]) {
  target.splice(0, target.length, ...values)
}
