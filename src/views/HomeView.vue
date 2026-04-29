<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ChatDotRound, Promotion, Search, TrendCharts } from '@element-plus/icons-vue'
import { getAuthorById, getPublicArticles, getTopics } from '../services/blog'
import type { PostCategory } from '../types/blog'

const search = ref('')
const activeTag = ref('全部')
const activeCategory = ref<PostCategory | '全部'>('全部')
const sortBy = ref('heat')
const toolBandRef = ref<HTMLElement>()
const searchInputRef = ref<{ focus: () => void }>()
const assistantOpen = ref(false)
const assistantQuestion = ref('')
const assistantAnswer = ref('你可以问我某个技术关键词、标签或专题，我会从当前博客文章里帮你找线索。')

const posts = computed(() => getPublicArticles())
const topics = getTopics()
const tags = computed(() => ['全部', ...new Set(posts.value.flatMap((post) => post.tags))])
const categories = computed(() => ['全部', ...new Set(posts.value.map((post) => post.category))] as Array<PostCategory | '全部'>)
const hotQuestions = ['有哪些 RAG 文章？', '推荐 Agent 工作流内容', '最新发布了什么？']

const filteredPosts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return [...posts.value]
    .filter((post) => {
      const matchesKeyword =
        !keyword ||
        [post.title, post.summary, post.category, ...post.tags].some((text) => text.toLowerCase().includes(keyword))
      const matchesTag = activeTag.value === '全部' || post.tags.includes(activeTag.value)
      const matchesCategory = activeCategory.value === '全部' || post.category === activeCategory.value

      return matchesKeyword && matchesTag && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy.value === 'latest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      }

      return b.heat - a.heat
    })
})

function focusArticleSearch() {
  toolBandRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  nextTick(() => searchInputRef.value?.focus())
}

function openAssistant() {
  assistantOpen.value = true
}

function askBlog(question = assistantQuestion.value) {
  const keyword = question.trim()

  if (!keyword) {
    assistantAnswer.value = '先输入一个问题，比如“有哪些 RAG 文章？”或“推荐 Agent 工作流内容”。'
    return
  }

  assistantQuestion.value = keyword
  const normalized = keyword.toLowerCase()
  const matched = posts.value
    .filter((post) =>
      [post.title, post.summary, post.category, ...post.tags].some((text) => normalized.includes(text.toLowerCase()) || text.toLowerCase().includes(normalized)),
    )
    .slice(0, 3)

  const candidates = matched.length > 0 ? matched : [...posts.value].sort((a, b) => b.heat - a.heat).slice(0, 3)
  const titles = candidates.map((post) => `《${post.title}》`).join('、')

  assistantAnswer.value =
    matched.length > 0
      ? `我在文章库里找到了 ${candidates.length} 条相关内容：${titles}。你可以点开文章继续阅读，或换一个更具体的标签继续问。`
      : `暂时没找到完全匹配的问题，我先按热度推荐：${titles}。你也可以试试 RAG、Agent、评测、Vue 这些关键词。`
}
</script>

<template>
  <section class="hero-section">
    <div class="hero-copy">
      <h1>让 AI 帮你整理技术思考，沉淀成可发现的文章库。</h1>
      <p>
        面向访客的 AI 技术博客入口。文章、专题、标签和推荐流汇聚在同一处，让读者更快找到有价值的内容。
      </p>
      <div class="hero-actions">
        <el-button type="primary" size="large" :icon="Search" @click="focusArticleSearch">搜索文章</el-button>
        <el-button size="large" :icon="ChatDotRound" @click="openAssistant">问我的博客</el-button>
      </div>
      <div class="hero-stats" aria-label="博客概览">
        <span><strong>{{ posts.length }}</strong> 篇文章</span>
        <span><strong>{{ topics.length }}</strong> 个专题</span>
        <span><strong>92%</strong> 推荐热度</span>
      </div>
    </div>

    <div class="signal-panel">
      <div class="pulse-line"></div>
      <div class="signal-header">
        <span>内容雷达</span>
        <strong>Live</strong>
      </div>
      <div class="signal-core" aria-hidden="true">
        <span></span>
        <i></i>
      </div>
      <div class="metric">
        <span>公开内容</span>
        <strong>已上架</strong>
      </div>
      <div class="metric">
        <span>当前匹配</span>
        <strong>{{ filteredPosts.length }} 篇</strong>
      </div>
      <div class="metric">
        <span>精选专题</span>
        <strong>{{ topics.length }}</strong>
      </div>
    </div>
  </section>

  <section ref="toolBandRef" class="tool-band">
    <el-input ref="searchInputRef" v-model="search" size="large" placeholder="搜索标题、摘要、标签" :prefix-icon="Search" clearable />
    <el-segmented v-model="activeCategory" :options="categories" />
    <el-select v-model="sortBy" size="large" aria-label="排序方式">
      <el-option label="热度优先" value="heat" />
      <el-option label="最新发布" value="latest" />
    </el-select>
  </section>

  <section class="tag-row" aria-label="标签筛选">
    <el-check-tag v-for="tag in tags" :key="tag" :checked="activeTag === tag" @change="activeTag = tag">
      {{ tag }}
    </el-check-tag>
  </section>

  <section class="content-grid">
    <div class="post-list">
      <div class="section-heading">
        <span>发现文章</span>
        <strong>{{ filteredPosts.length }} 篇</strong>
      </div>

      <el-empty v-if="filteredPosts.length === 0" description="没有匹配的文章，换个关键词试试。" />

      <RouterLink v-for="post in filteredPosts" :key="post.id" class="post-card" :to="`/posts/${post.id}`">
        <div class="post-cover" :style="{ background: post.cover }">
          <TrendCharts />
          <span>{{ post.heat }}</span>
        </div>
        <div class="post-body">
          <div class="post-meta">
            <el-tag size="small">{{ post.category }}</el-tag>
            <span>{{ post.readMinutes }} min read</span>
            <span>{{ post.publishedAt }}</span>
          </div>
          <h2>{{ post.title }}</h2>
          <p>{{ post.summary }}</p>
          <div class="post-footer">
            <span>{{ getAuthorById(post.authorId)?.name }}</span>
            <div>
              <el-tag v-for="tag in post.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </RouterLink>
    </div>

    <aside class="side-stack">
      <section class="panel">
        <div class="section-heading">
          <span>精选专题</span>
          <strong>{{ topics.length }}</strong>
        </div>
        <div v-for="topic in topics" :key="topic.id" class="topic-item">
          <h3>{{ topic.title }}</h3>
          <p>{{ topic.description }}</p>
          <div>
            <el-tag v-for="tag in topic.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
          </div>
        </div>
      </section>

      <section class="panel recommendation">
        <span>AI 推荐</span>
        <h3>今天适合写一篇「Agent 可审计工作流」。</h3>
        <p>你的草稿和最近热文都指向这个主题，建议从失败场景和用户确认点切入。</p>
      </section>
    </aside>
  </section>

  <el-drawer v-model="assistantOpen" title="问我的博客" size="420px" class="blog-assistant">
    <div class="assistant-panel">
      <div class="assistant-answer">
        <span>AI</span>
        <p>{{ assistantAnswer }}</p>
      </div>
      <div class="assistant-prompts">
        <button v-for="question in hotQuestions" :key="question" type="button" @click="askBlog(question)">
          {{ question }}
        </button>
      </div>
      <div class="assistant-input">
        <el-input
          v-model="assistantQuestion"
          type="textarea"
          :rows="4"
          resize="none"
          placeholder="输入你想问的问题"
          @keydown.enter.exact.prevent="askBlog()"
        />
        <el-button type="primary" :icon="Promotion" @click="askBlog()">发送</el-button>
      </div>
    </div>
  </el-drawer>
</template>
