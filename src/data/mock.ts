import type { Author, Draft, Post, Topic } from '../types/blog'

export const authors: Author[] = [
  {
    id: 'a-01',
    name: '林澈',
    role: 'AI 平台工程师',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=lin',
    bio: '关注 RAG、Agent 编排和工程化交付。',
    aiPreference: '喜欢用结构化提示词拆解复杂系统。',
  },
  {
    id: 'a-02',
    name: '许知行',
    role: '技术产品负责人',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=xu',
    bio: '把模型能力包装成清晰的用户工作流。',
    aiPreference: '偏好先定义评测标准，再打磨体验。',
  },
  {
    id: 'a-03',
    name: '沈墨',
    role: '前端架构师',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=shen',
    bio: '长期写 Vue、设计系统和数据可视化。',
    aiPreference: '让 AI 承担重复劳动，人来决定产品判断。',
  },
]

export const posts: Post[] = [
  {
    id: 'post-rag-observability',
    title: '给 RAG 系统加一层可观测性',
    summary: '从召回、重排、生成三个阶段拆分指标，让团队能定位回答质量波动。',
    content: [
      'RAG 最容易被误判成一个单点功能，但它实际是一条多阶段链路。任何一个阶段漂移，最终答案都会显得不稳定。',
      '首要动作是把召回命中率、重排得分、引用覆盖率和生成阶段的拒答率拆开看。只有链路被拆清楚，优化才不会变成盲目调参。',
      '在前端产品里，推荐把关键引用、候选片段和模型置信提示放在同一个调试视图中。这样内容团队也能参与反馈，而不是只把问题丢给工程侧。',
    ],
    authorId: 'a-01',
    category: 'AI 工程',
    tags: ['RAG', '可观测性', '评测'],
    cover: 'linear-gradient(135deg, #0f172a, #14b8a6 52%, #f59e0b)',
    readMinutes: 8,
    heat: 94,
    publishedAt: '2026-04-20',
  },
  {
    id: 'post-agent-workflow',
    title: 'Agent 工作流别急着全自动',
    summary: '让 Agent 先成为可审计的协作者，再逐步接管稳定步骤。',
    content: [
      '很多 Agent 产品失败不是因为模型不够强，而是因为边界被设计得太模糊。',
      '第一版应该把任务拆成计划、执行、校验和提交四个阶段，每个阶段都留下用户能理解的状态。',
      '当某个步骤连续稳定通过评测，才适合把它从人工确认改成自动执行。这样用户的信任会自然增长。',
    ],
    authorId: 'a-02',
    category: '模型应用',
    tags: ['Agent', '工作流', '产品'],
    cover: 'linear-gradient(135deg, #111827, #6366f1 48%, #22c55e)',
    readMinutes: 6,
    heat: 88,
    publishedAt: '2026-04-18',
  },
  {
    id: 'post-ai-editor-ux',
    title: 'AI 编辑器里的好按钮应该很少',
    summary: '写作工具不是功能货架，真正重要的是让作者知道下一步该做什么。',
    content: [
      'AI 写作界面如果堆满按钮，用户会把每一次操作都当成一次试错。',
      '更好的体验是围绕写作阶段提供少量明确动作：生成大纲、扩写段落、改写语气、压缩摘要。',
      '按钮少不代表能力少，而是把能力藏进上下文。系统应该理解作者现在是在找方向、补材料，还是准备发布。',
    ],
    authorId: 'a-03',
    category: '产品设计',
    tags: ['AI 写作', 'UX', '编辑器'],
    cover: 'linear-gradient(135deg, #172554, #06b6d4 44%, #f97316)',
    readMinutes: 5,
    heat: 76,
    publishedAt: '2026-04-15',
  },
  {
    id: 'post-vue-dashboard',
    title: '用 Vue 做内容平台的交互骨架',
    summary: '路由、Mock 服务和状态更新先跑顺，后端接口替换会轻很多。',
    content: [
      '内容平台前端的第一版重点不是把所有边界都抽象完，而是把读、写、管三个闭环跑起来。',
      'Mock 服务最好从一开始就模拟真实的读取和写入函数。这样页面层会自然依赖接口语义，而不是依赖临时数组。',
      '当后端准备好时，替换服务层实现即可。这个小小的边界会让项目保持轻盈。',
    ],
    authorId: 'a-03',
    category: '开发实践',
    tags: ['Vue', 'Mock', '前端架构'],
    cover: 'linear-gradient(135deg, #052e16, #10b981 48%, #eab308)',
    readMinutes: 7,
    heat: 82,
    publishedAt: '2026-04-12',
  },
]

export const topics: Topic[] = [
  {
    id: 'topic-ai-native',
    title: 'AI Native 产品拆解',
    description: '围绕真实工作流，而不是模型炫技来设计功能。',
    tags: ['产品', 'Agent', '体验'],
  },
  {
    id: 'topic-evaluation',
    title: '评测与质量闭环',
    description: '从主观好用走向可追踪、可复现、可迭代。',
    tags: ['评测', 'RAG', '指标'],
  },
  {
    id: 'topic-frontend',
    title: '前端工程化',
    description: '让 Mock、路由和组件结构提前对齐未来接口。',
    tags: ['Vue', '组件', '架构'],
  },
]

export const initialDrafts: Draft[] = [
  {
    id: 'draft-01',
    title: '如何为团队建立 Prompt 资产库',
    summary: '把高频提示词沉淀成可复用模板，并记录适用场景。',
    content: '计划从命名、版本、评测和权限四个角度展开。',
    status: 'review',
    listingStatus: 'unlisted',
    source: '手写',
    updatedAt: '2026-04-22 15:30',
    tags: ['Prompt', '团队协作'],
  },
  {
    id: 'draft-02',
    title: '从失败样例开始优化 AI 搜索',
    summary: '把用户反馈转成召回和生成阶段的可执行任务。',
    content: '先收集低分回答，再标注失败原因，最后更新评测集。',
    status: 'idea',
    listingStatus: 'unlisted',
    source: 'AI 生成',
    updatedAt: '2026-04-21 10:12',
    tags: ['搜索', '评测'],
  },
]
