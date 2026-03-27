# Implementation Plan: Sales CRM

## Overview

按以下顺序实现：数据库迁移 → 后端 API（路由 + 服务层）→ 前端页面和组件 → 测试 → 集成（导航菜单、路由注册）。
技术栈：Node.js + Express + PostgreSQL（后端），Vue 3 + Pinia（前端），fast-check（属性测试），Vitest（单元测试）。

---

## Tasks

- [x] 1. 数据库迁移
  - [x] 1.1 创建 `migrations/sales_crm.sql` 迁移文件
    - 创建 `sales_properties` 表（含 `deleted_at` 软删除字段）
    - 创建 `sales_property_photos` 表（含 `sort_order`、`is_cover` 字段）
    - 创建 `customers` 表（含 `assign_status`、`lead_source`、`salesperson_id`）
    - 创建 `viewing_records` 表
    - 创建 `purchase_intents` 表（含 UNIQUE(customer_id, property_id) 约束）
    - 创建 `follow_ups` 表
    - 创建 `ad_materials` 表（含 `photo_ids INTEGER[]`、`tags TEXT[]`、FB 预留字段）
    - 插入 `config` 键 `sales_followup_threshold_days = '7'`
    - 创建所有索引（按 `deleted_at IS NULL` 的部分索引）
    - _Requirements: 1.1, 2.1, 3.4, 4.1, 5.1, 9.1, 9.9_


- [x] 2. 后端基础设施
  - [x] 2.1 扩展上传路由权限，允许 Staff 上传和删除图片
    - 修改 `server/src/routes/upload.js`，将 `authorize('Admin')` 改为 `authorize('Admin', 'Staff')`
    - _Requirements: 1.8_

  - [x] 2.2 在 `server/src/middleware/rateLimiter.js` 中新增公开表单限流中间件
    - 按手机号限流：10 分钟内同一手机号最多提交 1 次
    - 超出时返回 429 及提示"提交过于频繁，请稍后再试"
    - _Requirements: 3.7_

- [x] 3. 后端路由与服务层 — 预售房源
  - [x] 3.1 创建 `server/src/routes/sales/properties.js`
    - `GET /api/sales/properties` — 列表，支持 `status`、`property_type` 筛选，过滤 `deleted_at IS NULL`
    - `POST /api/sales/properties` — 创建，验证必填项（name、unit_type、area_sqm、price），`property_type='external'` 时验证 owner_name/owner_contact
    - `GET /api/sales/properties/:id` — 详情（含照片列表按 sort_order 升序）
    - `PUT /api/sales/properties/:id` — 编辑，更新 `updated_at`
    - `DELETE /api/sales/properties/:id` — 软删除，仅 Admin
    - `POST /api/sales/properties/:id/photos` — 上传照片，复用 multer，限 JPG/PNG/5MB
    - `PUT /api/sales/properties/:id/photos/order` — 批量更新 `sort_order`
    - `PUT /api/sales/properties/:id/photos/:photoId/cover` — 设置封面图（清除其他 is_cover，设置新封面）
    - `DELETE /api/sales/properties/:id/photos/:photoId` — 删除照片，若为封面则自动升级 sort_order 最小的照片
    - _Requirements: 1.1–1.14, 8.4, 8.5_

  - [ ]* 3.2 为房源 API 编写属性测试（fast-check）
    - **Property 1: 必填项验证拒绝不完整输入** — 验证 Requirements 1.2
    - **Property 2: 创建后可查询（Round-trip）** — 验证 Requirements 1.3
    - **Property 3: 编辑后 updated_at 单调递增** — 验证 Requirements 1.4
    - **Property 4: 软删除后不出现在列表** — 验证 Requirements 1.5
    - **Property 5: 过滤查询结果一致性** — 验证 Requirements 1.6, 1.7
    - **Property 7: 照片上传格式和大小约束** — 验证 Requirements 1.8
    - **Property 8: 封面图唯一性不变量** — 验证 Requirements 1.11, 1.12
    - **Property 9: 照片排序持久化（Round-trip）** — 验证 Requirements 1.10
    - **Property 10: 外来房源必须包含房主信息** — 验证 Requirements 1.13
    - **Property 11: 签约自动触发房源状态变更** — 验证 Requirements 1.14


- [x] 4. 后端路由与服务层 — 客户档案
  - [x] 4.1 创建 `server/src/routes/sales/customers.js`
    - `GET /api/sales/customers` — 列表，支持 `salesperson_id`、`lead_source` 筛选，`q` 关键词搜索（姓名/手机号 ILIKE），Staff 自动过滤 `salesperson_id = req.user.id`
    - `POST /api/sales/customers` — 创建，验证 name/phone 必填
    - `GET /api/sales/customers/:id` — 详情，Staff 越权返回 403
    - `PUT /api/sales/customers/:id` — 编辑，更新 `updated_at`，Staff 越权返回 403
    - `DELETE /api/sales/customers/:id` — 软删除，仅 Admin
    - `GET /api/sales/customers/pending` — 待分配列表（assign_status = 'pending'），仅 Admin
    - `PUT /api/sales/customers/:id/assign` — 分配销售员，更新 `salesperson_id` 和 `assign_status = 'normal'`，仅 Admin
    - _Requirements: 2.1–2.9, 8.2_

  - [ ]* 4.2 为客户 API 编写属性测试（fast-check）
    - **Property 1: 必填项验证拒绝不完整输入** — 验证 Requirements 2.2
    - **Property 2: 创建后可查询（Round-trip）** — 验证 Requirements 2.3
    - **Property 3: 编辑后 updated_at 单调递增** — 验证 Requirements 2.7
    - **Property 5: 过滤查询结果一致性** — 验证 Requirements 2.4, 2.5
    - **Property 6: Staff 数据隔离** — 验证 Requirements 2.8
    - **Property 12: 客户搜索结果包含关键词** — 验证 Requirements 2.6

- [x] 5. 后端路由与服务层 — 公开表单
  - [x] 5.1 创建 `server/src/routes/public/inquiry.js`
    - `POST /api/public/inquiry` — 无需认证，验证 name/phone 必填，创建 `lead_source='web_form'`、`assign_status='pending'` 的客户记录
    - 应用手机号限流中间件（Task 2.2）
    - _Requirements: 3.1–3.7_

  - [ ]* 5.2 为公开表单 API 编写属性测试（fast-check）
    - **Property 1: 必填项验证拒绝不完整输入** — 验证 Requirements 3.3
    - **Property 13: 公开表单提交创建待分配客户（Round-trip）** — 验证 Requirements 3.4
    - **Property 14: 公开表单同一手机号限流** — 验证 Requirements 3.7


- [x] 6. 后端路由与服务层 — 看房记录
  - [x] 6.1 创建 `server/src/routes/sales/viewingRecords.js`
    - `GET /api/sales/viewing-records` — 列表，支持 `property_id`、`customer_id` 筛选，按 `viewed_at DESC`，Staff 过滤 `salesperson_id`
    - `POST /api/sales/viewing-records` — 创建，验证 customer_id/property_id/viewed_at/salesperson_id 必填
    - `PUT /api/sales/viewing-records/:id` — 编辑，更新 `updated_at`
    - `DELETE /api/sales/viewing-records/:id` — 软删除
    - _Requirements: 4.1–4.6_

  - [ ]* 6.2 为看房记录 API 编写属性测试（fast-check）
    - **Property 1: 必填项验证拒绝不完整输入** — 验证 Requirements 4.2
    - **Property 3: 编辑后 updated_at 单调递增** — 验证 Requirements 4.5
    - **Property 4: 软删除后不出现在列表** — 验证 Requirements 4.6
    - **Property 15: 看房记录按时间倒序** — 验证 Requirements 4.3, 4.4

- [x] 7. 后端路由与服务层 — 购买意向与跟进
  - [x] 7.1 创建 `server/src/routes/sales/intents.js`
    - `GET /api/sales/intents` — 列表，支持 `property_id`、`customer_id`、`intent_level`、`salesperson_id` 筛选，按热度降序（signed>hot>warm>cold），Staff 过滤
    - `POST /api/sales/intents` — 创建意向，验证 customer_id/property_id/salesperson_id 必填，UNIQUE 冲突返回 409
    - `PUT /api/sales/intents/:id` — 更新意向热度，更新 `updated_at`；若 `intent_level='signed'` 则在事务中同步更新 `sales_properties.status='sold'`，Staff 越权返回 403
    - `DELETE /api/sales/intents/:id` — 软删除，仅 Admin
    - `GET /api/sales/intents/:id/follow-ups` — 跟进记录列表，按 `followed_at DESC`
    - `POST /api/sales/intents/:id/follow-ups` — 添加跟进记录，验证 content 必填
    - _Requirements: 5.1–5.9, 8.3_

  - [ ]* 7.2 为意向 API 编写属性测试（fast-check）
    - **Property 2: 创建后可查询（Round-trip）** — 验证 Requirements 5.1
    - **Property 3: 编辑后 updated_at 单调递增** — 验证 Requirements 5.2
    - **Property 4: 软删除后不出现在列表** — 验证 Requirements 5.1
    - **Property 5: 过滤查询结果一致性** — 验证 Requirements 5.6, 5.7
    - **Property 6: Staff 数据隔离** — 验证 Requirements 5.8
    - **Property 11: 签约自动触发房源状态变更** — 验证 Requirements 1.14
    - **Property 16: 意向列表按热度降序** — 验证 Requirements 5.4, 5.5
    - **Property 17: 跟进记录 Round-trip** — 验证 Requirements 5.3


- [x] 8. 后端路由与服务层 — 业绩统计、跟进提醒、广告素材
  - [x] 8.1 创建 `server/src/routes/sales/reports.js`
    - `GET /api/sales/reports` — 按 `start_date`/`end_date` 统计每位销售员的带看数、意向数（非冷）、签约数；Staff 仅返回自己数据
    - _Requirements: 6.1–6.5_

  - [x] 8.2 创建 `server/src/routes/sales/reminders.js`
    - `GET /api/sales/reminders` — 查询 intent_level 为 warm/hot 且最后跟进时间超过阈值（或无跟进记录）的意向，返回客户姓名、最后跟进时间、距今天数、热度；Staff 过滤；按距今天数降序
    - 从 `config` 表读取 `sales_followup_threshold_days`，默认 7
    - _Requirements: 7.1–7.7_

  - [x] 8.3 创建 `server/src/routes/sales/adMaterials.js`
    - `GET /api/sales/ad-materials` — 列表，支持 `property_id`、`ad_status` 筛选，过滤软删除
    - `POST /api/sales/ad-materials` — 创建，验证 title/description/property_id 必填，强制 `ad_status='draft'`
    - `GET /api/sales/ad-materials/:id` — 详情（含关联照片 URL）
    - `PUT /api/sales/ad-materials/:id` — 编辑，更新 `updated_at`
    - `PUT /api/sales/ad-materials/:id/status` — 切换状态（draft/published/paused），记录 `status_changed_at`，非法值返回 400
    - `DELETE /api/sales/ad-materials/:id` — 软删除
    - `GET /api/sales/ad-materials/:id/download` — 生成 ZIP（使用 `archiver`），包含 `photo_ids` 对应的照片文件，ZIP 名含房源名称和广告标题；无照片时返回 400
    - _Requirements: 9.1–9.11_

  - [ ]* 8.4 为业绩统计 API 编写属性测试（fast-check）
    - **Property 6: Staff 数据隔离** — 验证 Requirements 6.4
    - **Property 18: 业绩统计指标计算正确性** — 验证 Requirements 6.1, 6.2

  - [ ]* 8.5 为跟进提醒 API 编写属性测试（fast-check）
    - **Property 6: Staff 数据隔离** — 验证 Requirements 7.4
    - **Property 19: 超阈值意向出现在待跟进列表** — 验证 Requirements 7.2, 7.3
    - **Property 20: 阈值配置全局生效** — 验证 Requirements 7.7

  - [ ]* 8.6 为广告素材 API 编写属性测试（fast-check）
    - **Property 1: 必填项验证拒绝不完整输入** — 验证 Requirements 9.2
    - **Property 4: 软删除后不出现在列表** — 验证 Requirements 9.11
    - **Property 21: 广告素材初始状态为草稿** — 验证 Requirements 9.3
    - **Property 22: 广告状态合法转换** — 验证 Requirements 9.4
    - **Property 23: ZIP 下载包含所有选用照片** — 验证 Requirements 9.7

- [x] 9. 后端路由注册
  - [x] 9.1 在 `server/src/app.js` 中注册所有 Sales CRM 路由
    - 导入并挂载 `/api/sales/properties`、`/api/sales/customers`、`/api/sales/viewing-records`、`/api/sales/intents`、`/api/sales/reports`、`/api/sales/reminders`、`/api/sales/ad-materials`
    - 导入并挂载 `/api/public/inquiry`（无需认证中间件）
    - _Requirements: 1.1–9.11_

- [ ] 10. 检查点 — 确保所有后端测试通过
  - 确保所有后端属性测试和单元测试通过，如有问题请向用户说明。


- [x] 11. 前端 Pinia Stores
  - [x] 11.1 创建 `client/src/stores/salesProperty.js`（`useSalesPropertyStore`）
    - 状态：`properties`、`currentProperty`、`photos`
    - Actions：`fetchProperties(filters)`、`fetchProperty(id)`、`createProperty(data)`、`updateProperty(id, data)`、`deleteProperty(id)`
    - Actions：`uploadPhoto(propertyId, file)`、`updatePhotoOrder(propertyId, orderedIds)`、`setCoverPhoto(propertyId, photoId)`、`deletePhoto(propertyId, photoId)`
    - _Requirements: 1.1–1.14_

  - [x] 11.2 创建 `client/src/stores/customer.js`（`useCustomerStore`）
    - 状态：`customers`、`currentCustomer`、`pendingCustomers`
    - Actions：`fetchCustomers(filters)`、`fetchCustomer(id)`、`createCustomer(data)`、`updateCustomer(id, data)`、`fetchPending()`、`assignCustomer(id, salespersonId)`
    - _Requirements: 2.1–2.9, 3.4, 3.5_

  - [x] 11.3 创建 `client/src/stores/purchaseIntent.js`（`usePurchaseIntentStore`）
    - 状态：`intents`、`currentIntent`、`followUps`
    - Actions：`fetchIntents(filters)`、`createIntent(data)`、`updateIntentLevel(id, level)`、`fetchFollowUps(intentId)`、`addFollowUp(intentId, data)`
    - _Requirements: 5.1–5.9_

  - [x] 11.4 创建 `client/src/stores/salesReport.js`（`useSalesReportStore`）
    - 状态：`reportData`、`dateRange`
    - Actions：`fetchReport(startDate, endDate)`
    - _Requirements: 6.1–6.5_

  - [x] 11.5 创建 `client/src/stores/adMaterial.js`（`useAdMaterialStore`）
    - 状态：`materials`、`currentMaterial`
    - Actions：`fetchMaterials(filters)`、`fetchMaterial(id)`、`createMaterial(data)`、`updateMaterial(id, data)`、`updateStatus(id, status)`、`deleteMaterial(id)`、`downloadZip(id)`
    - _Requirements: 9.1–9.11_


- [x] 12. 前端 API 客户端模块
  - [x] 12.1 创建 `client/src/api/sales.js`
    - 封装所有 Sales CRM 后端接口调用（复用 `apiClient`）
    - 导出：`salesPropertiesApi`、`customersApi`、`viewingRecordsApi`、`intentsApi`、`reportsApi`、`remindersApi`、`adMaterialsApi`
    - _Requirements: 1.1–9.11_

  - [x] 12.2 创建 `client/src/api/publicInquiry.js`
    - 封装公开表单提交接口（使用独立 axios 实例，不带 JWT）
    - _Requirements: 3.1–3.7_

- [x] 13. 前端页面 — 预售房源
  - [x] 13.1 创建 `client/src/views/sales/SalesPropertyListView.vue`
    - 展示房源列表，支持按状态/类型筛选
    - 每行显示封面图缩略图、名称、户型、面积、售价、状态
    - Admin 显示删除按钮（二次确认），所有用户可新增/编辑
    - _Requirements: 1.1, 1.5, 1.6, 1.7, 8.4, 8.5_

  - [x] 13.2 创建 `client/src/views/sales/SalesPropertyFormView.vue`
    - 新增/编辑表单，包含所有字段
    - 必填项前端校验（name、unit_type、area_sqm、price）
    - `property_type='external'` 时显示并校验 owner_name/owner_contact
    - 照片上传区域：支持多张上传、拖拽排序（使用 HTML5 drag-and-drop 或 `vuedraggable`）、设置封面、删除（二次确认）
    - _Requirements: 1.1–1.14_

  - [x] 13.3 创建 `client/src/views/sales/SalesPropertyDetailView.vue`
    - 展示房源详情、照片轮播、外来房源房主信息
    - 嵌入该房源的看房记录列表（按 viewed_at 倒序）
    - 嵌入该房源的意向客户列表（按热度降序）
    - 嵌入该房源的广告素材列表
    - _Requirements: 1.11, 1.13, 4.3, 5.4, 9.10_

  - [ ]* 13.4 为 `SalesPropertyFormView` 编写单元测试（Vitest + Vue Test Utils）
    - 测试必填项校验逻辑
    - 测试 `property_type` 切换时 owner 字段的显示/隐藏
    - 测试照片上传交互和拖拽排序


- [x] 14. 前端页面 — 客户档案
  - [x] 14.1 创建 `client/src/views/sales/CustomerListView.vue`
    - 展示客户列表，支持按销售员/来源筛选、姓名/手机号搜索
    - Admin 可见所有客户；Staff 仅见自己的客户
    - Admin 可见"待分配"标签入口
    - _Requirements: 2.4–2.9_

  - [x] 14.2 创建 `client/src/views/sales/CustomerFormView.vue`
    - 新增/编辑客户表单，必填项校验（name、phone）
    - _Requirements: 2.1–2.3, 2.7_

  - [x] 14.3 创建 `client/src/views/sales/CustomerDetailView.vue`
    - 展示客户详情、看房记录列表（按 viewed_at 倒序）、意向列表（按热度降序）
    - _Requirements: 4.4, 5.5_

  - [x] 14.4 创建 `client/src/views/sales/PendingCustomerListView.vue`（Admin 专用）
    - 展示 `assign_status='pending'` 的客户列表
    - 提供分配销售员的下拉选择和确认操作
    - _Requirements: 3.5_

- [x] 15. 前端页面 — 公开表单
  - [x] 15.1 创建 `client/src/views/sales/PublicInquiryView.vue`
    - 无需登录可访问，路径 `/sales/inquiry`（在路由中标记 `meta: { public: true }`）
    - 表单字段：姓名（必填）、手机号（必填）、微信号（选填）、预算范围（选填）、感兴趣房源（多选，选填）、备注（选填）
    - 提交成功显示确认信息；失败保留已填内容并显示错误提示
    - 限流 429 时显示"提交过于频繁，请稍后再试"
    - _Requirements: 3.1–3.7_

  - [ ]* 15.2 为 `PublicInquiryView` 编写单元测试（Vitest + Vue Test Utils）
    - 测试必填项校验
    - 测试提交成功/失败/限流三种状态的 UI 反馈


- [x] 16. 前端页面 — 看房记录、意向、跟进
  - [x] 16.1 创建 `client/src/views/sales/ViewingRecordFormView.vue`
    - 新增/编辑看房记录表单，必填项校验（customer_id、property_id、viewed_at、salesperson_id）
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [x] 16.2 创建 `client/src/views/sales/PurchaseIntentListView.vue`
    - 展示意向列表，支持按热度/销售员筛选
    - Staff 仅见自己的意向
    - _Requirements: 5.6–5.9_

  - [x] 16.3 创建 `client/src/views/sales/PurchaseIntentDetailView.vue`
    - 展示意向详情，支持更新热度（下拉选择）
    - 展示跟进记录列表（按 followed_at 倒序）
    - 提供添加跟进记录的表单（content 必填）
    - _Requirements: 5.2, 5.3_

  - [ ]* 16.4 为 `PurchaseIntentDetailView` 编写单元测试（Vitest + Vue Test Utils）
    - 测试热度更新交互
    - 测试跟进记录添加表单校验

- [x] 17. 前端页面 — 业绩统计与跟进提醒
  - [x] 17.1 创建 `client/src/views/sales/SalesReportView.vue`
    - 日期范围选择器（开始/结束日期）
    - 表格展示各销售员的带看数、意向数、签约数，支持按任意列排序
    - Staff 仅见自己数据
    - _Requirements: 6.1–6.5_

  - [x] 17.2 创建 `client/src/views/sales/FollowUpReminderView.vue`
    - 展示待跟进客户列表：客户姓名、最后跟进时间、距今天数、热度
    - Admin 额外显示负责销售员姓名
    - 按距今天数降序排列
    - _Requirements: 7.1–7.7_

- [x] 18. 前端页面 — 广告素材
  - [x] 18.1 创建 `client/src/views/sales/AdMaterialListView.vue`
    - 展示某房源下的广告素材列表，支持按 `ad_status` 筛选
    - 显示状态切换按钮（draft→published、published→paused 等）
    - 软删除（二次确认）
    - _Requirements: 9.4, 9.10, 9.11_

  - [x] 18.2 创建 `client/src/views/sales/AdMaterialFormView.vue`
    - 新增/编辑广告素材表单：标题（必填）、描述文案（必填）、标签（多个，可添加/删除）、从房源照片中多选
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 18.3 创建 `client/src/views/sales/AdMaterialPreviewView.vue`
    - 以模拟 Facebook 帖子样式展示广告素材（标题、描述、标签、照片）
    - "复制文案"按钮：将标题+描述写入剪贴板，显示"已复制"反馈
    - "批量下载图片"按钮：触发 ZIP 下载（blob 方式），无照片时显示错误提示
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

  - [ ]* 18.4 为 `AdMaterialPreviewView` 编写单元测试（Vitest + Vue Test Utils）
    - 测试复制文案功能（mock Clipboard API）
    - 测试无照片时下载按钮的错误提示


- [ ] 19. 检查点 — 确保所有前端测试通过
  - 确保所有前端单元测试通过，如有问题请向用户说明。

- [x] 20. 集成 — 路由注册与导航菜单
  - [x] 20.1 在 `client/src/router/index.js` 中注册 Sales CRM 路由
    - 在 `requiresAuth: true` 的子路由组中添加所有 `/sales/*` 路由（懒加载）
    - 公开表单路由 `/sales/inquiry` 添加 `meta: { public: true }`，置于认证路由组外
    - _Requirements: 3.1, 8.1_

  - [x] 20.2 在导航侧边栏（`AppLayout.vue` 或 Sidebar 组件）中添加 Sales CRM 入口
    - 添加"销售 CRM"菜单项，展开后显示：房源、客户、意向、业绩统计、跟进提醒、广告素材
    - Admin 和 Staff 均可见
    - _Requirements: 8.4_

- [x] 21. 最终检查点 — 端到端验证
  - 确保所有测试通过（后端属性测试 + 前端单元测试）
  - 验证路由守卫：未登录访问 `/sales/*` 重定向至 `/login`；Staff 访问他人数据返回 403
  - 确保 ZIP 下载、照片上传、公开表单限流功能正常
  - 如有问题请向用户说明。

---

## Notes

- 标有 `*` 的子任务为可选测试任务，可跳过以加快 MVP 进度
- 每个任务均引用了具体需求条款，确保可追溯性
- 属性测试使用 `fast-check`（后端），单元测试使用 `Vitest + Vue Test Utils`（前端）
- 签约触发房源状态变更（Task 7.1）必须使用数据库事务，失败时回滚
- ZIP 下载使用 `archiver` 库（后端），前端通过 blob URL 触发下载，无需 JSZip
- 照片上传复用现有 `/api/upload/image` 路由，Task 2.1 需先扩展权限
