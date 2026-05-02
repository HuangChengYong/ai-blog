<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Collection,
  DataAnalysis,
  Delete as DeleteIcon,
  Document,
  DocumentAdd,
  EditPen,
  FolderChecked,
  Key,
  Lock,
  MagicStick,
  Menu as MenuIcon,
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
  deleteDraft,
  generateArticle,
  getApprovalDrafts,
  getDrafts,
  listingStatusLabel,
  loadApprovalDrafts,
  loadDrafts,
  rejectDraft,
  sendDraftToReview,
  setDraftListingStatus,
  statusLabel,
  updateDraft,
} from '../services/blog'
import {
  loadAdminMenus,
  loadAdminOverview,
  loadAdminPermissionGroups,
  loadAdminRoles,
  loadAdminStudioOptions,
  loadAdminUsers,
  type AdminMenu,
  type AdminOverview,
  type AdminPermissionGroup,
  type AdminRole,
  type AdminStudioOptions,
  type AdminUser,
} from '../services/admin'
import { changePassword, getAdminUsername, logout } from '../services/auth'
import MarkdownBody from '../components/MarkdownBody.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import type { Draft, DraftStatus, ListingStatus } from '../types/blog'

type AdminSection = 'overview' | 'studio' | 'articles' | 'approvals' | 'users' | 'roles' | 'permissions' | 'menus'
type DraftFilter = DraftStatus | ListingStatus | 'all'

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
const reviewDrafts = getApprovalDrafts()
const username = getAdminUsername()
const overview = ref<AdminOverview>({
  stats: [],
  publishHealth: 0,
  healthText: '',
})
const studioOptions = ref<AdminStudioOptions>({
  styles: ['工程实践', '产品分析', '教程指南'],
  lengths: ['短篇', '中篇', '长篇'],
  tags: ['Agent', 'RAG', 'AI 写作', 'Vue', '评测'],
})
const users = ref<AdminUser[]>([])
const roles = ref<AdminRole[]>([])
const permissionGroups = ref<AdminPermissionGroup[]>([])
const menuRows = ref<AdminMenu[]>([])

const generationForm = reactive({
  prompt: '如何让 Agent 工作流可审计',
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

const navItems = [
  { key: 'overview' as const, label: '总览', icon: DataAnalysis },
  { key: 'studio' as const, label: 'AI 写作', icon: MagicStick },
  { key: 'articles' as const, label: '文章管理', icon: Document },
  { key: 'approvals' as const, label: '内容审核', icon: FolderChecked },
  { key: 'users' as const, label: '用户管理', icon: User },
  { key: 'roles' as const, label: '角色管理', icon: Setting },
  { key: 'permissions' as const, label: '权限配置', icon: Key },
  { key: 'menus' as const, label: '菜单管理', icon: MenuIcon },
]

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
  if (activeFilter.value === 'all') {
    return drafts
  }
  if (activeFilter.value === 'listed' || activeFilter.value === 'unlisted') {
    return drafts.filter((draft) => draft.listingStatus === activeFilter.value)
  }
  return drafts.filter((draft) => draft.status === activeFilter.value)
})

const dashboardStats = computed(() => overview.value.stats)

onMounted(async () => {
  await loadSectionData(activeSection.value)
})

async function loadSectionData(section: AdminSection) {
  try {
    if (section === 'overview') {
      overview.value = await loadAdminOverview()
    }
    if (section === 'studio') {
      studioOptions.value = await loadAdminStudioOptions()
    }
    if (section === 'articles') {
      await loadDrafts()
    }
    if (section === 'approvals') {
      await loadApprovalDrafts()
    }
    if (section === 'users') {
      users.value = await loadAdminUsers()
    }
    if (section === 'roles') {
      roles.value = await loadAdminRoles()
    }
    if (section === 'permissions') {
      permissionGroups.value = await loadAdminPermissionGroups()
    }
    if (section === 'menus') {
      menuRows.value = await loadAdminMenus()
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '数据加载失败')
  }
}

async function setActiveSection(section: AdminSection) {
  activeSection.value = section
  await loadSectionData(section)
}

function listingType(status: ListingStatus) {
  return status === 'listed' ? 'success' : 'info'
}

async function handleGenerate() {
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

async function handleSaveGeneratedDraft() {
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
    await setActiveSection('articles')
    ElMessage.success('已保存到文章管理')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  }
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

async function handleSaveEdit() {
  if (!editForm.title.trim()) {
    ElMessage.warning('标题不能为空')
    return
  }
  try {
    await updateDraft(currentDraftId.value, {
      title: editForm.title.trim(),
      summary: editForm.summary.trim(),
      content: editForm.content.trim(),
      tags: editForm.tags,
    })
    editDialogVisible.value = false
    ElMessage.success('文章已更新')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '更新失败')
  }
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

async function handlePasswordChange() {
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
  try {
    await changePassword(passwordForm.current, passwordForm.next)
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
    passwordDialogVisible.value = false
    ElMessage.success('密码已更新')
  } catch {
    ElMessage.error('当前密码不正确')
  }
}

function handleUserCommand(command: string) {
  if (command === 'profile') {
    profileDialogVisible.value = true
  }
  if (command === 'password') {
    passwordDialogVisible.value = true
  }
  if (command === 'logout') {
    logout()
    router.replace('/admin/login')
  }
}
</script>

<template>
  <section class="admin-page">
    <header class="admin-toolbar">
      <div class="admin-toolbar-brand">
        <span class="brand-mark">AI</span>
        <div>
          <strong>NeuroBlog</strong>
          <small>管理后台</small>
        </div>
      </div>
      <div class="admin-toolbar-title">
        <strong>管理后台</strong>
        <span>内容生产、审核发布、用户权限一体化管理。</span>
      </div>
      <el-dropdown trigger="click" @command="handleUserCommand">
        <button class="admin-user-menu" type="button">
          <span>{{ username }}</span>
          <span class="admin-avatar"><el-icon><UserFilled /></el-icon></span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" :icon="User">个人资料</el-dropdown-item>
            <el-dropdown-item command="password" :icon="Lock">修改密码</el-dropdown-item>
            <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="admin-body">
      <aside class="admin-sidebar">
        <nav class="admin-nav" aria-label="Admin navigation">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            :class="{ active: activeSection === item.key }"
            @click="setActiveSection(item.key)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <div class="admin-main">
        <main class="admin-content">
          <section v-if="activeSection === 'overview'" class="admin-page-section">
            <div class="admin-page-head">
              <div>
                <h1>总览</h1>
                <p>快速查看内容生产、审核压力和发布状态。</p>
              </div>
              <el-button type="primary" :icon="MagicStick" @click="setActiveSection('studio')">开始写作</el-button>
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
                  <div>
                    <span>1</span>
                    <h3>生成</h3>
                    <p>通过后端接口生成标题、摘要、正文和标签。</p>
                  </div>
                  <div>
                    <span>2</span>
                    <h3>编辑</h3>
                    <p>完善文章内容，并提交进入审核流程。</p>
                  </div>
                  <div>
                    <span>3</span>
                    <h3>发布</h3>
                    <p>审核通过后上架文章，面向访客展示。</p>
                  </div>
                </div>
              </div>
              <div class="panel overview-feature">
                <div class="section-heading">
                  <span>发布健康度</span>
                  <strong>{{ overview.publishHealth }}%</strong>
                </div>
                <div class="health-meter"><i :style="{ width: `${overview.publishHealth}%` }"></i></div>
                <p>{{ overview.healthText }}</p>
              </div>
            </section>
          </section>

          <section v-if="activeSection === 'studio'" class="admin-page-section">
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
                  <el-button type="primary" size="large" :loading="loading" :icon="MagicStick" @click="handleGenerate">生成文章</el-button>
                  <el-button size="large" :icon="DocumentAdd" @click="handleSaveGeneratedDraft">保存草稿</el-button>
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

          <section v-if="activeSection === 'articles'" class="admin-page-section">
            <div class="admin-page-head">
              <div>
                <h1>文章管理</h1>
                <p>管理草稿、审核状态和上下架状态。</p>
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
                  <el-tag :type="draft.status === 'ready' || draft.status === 'published' ? 'success' : draft.status === 'review' ? 'warning' : 'info'">
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
                  <el-button v-if="draft.status === 'idea'" :icon="Promotion" @click="handleSubmitReview(draft)">提交</el-button>
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
              </article>
            </section>
          </section>

          <section v-if="activeSection === 'approvals'" class="admin-page-section">
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
                  <el-button type="success" :icon="Check" @click="handleApprove(draft)">通过</el-button>
                  <el-button :icon="RefreshLeft" @click="handleReject(draft)">驳回</el-button>
                </div>
              </article>
            </section>
          </section>

          <section v-if="activeSection === 'users'" class="admin-page-section">
            <div class="admin-page-head">
              <div>
                <h1>用户管理</h1>
                <p>管理后台账号、角色和活跃状态。</p>
              </div>
              <el-button type="primary" :icon="User">新建用户</el-button>
            </div>
            <section class="admin-table-card">
              <article v-for="user in users" :key="user.name" class="user-row">
                <span class="admin-avatar"><el-icon><UserFilled /></el-icon></span>
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
                <p>维护角色模板与功能边界。</p>
              </div>
              <el-button type="primary" :icon="Key">新建角色</el-button>
            </div>
            <section class="role-grid">
              <article v-for="role in roles" :key="role.name" class="role-card">
                <div class="section-heading">
                  <span>{{ role.name }}</span>
                  <strong>{{ role.users }} 人</strong>
                </div>
                <p class="role-description">{{ role.description }}</p>
                <div class="role-permissions">
                  <el-tag v-for="permission in role.permissions" :key="permission" effect="plain">{{ permission }}</el-tag>
                </div>
              </article>
            </section>
          </section>

          <section v-if="activeSection === 'permissions'" class="admin-page-section">
            <div class="admin-page-head">
              <div>
                <h1>权限配置</h1>
                <p>按角色分配后端功能权限点。</p>
              </div>
            </div>
            <section class="permission-editor">
              <section v-for="group in permissionGroups" :key="group.title" class="permission-group">
                <h3>{{ group.title }}</h3>
                <el-checkbox v-for="item in group.items" :key="item.code" :value="item.code" class="permission-item">
                  <span class="permission-copy">
                    <strong>{{ item.name }}</strong>
                    <small>{{ item.description }}</small>
                  </span>
                </el-checkbox>
              </section>
            </section>
          </section>

          <section v-if="activeSection === 'menus'" class="admin-page-section">
            <div class="admin-page-head">
              <div>
                <h1>菜单管理</h1>
                <p>维护后台菜单名称、路由、权限标识和显示状态。</p>
              </div>
              <el-button type="primary" :icon="MenuIcon">新建菜单</el-button>
            </div>
            <section class="menu-manager">
              <article v-for="menu in menuRows" :key="menu.path" class="menu-row">
                <div class="menu-order">
                  <span>排序</span>
                  <el-input-number v-model="menu.order" :min="1" :step="10" controls-position="right" />
                </div>
                <div class="menu-field">
                  <span>名称</span>
                  <el-input v-model="menu.title" />
                </div>
                <div class="menu-field">
                  <span>路由</span>
                  <el-input v-model="menu.path" />
                </div>
                <div class="menu-field">
                  <span>权限标识</span>
                  <el-input v-model="menu.permission" />
                </div>
                <div class="menu-switches">
                  <el-switch v-model="menu.visible" active-text="显示" inactive-text="隐藏" />
                  <el-switch v-model="menu.status" active-text="启用" inactive-text="停用" active-value="enabled" inactive-value="disabled" />
                </div>
                <el-tag effect="plain">系统</el-tag>
              </article>
            </section>
          </section>
        </main>
      </div>
    </div>

    <el-dialog v-model="profileDialogVisible" title="个人资料" width="min(520px, 92vw)">
      <div class="profile-card">
        <span class="admin-avatar large"><el-icon><UserFilled /></el-icon></span>
        <div>
          <h3>{{ username }}</h3>
          <p>系统管理员</p>
          <p>负责内容管理、审核发布和访问控制。</p>
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
