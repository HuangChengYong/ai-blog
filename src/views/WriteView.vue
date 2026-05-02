<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Collection, DocumentAdd, MagicStick } from '@element-plus/icons-vue'
import { createDraft, generateArticle } from '../services/blog'
import MarkdownEditor from '../components/MarkdownEditor.vue'

const router = useRouter()
const loading = ref(false)
const generated = ref<{ title: string; summary: string; content: string; tags: string[] } | null>(null)

const form = reactive({
  prompt: '如何让 Agent 工作流可审计',
  style: '工程实践',
  length: '中篇',
  tags: ['Agent', 'AI 写作'],
})

async function handleGenerate() {
  loading.value = true
  try {
    generated.value = await generateArticle(form.prompt, {
      style: form.style,
      length: form.length,
      tags: form.tags,
    })
    ElMessage.success('文章已生成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!generated.value) {
    ElMessage.warning('请先生成文章')
    return
  }

  await createDraft({
    title: generated.value.title,
    summary: generated.value.summary,
    content: generated.value.content,
    tags: generated.value.tags,
    status: 'review',
    listingStatus: 'unlisted',
    source: 'AI 生成',
  })
  ElMessage.success('已保存到草稿')
  router.push('/drafts')
}
</script>

<template>
  <section class="write-layout">
    <div class="write-intro">
      <el-tag effect="dark" round>AI Writing Studio</el-tag>
      <h1>把选题变成可编辑的技术文章草稿。</h1>
      <p>这里会调用后端生成接口，生成后可保存到文章管理流程。</p>
    </div>

    <div class="writer-grid">
      <section class="panel">
        <div class="section-heading">
          <span>生成参数</span>
          <strong><el-icon><MagicStick /></el-icon></strong>
        </div>

        <el-form label-position="top">
          <el-form-item label="文章主题">
            <el-input v-model="form.prompt" size="large" placeholder="输入一个技术选题" />
          </el-form-item>
          <el-form-item label="写作风格">
            <el-segmented v-model="form.style" :options="['工程实践', '产品分析', '教程指南']" />
          </el-form-item>
          <el-form-item label="篇幅">
            <el-radio-group v-model="form.length">
              <el-radio-button value="短篇">短篇</el-radio-button>
              <el-radio-button value="中篇">中篇</el-radio-button>
              <el-radio-button value="长篇">长篇</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple filterable allow-create default-first-option>
              <el-option label="Agent" value="Agent" />
              <el-option label="RAG" value="RAG" />
              <el-option label="AI 写作" value="AI 写作" />
              <el-option label="Vue" value="Vue" />
              <el-option label="评测" value="评测" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="action-row">
          <el-button type="primary" size="large" :loading="loading" :icon="MagicStick" @click="handleGenerate">
            生成草稿
          </el-button>
          <el-button size="large" :icon="DocumentAdd" @click="handleSave">保存草稿</el-button>
        </div>
      </section>

      <section class="panel preview-panel">
        <div class="section-heading">
          <span>生成预览</span>
          <strong><el-icon><Collection /></el-icon></strong>
        </div>

        <el-skeleton v-if="loading" :rows="9" animated />

        <div v-else-if="generated" class="generated-doc">
          <el-form label-position="top">
            <el-form-item label="标题">
              <el-input v-model="generated.title" size="large" />
            </el-form-item>
            <el-form-item label="摘要">
              <el-input v-model="generated.summary" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
          <div class="article-tags">
            <el-tag v-for="tag in generated.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
          </div>
          <MarkdownEditor v-model="generated.content" />
        </div>

        <el-empty v-else description="输入主题后生成一篇文章草稿" />
      </section>
    </div>
  </section>
</template>
