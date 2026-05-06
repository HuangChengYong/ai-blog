<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Document, RefreshLeft } from '@element-plus/icons-vue'
import {
  approveDraft,
  getApprovalDrafts,
  listingStatusLabel,
  loadApprovalDrafts,
  rejectDraft,
  statusLabel,
} from '../../services/blog'
import { hasPermission } from '../../services/auth'
import MarkdownBody from '../../components/MarkdownBody.vue'
import type { Draft, ListingStatus } from '../../types/blog'

const reviewDrafts = getApprovalDrafts()
const previewDialogVisible = ref(false)
const previewDraft = ref<Draft | null>(null)

onMounted(loadApprovalDrafts)

function listingType(status: ListingStatus) {
  return status === 'listed' ? 'success' : 'info'
}

function openPreview(draft: Draft) {
  previewDraft.value = draft
  previewDialogVisible.value = true
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
    // User cancelled.
  }
}
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <div>
        <h1>内容审核</h1>
        <p>审核待处理文章，并推动优质草稿进入发布流程。</p>
      </div>
      <span class="page-badge">{{ reviewDrafts.length }} 篇待审核</span>
    </div>

    <section class="approval-list">
      <el-empty v-if="reviewDrafts.length === 0" description="暂无待审核文章" />
      <article v-for="draft in reviewDrafts" :key="draft.id" class="approval-item">
        <div>
          <h3>{{ draft.title }}</h3>
          <p>{{ draft.summary }}</p>
        </div>
        <div class="draft-action-bar">
          <el-button :icon="Document" @click="openPreview(draft)">预览</el-button>
          <el-button v-if="hasPermission('approval.review')" type="success" :icon="Check" @click="handleApprove(draft)">通过</el-button>
          <el-button v-if="hasPermission('approval.review')" :icon="RefreshLeft" @click="handleReject(draft)">驳回</el-button>
        </div>
      </article>
    </section>

    <el-dialog v-model="previewDialogVisible" title="文章预览" width="min(820px, 94vw)">
      <article v-if="previewDraft" class="admin-preview">
        <div class="post-meta">
          <el-tag>{{ statusLabel(previewDraft.status) }}</el-tag>
          <el-tag :type="listingType(previewDraft.listingStatus)" effect="plain">
            {{ listingStatusLabel(previewDraft.listingStatus) }}
          </el-tag>
        </div>
        <h2>{{ previewDraft.title }}</h2>
        <p class="article-summary">{{ previewDraft.summary }}</p>
        <div class="article-tags">
          <el-tag v-for="tag in previewDraft.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
        </div>
        <MarkdownBody :content="previewDraft.content" />
      </article>
    </el-dialog>
  </section>
</template>
