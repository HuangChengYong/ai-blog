<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Collection,
  DataAnalysis,
  Document,
  DocumentAdd,
  EditPen,
  FolderChecked,
  Key,
  Lock,
  MagicStick,
  Promotion,
  RefreshLeft,
  Setting,
  SwitchButton,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import {
  approveDraft,
  createDraft,
  generateMockArticle,
  getDrafts,
  listingStatusLabel,
  sendDraftToReview,
  setDraftListingStatus,
  statusLabel,
  updateDraft,
} from '../services/blog'
import { changePassword, getAdminUsername, logout } from '../services/auth'
import type { Draft, DraftStatus, ListingStatus } from '../types/blog'

type DraftFilter = DraftStatus | ListingStatus | 'all'
type AdminSection = 'overview' | 'studio' | 'articles' | 'approvals' | 'users' | 'roles'

const router = useRouter()
const activeSection = ref<AdminSection>('overview')
const activeFilter = ref<DraftFilter>('all')
const loading = ref(false)
const generated = ref<{ title: string; summary: string; content: string; tags: string[] } | null>(null)
const editDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const profileDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const currentDraftId = ref('')
const previewDraft = ref<Draft | null>(null)
const drafts = getDrafts()
const username = getAdminUsername()

const navItems: Array<{ key: AdminSection; label: string; icon: Component }> = [
  { key: 'overview', label: '运营概览', icon: DataAnalysis },
  { key: 'studio', label: 'AI写作工作台', icon: MagicStick },
  { key: 'articles', label: '文章管理', icon: Document },
  { key: 'approvals', label: '审批管理', icon: FolderChecked },
  { key: 'users', label: '用户管理', icon: User },
  { key: 'roles', label: '角色管理', icon: Setting },
]

const generationForm = reactive({
  prompt: 'Agent 工作流如何做到可审计',
  style: '工程实践',
  length: '中篇',
  tags: ['Agent', 'AI 写作'],
})

const editForm = reactive({
  title: '',
  summary: '',
  content: '',
  tags: [] as string[],
})

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '灵感', value: 'idea' },
  { label: '待审批', value: 'review' },
  { label: '可发布', value: 'ready' },
  { label: '已上架', value: 'listed' },
  { label: '未上架', value: 'unlisted' },
]

const userRows = [
  { name: 'admin', role: '超级管理员', status: '在线', scope: '全部权限', lastSeen: '刚刚' },
  { name: 'editor', role: '内容编辑', status: '启用', scope: '写作、文章管理', lastSeen: '今天 09:30' },
  { name: 'reviewer', role: '审批员', status: '启用', scope: '审批、发布建议', lastSeen: '昨天 18:12' },
]

const roleRows = [
  { name: '超级管理员', users: 1, permissions: ['全部模块', '权限配置', '账号管理'] },
  { name: '内容编辑', users: 3, permissions: ['AI写作', '文章管理'] },
  { name: '审批员', users: 2, permissions: ['审批管理', '发布审核'] },
]

const workflowSteps = [
  { title: '选题生成', text: '用 AI 写作工作台生成草稿、摘要和标签。' },
  { title: '内容编辑', text: '在文章管理中修订标题、摘要、正文和发布标签。' },
  { title: '审批发布', text: '审批管理集中处理待审内容，通过后即可上架。' },
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

const reviewDrafts = computed(() => drafts.filter((draft) => draft.status === 'review'))
const listedDrafts = computed(() => drafts.filter((draft) => draft.listingStatus === 'listed'))
const readyDrafts = computed(() => drafts.filter((draft) => draft.status === 'ready'))

const dashboardStats = computed(() => [
  { label: '全部内容', value: drafts.length },
  { label: '待审批', value: reviewDrafts.value.length },
  { label: '已上架', value: listedDrafts.value.length },
  { label: '可发布', value: readyDrafts.value.length },
])

function listingType(status: ListingStatus) {
  return status === 'listed' ? 'success' : 'info'
}

async function handleGenerate() {
  loading.value = true
  try {
    generated.value = await generateMockArticle(generationForm.prompt, {
      style: generationForm.style,
      length: generationForm.length,
      tags: generationForm.tags,
    })
    ElMessage.success('文章已生成，可以预览后保存')
  } finally {
    loading.value = false
  }
}

function handleSaveGeneratedDraft() {
  if (!generated.value) {
    ElMessage.warning('请先生成一篇文章')
    return
  }

  createDraft({
    title: generated.value.title,
    summary: generated.value.summary,
    content: generated.value.content,
    tags: generated.value.tags,
    status: 'review',
    listingStatus: 'unlisted',
    source: 'AI 生成',
  })
  ElMessage.success('已保存到文章管理，状态为待审批')
  activeSection.value = 'articles'
}

function openEdit(draft: Draft) {
  currentDraftId.value = draft.id
  editForm.title = draft.title
  editForm.summary = draft.summary
  editForm.content = draft.content
  editForm.tags = [...draft.tags]
  editDialogVisible.value = true
}

function openPreview(draft: Draft) {
  previewDraft.value = draft
  previewDialogVisible.value = true
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
  ElMessage.success('文章已更新')
}

function handleSubmitReview(draft: Draft) {
  sendDraftToReview(draft.id)
  ElMessage.success('已提交审批')
}

function handleApprove(draft: Draft) {
  approveDraft(draft.id)
  ElMessage.success('审批通过，文章已进入可发布状态')
}

async function handleReject(draft: Draft) {
  try {
    await ElMessageBox.confirm('退回后文章会回到灵感状态，并自动下架。', '退回修改', {
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
    ElMessage.warning('只有审批通过的文章才能上架')
    return
  }

  const nextStatus: ListingStatus = draft.listingStatus === 'listed' ? 'unlisted' : 'listed'
  setDraftListingStatus(draft.id, nextStatus)
  ElMessage.success(nextStatus === 'listed' ? '已上架，访客站点可搜索到' : '已下架，访客站点不再展示')
}

function handleUserCommand(command: string) {
  if (command === 'profile') {
    profileDialogVisible.value = true
  }

  if (command === 'password') {
    passwordDialogVisible.value = true
  }

  if (command === 'logout') {
    handleLogout()
  }
}

function handlePasswordChange() {
  if (!passwordForm.current || !passwordForm.next) {
    ElMessage.warning('请填写当前密码和新密码')
    return
  }

  if (passwordForm.next.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }

  if (passwordForm.next !== passwordForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  if (!changePassword(passwordForm.current, passwordForm.next)) {
    ElMessage.error('当前密码不正确')
    return
  }

  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
  passwordDialogVisible.value = false
  ElMessage.success('密码已修改，下次登录生效')
}

function handleLogout() {
  logout()
  router.replace('/admin/login')
}
</script>

<template>
  <section class="admin-page">
    <header class="admin-toolbar">
      <div class="admin-toolbar-brand">
        <span class="brand-mark">AI</span>
        <div>
          <strong>NeuroBlog</strong>
          <small>后台管理</small>
        </div>
      </div>

      <div class="admin-toolbar-title">
        <strong>后台管理</strong>
        <span>内容生产、审批、发布和权限管理集中在这里。</span>
      </div>

      <el-dropdown trigger="click" @command="handleUserCommand">
        <button class="admin-user-menu" type="button">
          <span>{{ username }}</span>
          <span class="admin-avatar">
            <el-icon><UserFilled /></el-icon>
          </span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" :icon="User">个人信息</el-dropdown-item>
            <el-dropdown-item command="password" :icon="Lock">修改密码</el-dropdown-item>
            <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="admin-body">
      <aside class="admin-sidebar">
        <nav class="admin-nav" aria-label="后台导航">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            :class="{ active: activeSection === item.key }"
            @click="activeSection = item.key"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <div class="admin-main">

      <main class="admin-content">
        <section v-if="activeSection === 'overview'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>运营概览</h1>
              <p>查看内容生产、审批和发布状态，快速判断当前运营节奏。</p>
            </div>
            <el-button type="primary" :icon="MagicStick" @click="activeSection = 'studio'">开始写作</el-button>
          </div>

          <section class="admin-stats">
            <div v-for="item in dashboardStats" :key="item.label" class="admin-kpi">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </section>

          <section class="overview-board">
            <div class="panel overview-feature">
              <div class="section-heading">
                <span>工作流</span>
                <strong><el-icon><DataAnalysis /></el-icon></strong>
              </div>
              <div class="workflow-steps">
                <div v-for="(step, index) in workflowSteps" :key="step.title">
                  <span>{{ index + 1 }}</span>
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.text }}</p>
                </div>
              </div>
            </div>

            <div class="panel overview-feature">
              <div class="section-heading">
                <span>发布健康度</span>
                <strong>92%</strong>
              </div>
              <div class="health-meter">
                <i></i>
              </div>
              <p>内容池处于健康状态，待审批内容集中在审批管理中，建议优先处理待审批文章。</p>
            </div>
          </section>
        </section>

        <section v-if="activeSection === 'studio'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>AI写作工作台</h1>
              <p>生成文章草稿、补齐摘要标签，并保存到文章管理进入审批流程。</p>
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
                  <el-input v-model="generationForm.prompt" size="large" placeholder="输入一个技术选题" />
                </el-form-item>
                <el-form-item label="写作风格">
                  <el-segmented v-model="generationForm.style" :options="['工程实践', '产品分析', '教程指南']" />
                </el-form-item>
                <el-form-item label="篇幅">
                  <el-radio-group v-model="generationForm.length">
                    <el-radio-button value="短篇">短篇</el-radio-button>
                    <el-radio-button value="中篇">中篇</el-radio-button>
                    <el-radio-button value="长篇">长篇</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="标签">
                  <el-select v-model="generationForm.tags" multiple filterable allow-create default-first-option>
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
                  生成文章
                </el-button>
                <el-button size="large" :icon="DocumentAdd" @click="handleSaveGeneratedDraft">保存为待审文章</el-button>
              </div>
            </section>

            <section class="panel preview-panel">
              <div class="section-heading">
                <span>生成预览</span>
                <strong><el-icon><Collection /></el-icon></strong>
              </div>

              <el-skeleton v-if="loading" :rows="9" animated />

              <div v-else-if="generated" class="generated-doc">
                <h2>{{ generated.title }}</h2>
                <p class="article-summary">{{ generated.summary }}</p>
                <div class="article-tags">
                  <el-tag v-for="tag in generated.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
                </div>
                <pre>{{ generated.content }}</pre>
              </div>

              <el-empty v-else description="输入主题后生成文章，并在这里预览" />
            </section>
          </div>
        </section>

        <section v-if="activeSection === 'articles'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>文章管理</h1>
              <p>管理草稿、审批状态和上下架状态，维护访客端可见内容。</p>
            </div>
          </div>

          <section class="tool-band compact">
            <el-segmented v-model="activeFilter" :options="filterOptions" />
            <span>{{ visibleDrafts.length }} / {{ drafts.length }} 篇文章</span>
          </section>

          <section class="admin-table-card">
            <article v-for="draft in visibleDrafts" :key="draft.id" class="article-row">
              <div>
                <h3>{{ draft.title }}</h3>
                <p>{{ draft.summary }}</p>
                <div class="draft-tags">
                  <el-tag v-for="tag in draft.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                </div>
              </div>
              <div class="article-row-meta">
                <el-tag :type="draft.status === 'ready' ? 'success' : draft.status === 'review' ? 'warning' : 'info'">
                  {{ statusLabel(draft.status) }}
                </el-tag>
                <el-tag :type="listingType(draft.listingStatus)" effect="plain">
                  {{ listingStatusLabel(draft.listingStatus) }}
                </el-tag>
                <span>更新于 {{ draft.updatedAt }}</span>
              </div>
              <div class="draft-action-bar">
                <el-button :icon="Document" @click="openPreview(draft)">预览</el-button>
                <el-button :icon="EditPen" @click="openEdit(draft)">编辑</el-button>
                <el-button v-if="draft.status === 'idea'" :icon="Promotion" @click="handleSubmitReview(draft)">
                  提交审批
                </el-button>
                <el-button
                  :type="draft.listingStatus === 'listed' ? 'warning' : 'primary'"
                  :icon="SwitchButton"
                  @click="handleToggleListing(draft)"
                >
                  {{ draft.listingStatus === 'listed' ? '下架' : '上架' }}
                </el-button>
              </div>
            </article>
          </section>
        </section>

        <section v-if="activeSection === 'approvals'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>审批管理</h1>
              <p>集中处理待审批文章，快速通过或退回修改。</p>
            </div>
            <span class="page-badge">{{ reviewDrafts.length }} 条待处理</span>
          </div>

          <section class="approval-list">
            <el-empty v-if="reviewDrafts.length === 0" description="暂无待审批内容" />
            <article v-for="draft in reviewDrafts" v-else :key="draft.id" class="approval-item">
              <div>
                <h3>{{ draft.title }}</h3>
                <p>{{ draft.summary }}</p>
              </div>
              <div class="draft-action-bar">
                <el-button :icon="Document" @click="openPreview(draft)">预览</el-button>
                <el-button type="success" :icon="Check" @click="handleApprove(draft)">通过</el-button>
                <el-button :icon="RefreshLeft" @click="handleReject(draft)">退回</el-button>
              </div>
            </article>
          </section>
        </section>

        <section v-if="activeSection === 'users'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>用户管理</h1>
              <p>管理后台账号、角色归属和最近活跃状态。</p>
            </div>
            <el-button type="primary" :icon="User">新增用户</el-button>
          </div>

          <section class="admin-table-card">
            <article v-for="user in userRows" :key="user.name" class="user-row">
              <span class="admin-avatar">
                <el-icon><UserFilled /></el-icon>
              </span>
              <div>
                <h3>{{ user.name }}</h3>
                <p>{{ user.scope }}</p>
              </div>
              <el-tag>{{ user.role }}</el-tag>
              <el-tag :type="user.status === '在线' ? 'success' : 'info'" effect="plain">{{ user.status }}</el-tag>
              <span>{{ user.lastSeen }}</span>
            </article>
          </section>
        </section>

        <section v-if="activeSection === 'roles'" class="admin-page-section">
          <div class="admin-page-head">
            <div>
              <h1>角色管理</h1>
              <p>维护不同角色可使用的功能模块和操作边界。</p>
            </div>
            <el-button type="primary" :icon="Key">新增角色</el-button>
          </div>

          <section class="role-grid">
            <article v-for="role in roleRows" :key="role.name" class="role-card">
              <div class="section-heading">
                <span>{{ role.name }}</span>
                <strong>{{ role.users }} 人</strong>
              </div>
              <div class="role-permissions">
                <el-tag v-for="permission in role.permissions" :key="permission" effect="plain">{{ permission }}</el-tag>
              </div>
            </article>
          </section>
        </section>
      </main>
    </div>
    </div>

    <el-dialog v-model="profileDialogVisible" title="个人信息" width="min(520px, 92vw)">
      <div class="profile-card">
        <span class="admin-avatar large">
          <el-icon><UserFilled /></el-icon>
        </span>
        <div>
          <h3>{{ username }}</h3>
          <p>系统管理员</p>
          <p>拥有内容管理、审批、发布和权限管理能力。</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.current" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.next" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirm" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordChange">保存密码</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑文章" width="min(720px, 92vw)">
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
        <pre>{{ previewDraft.content }}</pre>
      </article>
    </el-dialog>
  </section>
</template>
