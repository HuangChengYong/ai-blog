<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Collection, DocumentAdd, MagicStick } from '@element-plus/icons-vue'
import { createDraft, generateArticle } from '../../services/blog'
import { loadAdminStudioOptions, type AdminStudioOptions } from '../../services/admin'
import { hasPermission } from '../../services/auth'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import type { GenerateArticleOptions } from '../../types/blog'

interface GeneratedArticle {
  title: string
  summary: string
  content: string
  tags: string[]
}

const router = useRouter()
const loading = ref(false)
const generated = ref<GeneratedArticle | null>(null)
const studioOptions = ref<AdminStudioOptions>({
  styles: ['工程实践', '产品分析', '教程指南'],
  lengths: ['短篇', '中篇', '长篇'],
  tags: ['Agent', 'RAG', 'AI 写作', 'Vue', '评测'],
})

const generationForm = reactive<GenerateArticleOptions & { prompt: string }>({
  prompt: '如何让 Agent 工作流可审计',
  style: '工程实践',
  length: '中篇',
  tags: ['Agent', 'AI 写作'],
})

onMounted(async () => {
  try {
    studioOptions.value = await loadAdminStudioOptions()
    generationForm.style ||= studioOptions.value.styles[0] || ''
    generationForm.length ||= studioOptions.value.lengths[1] || studioOptions.value.lengths[0] || ''
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '写作配置加载失败')
  }
})

async function handleGenerate() {
  if (!generationForm.prompt.trim()) {
    ElMessage.warning('请先填写文章主题')
    return
  }

  loading.value = true
  try {
    generated.value = await generateArticle(generationForm.prompt, generationForm)
    ElMessage.success('文章已生成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成失败')
  } finally {
    loading.value = false
  }
}

async function handleSaveDraft() {
  if (!generated.value) {
    ElMessage.warning('请先生成文章')
    return
  }

  try {
    await createDraft({
      title: generated.value.title,
      summary: generated.value.summary,
      content: generated.value.content,
      tags: generated.value.tags,
      status: 'review',
      listingStatus: 'unlisted',
      source: 'AI 生成',
    })
    ElMessage.success('已保存至审核流程')
    router.push('/admin/articles')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  }
}
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <div>
        <h1>AI 写作</h1>
        <p>调用后端生成接口创建文章草稿，并保存到审核流程。</p>
      </div>
    </div>

    <div class="writer-grid">
      <section class="panel">
        <div class="section-heading">
          <span>生成文章</span>
          <strong><el-icon><MagicStick /></el-icon></strong>
        </div>

        <el-form label-position="top">
          <el-form-item label="文章主题">
            <el-input v-model="generationForm.prompt" size="large" />
          </el-form-item>
          <el-form-item label="写作风格">
            <el-segmented v-model="generationForm.style" :options="studioOptions.styles" />
          </el-form-item>
          <el-form-item label="篇幅">
            <el-radio-group v-model="generationForm.length">
              <el-radio-button v-for="length in studioOptions.lengths" :key="length" :value="length">
                {{ length }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="generationForm.tags" multiple filterable allow-create default-first-option>
              <el-option v-for="tag in studioOptions.tags" :key="tag" :label="tag" :value="tag" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="action-row">
          <el-button v-if="hasPermission('studio.generate')" type="primary" size="large" :loading="loading" :icon="MagicStick" @click="handleGenerate">生成文章</el-button>
          <el-button v-if="hasPermission('article.create')" size="large" :icon="DocumentAdd" @click="handleSaveDraft">保存草稿</el-button>
        </div>
      </section>

      <section class="panel preview-panel">
        <div class="section-heading">
          <span>预览</span>
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
        <el-empty v-else description="输入主题后生成一篇文章草稿。" />
      </section>
    </div>
  </section>
</template>
