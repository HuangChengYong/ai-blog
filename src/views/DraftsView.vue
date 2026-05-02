<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Delete as DeleteIcon, EditPen, FolderChecked, Promotion, RefreshLeft, SwitchButton } from '@element-plus/icons-vue'
import {
  approveDraft,
  deleteDraft,
  getDrafts,
  listingStatusLabel,
  loadDrafts,
  rejectDraft,
  sendDraftToReview,
  setDraftListingStatus,
  statusLabel,
  updateDraft,
} from '../services/blog'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import type { Draft, DraftStatus, ListingStatus } from '../types/blog'

type DraftFilter = DraftStatus | ListingStatus | 'all'

const activeFilter = ref<DraftFilter>('all')
const editDialogVisible = ref(false)
const currentDraftId = ref('')
const drafts = getDrafts()

const editForm = reactive({
  title: '',
  summary: '',
  content: '',
  tags: [] as string[],
})

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '灵感', value: 'idea' },
  { label: '待审核', value: 'review' },
  { label: '可发布', value: 'ready' },
  { label: '已发布', value: 'published' },
  { label: '已上架', value: 'listed' },
  { label: '未上架', value: 'unlisted' },
]

const visibleDrafts = computed(() => {
  if (activeFilter.value === 'all') return drafts
  if (activeFilter.value === 'listed' || activeFilter.value === 'unlisted') return drafts.filter((draft) => draft.listingStatus === activeFilter.value)
  return drafts.filter((draft) => draft.status === activeFilter.value)
})

onMounted(async () => {
  try {
    await loadDrafts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '草稿加载失败')
  }
})

function listingType(status: ListingStatus) {
  return status === 'listed' ? 'success' : 'info'
}

function openEdit(draft: Draft) {
  currentDraftId.value = draft.id
  editForm.title = draft.title
  editForm.summary = draft.summary
  editForm.content = draft.content
  editForm.tags = [...draft.tags]
  editDialogVisible.value = true
}

async function handleSaveEdit() {
  if (!editForm.title.trim()) {
    ElMessage.warning('标题不能为空')
    return
  }
  await updateDraft(currentDraftId.value, {
    title: editForm.title.trim(),
    summary: editForm.summary.trim(),
    content: editForm.content.trim(),
    tags: editForm.tags,
  })
  editDialogVisible.value = false
  ElMessage.success('草稿已更新')
}

async function handleSubmitReview(draft: Draft) {
  await sendDraftToReview(draft.id)
  ElMessage.success('已提交审核')
}

async function handleApprove(draft: Draft) {
  await approveDraft(draft.id)
  ElMessage.success('审核通过')
}

async function handleReject(draft: Draft) {
  try {
    await ElMessageBox.confirm('确定要驳回这篇文章并退回灵感状态吗？', '驳回文章', {
      confirmButtonText: '驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await rejectDraft(draft.id)
    ElMessage.success('已驳回')
  } catch {
    // 用户取消。
  }
}

function canToggleListing(draft: Draft) {
  return draft.status === 'ready' || draft.status === 'published'
}

async function handleToggleListing(draft: Draft) {
  if (!canToggleListing(draft)) {
    ElMessage.warning('只有审核通过的文章才能上架')
    return
  }
  const nextStatus: ListingStatus = draft.listingStatus === 'listed' ? 'unlisted' : 'listed'
  await setDraftListingStatus(draft.id, nextStatus)
  ElMessage.success(nextStatus === 'listed' ? '已上架' : '已下架')
}

async function handleDeleteDraft(draft: Draft) {
  if (draft.listingStatus === 'listed') {
    ElMessage.warning('已上架文章不能删除，请先下架')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？文章中的图片也会同步删除。', '删除文章', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteDraft(draft.id)
    ElMessage.success('文章已删除')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}
</script>

<template>
  <section class="drafts-layout">
    <div class="section-title-row">
      <div>
        <el-tag effect="dark" round>Draft Pipeline</el-tag>
        <h1>文章管理</h1>
        <p>通过后端接口完成编辑、提交审核、审核通过、上架和下架。</p>
      </div>
      <RouterLink to="/write">
        <el-button type="primary" size="large" :icon="EditPen">AI 创建</el-button>
      </RouterLink>
    </div>

    <section class="tool-band compact">
      <el-segmented v-model="activeFilter" :options="filterOptions" />
      <span>{{ visibleDrafts.length }} / {{ drafts.length }} 篇文章</span>
    </section>

    <el-empty v-if="visibleDrafts.length === 0" description="当前筛选下暂无草稿" />

    <section v-else class="draft-grid">
      <article v-for="draft in visibleDrafts" :key="draft.id" class="draft-card">
        <div class="draft-card-head">
          <div class="status-group">
            <el-tag :type="draft.status === 'ready' ? 'success' : draft.status === 'review' ? 'warning' : 'info'">
              {{ statusLabel(draft.status) }}
            </el-tag>
            <el-tag :type="listingType(draft.listingStatus)" effect="plain">
              {{ listingStatusLabel(draft.listingStatus) }}
            </el-tag>
          </div>
          <span>{{ draft.source }}</span>
        </div>

        <h2>{{ draft.title }}</h2>
        <p>{{ draft.summary }}</p>

        <div class="draft-tags">
          <el-tag v-for="tag in draft.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
        </div>

        <div class="draft-action-bar">
          <el-button :icon="FolderChecked" @click="openEdit(draft)">编辑</el-button>
          <el-button v-if="draft.status === 'idea'" :icon="Promotion" @click="handleSubmitReview(draft)">提交</el-button>
          <el-button v-if="draft.status === 'review'" type="success" :icon="Check" @click="handleApprove(draft)">通过</el-button>
          <el-button v-if="draft.status !== 'idea'" :icon="RefreshLeft" @click="handleReject(draft)">驳回</el-button>
          <el-button
            v-if="canToggleListing(draft)"
            :type="draft.listingStatus === 'listed' ? 'warning' : 'primary'"
            :icon="SwitchButton"
            @click="handleToggleListing(draft)"
          >
            {{ draft.listingStatus === 'listed' ? '下架' : '上架' }}
          </el-button>
          <el-button v-if="draft.listingStatus !== 'listed'" type="danger" :icon="DeleteIcon" @click="handleDeleteDraft(draft)">删除</el-button>
        </div>

        <div class="draft-footer">
          <span>更新于 {{ draft.updatedAt }}</span>
          <span>{{ draft.content.length }} 字符</span>
        </div>
      </article>
    </section>

    <el-dialog v-model="editDialogVisible" title="编辑文章" width="min(720px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" size="large" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="editForm.summary" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="正文">
          <MarkdownEditor v-model="editForm.content" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="editForm.tags" multiple filterable allow-create default-first-option>
            <el-option label="Agent" value="Agent" />
            <el-option label="RAG" value="RAG" />
            <el-option label="AI 写作" value="AI 写作" />
            <el-option label="Vue" value="Vue" />
            <el-option label="评测" value="评测" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </section>
</template>
