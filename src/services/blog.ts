import { reactive } from 'vue'
import { authors, initialDrafts, posts, topics } from '../data/mock'
import type { Draft, DraftStatus, GenerateArticleOptions, ListingStatus, Post } from '../types/blog'

const draftStore = reactive<Draft[]>([...initialDrafts])

const wait = (ms = 500) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function getPosts() {
  return posts
}

export function getPostById(id: string) {
  return posts.find((post) => post.id === id)
}

export function getPublicArticles() {
  return [...posts, ...draftStore.filter((draft) => draft.listingStatus === 'listed').map(draftToPost)]
}

export function getPublicArticleById(id: string) {
  return getPublicArticles().find((post) => post.id === id)
}

export function getAuthorById(id: string) {
  return authors.find((author) => author.id === id)
}

export function getTopics() {
  return topics
}

export function getDrafts() {
  return draftStore
}

export function createDraft(payload: Omit<Draft, 'id' | 'updatedAt'>) {
  const draft: Draft = {
    ...payload,
    id: `draft-${Date.now()}`,
    updatedAt: formatDateTime(),
  }

  draftStore.unshift(draft)
  return draft
}

export function updateDraft(id: string, payload: Partial<Omit<Draft, 'id' | 'updatedAt'>>) {
  const draft = draftStore.find((item) => item.id === id)

  if (!draft) {
    return undefined
  }

  Object.assign(draft, payload, { updatedAt: formatDateTime() })
  return draft
}

export function approveDraft(id: string) {
  return updateDraft(id, { status: 'ready' })
}

export function sendDraftToReview(id: string) {
  return updateDraft(id, { status: 'review', listingStatus: 'unlisted' })
}

export function setDraftListingStatus(id: string, listingStatus: ListingStatus) {
  return updateDraft(id, { listingStatus })
}

export async function generateMockArticle(prompt: string, options: GenerateArticleOptions) {
  await wait(900)

  const cleanPrompt = prompt.trim() || 'AI 博客平台的内容增长策略'
  const tagLine = options.tags.length ? options.tags.join('、') : 'AI、内容、工程化'
  const outline = [
    `为什么「${cleanPrompt}」值得现在讨论`,
    `用 ${options.style} 视角拆解关键问题`,
    `围绕 ${tagLine} 设计可执行方案`,
    '如何验证效果并持续迭代',
  ]

  return {
    title: cleanPrompt,
    summary: `一篇偏${options.style}风格的${options.length}文章，聚焦 ${tagLine} 的真实落地路径。`,
    content: [
      `# ${cleanPrompt}`,
      '',
      `这篇草稿会从 ${options.style} 的角度切入，先定义问题，再把 AI 能力放回具体的内容生产流程里。`,
      '',
      '## 大纲',
      ...outline.map((item, index) => `${index + 1}. ${item}`),
      '',
      '## 正文草稿',
      `如果一个 AI 博客平台想真正帮助作者，核心不是让模型替作者做完所有判断，而是把选题、资料整理、结构生成和发布检查变成连续、透明的工作流。`,
      `在这个流程里，${tagLine} 不是孤立标签，而是系统理解文章意图、推荐参考内容和沉淀草稿资产的入口。`,
      '第一版可以先用清晰的 Mock 数据跑通体验，后续再把生成、检索和发布接入真实服务。',
    ].join('\n'),
    tags: options.tags.length ? options.tags : ['AI 写作', '内容平台'],
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

function draftToPost(draft: Draft): Post {
  return {
    id: draft.id,
    title: draft.title,
    summary: draft.summary,
    content: draft.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    authorId: 'a-01',
    category: 'AI 工程',
    tags: draft.tags,
    cover: 'linear-gradient(135deg, #0f172a, #22d3ee 46%, #34d399)',
    readMinutes: Math.max(3, Math.ceil(draft.content.length / 450)),
    heat: draft.listingStatus === 'listed' ? 72 : 0,
    publishedAt: draft.updatedAt,
  }
}

export function statusLabel(status: DraftStatus) {
  return {
    idea: '灵感',
    review: '待审',
    ready: '可发布',
  }[status]
}

export function listingStatusLabel(status: ListingStatus) {
  return {
    unlisted: '未上架',
    listed: '已上架',
  }[status]
}

function formatDateTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}
