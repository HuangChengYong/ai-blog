<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, EditPen, FolderChecked, Promotion, RefreshLeft, SwitchButton } from '@element-plus/icons-vue'
import {
  approveDraft,
  getDrafts,
  listingStatusLabel,
  sendDraftToReview,
  setDraftListingStatus,
  statusLabel,
  updateDraft,
} from '../services/blog'
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
  { label: '待审', value: 'review' },
  { label: '可发布', value: 'ready' },
  { label: '已上架', value: 'listed' },
  { label: '未上架', value: 'unlisted' },
]

const visibleDrafts = computed(() => {
  if (activeFilter.value === 'all') {
    return drafts
  }

  if (activeFilter.value === 'listed' || activeFilter.value === 'unlisted') {
    return drafts.filter((draft) => draft.listingStatus === activeFilter.value)
  }

  return drafts.filter((draft) => draft.status === activeFilter.value)
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

function handleSaveEdit() {
  if (!editForm.title.trim()) {
    ElMessage.warning('标题不能为空')
    return
  }

  updateDraft(currentDraftId.value, {
    title: editForm.title.trim(),
    summary: editForm.summary.trim(),
    content: editForm.content.trim(),
    tags: editForm.tags,
  })
  editDialogVisible.value = false
  ElMessage.success('草稿已更新')
}

function handleSubmitReview(draft: Draft) {
  sendDraftToReview(draft.id)
  ElMessage.success('已提交审批')
}

function handleApprove(draft: Draft) {
  approveDraft(draft.id)
  ElMessage.success('审批通过，草稿已进入可发布状态')
}

async function handleReject(draft: Draft) {
  try {
    await ElMessageBox.confirm('退回后草稿会回到灵感状态，并自动下架。', '退回修改', {
      confirmButtonText: '退回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    updateDraft(draft.id, { status: 'idea', listingStatus: 'unlisted' })
    ElMessage.success('已退回修改')
  } catch {
    // 用户取消时不需要提示。
  }
}

function handleToggleListing(draft: Draft) {
  if (draft.status !== 'ready') {
    ElMessage.warning('只有审批通过的草稿才能上架')
    return
  }

  const nextStatus: ListingStatus = draft.listingStatus === 'listed' ? 'unlisted' : 'listed'
  setDraftListingStatus(draft.id, nextStatus)
  ElMessage.success(nextStatus === 'listed' ? '已上架' : '已下架')
}
</script>

<template>
  <section class="drafts-layout">
    <div class="section-title-row">
      <div>
        <el-tag effect="dark" round>Draft Pipeline</el-tag>
        <h1>草稿资产库</h1>
        <p>编辑、审批、上架和下架都在前端 Mock 状态里完成，方便先验证内容管理体验。</p>
      </div>
      <RouterLink to="/write">
        <el-button type="primary" size="large" :icon="EditPen">新建 AI 草稿</el-button>
      </RouterLink>
    </div>

    <section class="tool-band compact">
      <el-segmented v-model="activeFilter" :options="filterOptions" />
      <span>{{ visibleDrafts.length }} / {{ drafts.length }} 篇草稿</span>
    </section>

    <el-empty v-if="visibleDrafts.length === 0" description="当前筛选下还没有草稿" />

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
          <el-button v-if="draft.status === 'idea'" :icon="Promotion" @click="handleSubmitReview(draft)">
            提交审批
          </el-button>
          <el-button v-if="draft.status === 'review'" type="success" :icon="Check" @click="handleApprove(draft)">
            审批通过
          </el-button>
          <el-button v-if="draft.status !== 'idea'" :icon="RefreshLeft" @click="handleReject(draft)">
            退回
          </el-button>
          <el-button
            :type="draft.listingStatus === 'listed' ? 'warning' : 'primary'"
            :icon="SwitchButton"
            @click="handleToggleListing(draft)"
          >
            {{ draft.listingStatus === 'listed' ? '下架' : '上架' }}
          </el-button>
        </div>

        <div class="draft-footer">
          <span>更新于 {{ draft.updatedAt }}</span>
          <span>{{ draft.content.length }} 字符</span>
        </div>
      </article>
    </section>

    <el-dialog v-model="editDialogVisible" title="编辑草稿" width="min(720px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" size="large" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="editForm.summary" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="editForm.content" type="textarea" :rows="10" />
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
