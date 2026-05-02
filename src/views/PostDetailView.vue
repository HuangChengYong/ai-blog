<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Back, Clock, Connection, Top } from '@element-plus/icons-vue'
import { getAuthorById, getPublicArticleById, getRelatedPosts, loadAuthors, loadPublicArticleById, loadPublicArticles } from '../services/blog'
import MarkdownBody from '../components/MarkdownBody.vue'

const route = useRoute()
const post = computed(() => getPublicArticleById(String(route.params.id)))
const author = computed(() => (post.value ? getAuthorById(post.value.authorId) : undefined))
const relatedPosts = computed(() => (post.value ? getRelatedPosts(post.value) : []))

async function loadPagePost() {
  await Promise.all([loadAuthors(), loadPublicArticles()])
  await loadPublicArticleById(String(route.params.id))
}

onMounted(loadPagePost)
watch(() => route.params.id, loadPagePost)
</script>

<template>
  <section v-if="post" class="detail-layout">
    <RouterLink class="back-link" to="/">
      <el-icon><Back /></el-icon>
      返回发现
    </RouterLink>

    <article class="article-panel">
      <div class="article-cover" :style="{ background: post.cover }">
        <span>{{ post.category }}</span>
      </div>
      <div class="article-content">
        <div class="post-meta">
          <el-tag>{{ post.category }}</el-tag>
          <span><el-icon><Clock /></el-icon>{{ post.readMinutes }} min read</span>
          <span>{{ post.publishedAt }}</span>
        </div>
        <h1>{{ post.title }}</h1>
        <p class="article-summary">{{ post.summary }}</p>

        <div v-if="author" class="author-strip">
          <el-avatar :src="author.avatar" :size="46" />
          <div>
            <strong>{{ author.name }}</strong>
            <span>{{ author.role }} · {{ author.aiPreference }}</span>
          </div>
        </div>

        <MarkdownBody :content="post.content" />

        <div class="article-tags">
          <el-tag v-for="tag in post.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
        </div>
      </div>
    </article>

    <section class="related-section">
      <div class="section-heading">
        <span>相关推荐</span>
        <strong><el-icon><Connection /></el-icon></strong>
      </div>
      <div class="related-grid">
        <RouterLink v-for="item in relatedPosts" :key="item.id" class="related-card" :to="`/posts/${item.id}`">
          <span>{{ item.category }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
        </RouterLink>
      </div>
    </section>

    <el-backtop :right="30" :bottom="96" class="page-backtop">
      <el-icon><Top /></el-icon>
    </el-backtop>
  </section>

  <el-empty v-else class="page-empty" description="没有找到这篇文章">
    <RouterLink to="/">
      <el-button type="primary">回到首页</el-button>
    </RouterLink>
  </el-empty>
</template>
