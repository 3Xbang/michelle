# 实施计划：泰国别墅物业管理系统（Villa PMS）

## 概述

基于 Vue 3 + Vite 前端、Node.js + Express 后端、PostgreSQL 数据库的全栈 Web 应用实施计划。采用增量构建方式：先搭建后端基础设施和数据库，再逐步实现各业务模块，最后构建前端页面并集成。每个任务构建在前一个任务之上，确保无孤立代码。

## Tasks

- [x] 1. 项目初始化与基础设施搭建
  - [x] 1.1 初始化后端项目结构
    - 创建 `server/` 目录，初始化 `package.json`，安装核心依赖：express、pg、jsonwebtoken、bcryptjs、cors、helmet、express-rate-limit、multer、winston、dotenv、express-validator
    - 创建 `server/src/app.js` Express 应用入口，配置 CORS、JSON 解析、helmet 安全头
    - 创建 `server/src/config/index.js` 环境变量配置（DB 连接、JWT 密钥、端口等）
    - 创建 `server/.env.example` 示例环境变量文件
    - _需求: 16.2, 16.5_

  - [x] 1.2 初始化前端项目结构
    - 使用 Vite 创建 Vue 3 项目到 `client/` 目录
    - 安装核心依赖：vue-router、pinia、axios、vue-i18n
    - 创建 `client/src/main.js` 应用入口，挂载 Pinia、Router、i18n
    - 创建 `client/vite.config.js` 配置开发代理 `/api` → `http://localhost:3000`
    - _需求: 12.1_

  - [x] 1.3 创建数据库迁移脚本与初始化
    - 创建 `server/src/migrations/` 目录下 7 个 SQL 迁移文件：001_create_users.sql 至 007_create_indexes.sql
    - 按设计文档 DDL 定义所有表结构（users、rooms、bookings、tickets、system_labels、config）
    - 创建 bookings 表的性能索引（idx_bookings_room_dates、idx_bookings_status、idx_bookings_platform、idx_bookings_created_at）
    - 创建 `server/src/models/db.js` PostgreSQL 连接池配置
    - 创建迁移执行脚本 `server/scripts/migrate.js`
    - _需求: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [x] 1.4 创建种子数据脚本
    - 创建 `server/scripts/seed.js`，插入默认管理员账户（admin@villapms.com，bcrypt 哈希密码）
    - 插入 17 个物业单元的初始房源数据
    - _需求: 1.7_

- [x] 2. 后端核心中间件与工具层
  - [x] 2.1 实现自定义错误类与统一错误处理
    - 创建 `server/src/utils/errors.js`，定义 AppError 类（errorCode、statusCode、message、details）
    - 创建 `server/src/middleware/errorHandler.js` 全局错误处理中间件
    - AppError 实例返回结构化错误响应；未知错误返回 500 + 通用消息，不暴露内部详情
    - _需求: 14.1, 14.4, 13.7_

  - [ ]* 2.2 编写属性测试：统一错误响应格式
    - **Property 21: 统一错误响应格式**
    - **验证: 需求 14.1, 14.4, 13.7**

  - [x] 2.3 实现结构化日志工具
    - 创建 `server/src/utils/logger.js`，使用 winston 实现结构化日志
    - 日志包含 timestamp、request_path、user_id、response_status_code
    - 创建请求日志中间件，记录每个 API 请求
    - _需求: 13.6_

  - [ ]* 2.4 编写属性测试：结构化日志完整性
    - **Property 22: 结构化日志完整性**
    - **验证: 需求 13.6**

  - [x] 2.5 实现净收入计算工具
    - 创建 `server/src/utils/income.js`，实现 calculateNetIncome 函数
    - 使用整数运算（乘100）避免浮点精度问题
    - _需求: 6.3, 18.8_

  - [ ]* 2.6 编写属性测试：净收入计算正确性
    - **Property 10: 净收入计算正确性**
    - **验证: 需求 6.3, 18.8**

  - [x] 2.7 实现数据验证中间件与验证器
    - 创建 `server/src/middleware/validate.js` 请求参数校验中间件（基于 express-validator）
    - 创建 `server/src/validators/bookingValidator.js`：验证退房日期 > 入住日期、收入/佣金非负、平台来源枚举、租期类型枚举
    - 创建 `server/src/validators/roomValidator.js`：验证房源名称非空、类型枚举、日基础房价 > 0
    - 创建 `server/src/validators/ticketValidator.js`：验证问题类型枚举、优先级枚举、描述非空
    - 创建 `server/src/validators/userValidator.js`：验证邮箱格式、角色枚举、姓名非空
    - 验证失败返回 400 + 字段级错误信息
    - _需求: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 13.4_

  - [ ]* 2.8 编写属性测试：输入数据验证
    - **Property 16: 输入数据验证**
    - **验证: 需求 18.1, 18.2, 18.4, 18.5, 4.5**

  - [ ]* 2.9 编写属性测试：平台来源枚举验证
    - **Property 15: 平台来源枚举验证**
    - **验证: 需求 6.9**


- [x] 3. 认证与权限模块
  - [x] 3.1 实现 JWT 认证中间件
    - 创建 `server/src/middleware/auth.js`，验证 Authorization: Bearer token
    - 解码 JWT 提取 user id、role、preferred_lang，挂载到 req.user
    - 无效/过期/缺失 token 返回 401
    - _需求: 1.3, 1.4, 13.1_

  - [x] 3.2 实现 RBAC 权限中间件
    - 创建 `server/src/middleware/rbac.js`，接受允许的角色数组参数
    - Staff 访问 Admin 专属端点返回 403
    - _需求: 3.4, 3.5_

  - [x] 3.3 实现登录速率限制中间件
    - 创建 `server/src/middleware/rateLimiter.js`，使用 express-rate-limit
    - 同一 IP 15 分钟内最多 10 次失败登录尝试，超限返回 429
    - _需求: 13.2, 13.3_

  - [x] 3.4 实现认证服务与路由
    - 创建 `server/src/services/authService.js`：login（bcrypt.compare 验证密码，签发 JWT 含 id/role/preferred_lang）
    - 创建 `server/src/routes/auth.js`：POST /api/auth/login（公开）、POST /api/auth/logout（已认证）
    - _需求: 1.1, 1.2, 1.5, 1.6_

  - [ ]* 3.5 编写属性测试：JWT 令牌包含正确声明
    - **Property 1: JWT 令牌包含正确声明**
    - **验证: 需求 1.1**

  - [ ]* 3.6 编写属性测试：无效凭据被拒绝
    - **Property 2: 无效凭据被拒绝**
    - **验证: 需求 1.2**

  - [ ]* 3.7 编写属性测试：无效/过期 JWT 被拒绝
    - **Property 3: 无效/过期 JWT 被拒绝**
    - **验证: 需求 1.3, 1.4, 13.1**

  - [ ]* 3.8 编写属性测试：密码 bcrypt 哈希存储
    - **Property 4: 密码 bcrypt 哈希存储**
    - **验证: 需求 1.6**

  - [ ]* 3.9 编写属性测试：RBAC 权限隔离
    - **Property 5: RBAC 权限隔离**
    - **验证: 需求 2.4, 3.5, 7.5, 8.8, 9.5**

  - [ ]* 3.10 编写属性测试：SQL 注入防护
    - **Property 25: SQL 注入防护**
    - **验证: 需求 13.4**

- [x] 4. 检查点 - 基础设施验证
  - 确保所有测试通过，如有问题请向用户确认。

- [x] 5. 用户管理模块
  - [x] 5.1 实现用户服务与路由
    - 创建 `server/src/services/userService.js`：CRUD 用户、获取当前用户、更新个人信息、修改密码
    - 创建 `server/src/routes/users.js`：GET/POST/PUT /api/users（Admin）、GET/PUT /api/users/me（已认证）、PUT /api/users/me/password（已认证）
    - 创建用户时 bcrypt 哈希密码，邮箱唯一性校验
    - _需求: 2.1, 2.2, 2.3, 2.4, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 5.2 编写属性测试：邮箱唯一性约束
    - **Property 8: 邮箱唯一性约束**
    - **验证: 需求 2.3**

  - [ ]* 5.3 编写属性测试：密码修改验证
    - **Property 23: 密码修改验证**
    - **验证: 需求 11.3, 11.4**

  - [ ]* 5.4 编写属性测试：语言偏好持久化
    - **Property 24: 语言偏好持久化**
    - **验证: 需求 10.3**

- [ ] 6. 房源管理模块
  - [x] 6.1 实现房源服务与路由
    - 创建 `server/src/services/roomService.js`：CRUD 房源，验证名称非空、日基础房价 > 0
    - 创建 `server/src/routes/rooms.js`：GET /api/rooms（已认证）、POST/PUT /api/rooms（Admin）、GET /api/rooms/:id（已认证）
    - 支持 room_group_id 和 auto_assign 预留字段
    - _需求: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 6.2 编写属性测试：实体创建/更新往返一致性（房源）
    - **Property 7: 实体往返一致性（房源部分）**
    - **验证: 需求 4.2**

- [ ] 7. 订单管理模块
  - [x] 7.1 实现订单服务与路由
    - 创建 `server/src/services/bookingService.js`：
      - 创建订单：自动计算 net_income、日期冲突检测、平台来源枚举验证
      - 编辑订单：重新执行日期冲突检测（排除自身）、重新计算 net_income
      - 状态流转：validateStatusTransition 仅允许 pending→checked_in→checked_out
      - 列表查询：支持 room_id、status、platform_source、日期范围筛选 + 排序 + 分页
      - 日历数据：按月查询所有 active 房源的订单
    - 创建 `server/src/routes/bookings.js`：GET/POST/PUT /api/bookings、PATCH /api/bookings/:id/status、GET /api/bookings/calendar
    - 分页响应包含 total、total_pages、page、page_size
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 17.1, 17.2, 17.4_

  - [ ]* 7.2 编写属性测试：订单日期冲突检测
    - **Property 11: 订单日期冲突检测**
    - **验证: 需求 6.4**

  - [ ]* 7.3 编写属性测试：订单编辑时日期冲突排除自身
    - **Property 12: 订单编辑时日期冲突排除自身**
    - **验证: 需求 6.10**

  - [ ]* 7.4 编写属性测试：订单状态流转合法性
    - **Property 13: 订单状态流转合法性**
    - **验证: 需求 6.5, 6.6**

  - [ ]* 7.5 编写属性测试：订单筛选正确性
    - **Property 14: 订单筛选正确性**
    - **验证: 需求 6.1**

  - [ ]* 7.6 编写属性测试：分页正确性
    - **Property 19: 分页正确性**
    - **验证: 需求 17.1, 17.2**

  - [ ]* 7.7 编写属性测试：排序正确性
    - **Property 20: 排序正确性**
    - **验证: 需求 17.4**

- [ ] 8. 工单管理模块
  - [x] 8.1 实现工单服务与路由
    - 创建 `server/src/services/ticketService.js`：创建工单（含图片上传 multer）、列表查询（按状态/问题类型筛选）、标记完成（仅 Admin，记录 completed_at）
    - 创建 `server/src/routes/tickets.js`：GET/POST /api/tickets、GET /api/tickets/:id、PATCH /api/tickets/:id/complete（Admin）
    - 图片存储至 `server/uploads/` 目录，记录 photo_urls JSON 数组
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ]* 8.2 编写属性测试：工单完成记录时间戳
    - **Property 26: 工单完成记录时间戳**
    - **验证: 需求 7.4**

- [x] 9. 检查点 - 核心业务模块验证
  - 确保所有测试通过，如有问题请向用户确认。


- [ ] 10. 财务报表与系统配置模块
  - [x] 10.1 实现报表服务与路由
    - 创建 `server/src/services/reportService.js`：
      - 按房源、租期类型、平台来源、月份四个维度聚合 total_revenue、total_commission、total_net_income
      - CSV 导出：支持按周和按月两种时间粒度，生成 CSV 文件流返回下载
    - 创建 `server/src/routes/reports.js`：GET /api/reports/by-room、by-rental-type、by-platform、by-month（均 Admin）、GET /api/reports/export（Admin）
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 10.2 编写属性测试：财务报表聚合正确性
    - **Property 17: 财务报表聚合正确性**
    - **验证: 需求 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ]* 10.3 编写属性测试：CSV 导出数据完整性
    - **Property 18: CSV 导出数据完整性**
    - **验证: 需求 8.6**

  - [x] 10.4 实现系统配置服务与路由
    - 创建 `server/src/services/configService.js`：CRUD 配置项，config_key 唯一性校验
    - 创建 `server/src/routes/config.js`：GET/POST/PUT /api/config（均 Admin）
    - _需求: 9.1, 9.2, 9.3, 9.5_

  - [ ]* 10.5 编写属性测试：配置键唯一性约束
    - **Property 9: 配置键唯一性约束**
    - **验证: 需求 9.3**

  - [x] 10.6 实现多语言标签路由
    - 创建 `server/src/routes/labels.js`：GET /api/labels（已认证），返回 system_labels 全部记录
    - _需求: 10.5_

- [x] 11. 后端路由注册与 Express 应用集成
  - 在 `server/src/app.js` 中注册所有路由模块（auth、users、rooms、bookings、tickets、reports、config、labels）
  - 挂载中间件链顺序：cors → helmet → JSON 解析 → 请求日志 → 路由 → 全局错误处理
  - 配置静态文件服务 `/uploads` 目录
  - 创建 `server/src/index.js` 启动入口，监听端口
  - _需求: 13.5, 16.2_

  - [ ]* 11.1 编写属性测试：实体创建/更新往返一致性（全实体）
    - **Property 7: 实体往返一致性（用户、订单、工单、配置项）**
    - **验证: 需求 2.1, 6.2, 7.2, 9.2, 11.2**

- [x] 12. 检查点 - 后端完整性验证
  - 确保所有后端测试通过，所有 API 端点可正常访问，如有问题请向用户确认。

- [ ] 13. 前端基础框架与布局
  - [x] 13.1 实现 Axios API 客户端与拦截器
    - 创建 `client/src/api/client.js`：Axios 实例，请求拦截器自动附加 JWT token，响应拦截器处理 401 自动跳转登录、网络错误提示、业务错误 Toast
    - _需求: 14.2, 14.3, 14.5_

  - [x] 13.2 实现 Pinia 认证 Store
    - 创建 `client/src/stores/auth.js`：管理 token、user 状态，login/logout 方法，localStorage 持久化
    - _需求: 1.5_

  - [x] 13.3 实现 Vue Router 与导航守卫
    - 创建 `client/src/router/index.js`：定义所有路由（按设计文档路由表）
    - 实现导航守卫：未认证 → /login、Staff 访问 Admin 路由 → /calendar、已认证访问 /login → /calendar
    - _需求: 3.1, 3.2, 3.3_

  - [ ]* 13.4 编写属性测试：Staff 路由重定向
    - **Property 6: Staff 路由重定向**
    - **验证: 需求 3.3**

  - [x] 13.5 实现国际化配置
    - 创建 `client/src/i18n/index.js` vue-i18n 配置
    - 创建 `client/src/i18n/zh-CN.json` 和 `client/src/i18n/en-US.json` 语言包（覆盖所有页面文本）
    - 语言切换无需刷新页面
    - _需求: 10.1, 10.2, 10.4_

  - [x] 13.6 实现响应式布局组件
    - 创建 `client/src/components/layout/AppLayout.vue` 布局容器
    - 创建 `client/src/components/layout/AppSidebar.vue` 侧边栏导航（Admin 显示全部模块，Staff 隐藏报表/配置/用户管理）
    - 创建 `client/src/components/layout/AppHeader.vue` 顶部栏（语言切换、用户信息、登出）
    - 桌面端（>=1024px）侧边栏展开，平板/移动端（<1024px）收起为汉堡菜单
    - 创建 `client/src/assets/styles/main.css` 全局样式 + 响应式断点
    - _需求: 3.1, 3.2, 12.1, 12.2, 12.3_

  - [x] 13.7 实现通用组件
    - 创建 `client/src/components/common/DataTable.vue` 通用数据表格（支持排序、分页、移动端水平滚动）
    - 创建 `client/src/components/common/FormField.vue` 表单字段（含验证错误提示）
    - 创建 `client/src/components/common/ToastNotification.vue` Toast 通知组件
    - 创建 `client/src/components/common/ConfirmDialog.vue` 确认对话框
    - _需求: 12.5, 12.6, 14.2, 17.3, 17.5, 18.7_

- [ ] 14. 前端页面实现 - 认证与个人中心
  - [x] 14.1 实现登录页面
    - 创建 `client/src/views/LoginView.vue`：邮箱/密码表单、前端验证、调用登录 API、成功后跳转 /calendar
    - 移动端单列布局
    - _需求: 1.1, 1.2, 1.5, 12.5_

  - [x] 14.2 实现个人中心页面
    - 创建 `client/src/views/ProfileView.vue`：展示用户信息、修改姓名/手机号/语言偏好、修改密码表单
    - _需求: 11.1, 11.2, 11.3, 11.4, 10.2, 10.3_

- [ ] 15. 前端页面实现 - 房态日历
  - [x] 15.1 实现房态日历仪表盘
    - 创建 `client/src/views/CalendarView.vue`：月视图日历页面
    - 创建 `client/src/components/calendar/CalendarGrid.vue`：左侧纵向排列房源名称，每行对应日期占用条
    - 创建 `client/src/components/calendar/BookingPopover.vue`：点击订单色块弹出摘要浮层（客人姓名、日期、平台、状态），含"查看详情"链接
    - 订单状态颜色：pending 黄色、checked_in 绿色、checked_out 灰色
    - maintenance 房源灰色标识
    - 月份前/后切换按钮，默认当前月份
    - 移动端支持水平滚动
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 4.4, 12.4_

- [ ] 16. 前端页面实现 - 订单管理
  - [x] 16.1 实现订单 Pinia Store
    - 创建 `client/src/stores/booking.js`：订单列表状态、筛选条件、分页参数、CRUD 操作
    - 创建 `client/src/composables/usePagination.js` 分页逻辑复用
    - _需求: 6.1, 17.1_

  - [x] 16.2 实现订单列表页面
    - 创建 `client/src/views/BookingListView.vue`：使用 DataTable 展示订单列表
    - 筛选栏：房源下拉、状态下拉、平台来源下拉、日期范围选择器
    - 表头点击排序（入住日期、退房日期、创建时间、总收入）
    - 底部分页控件（页码导航 + 每页条数选择）
    - _需求: 6.1, 17.3, 17.5_

  - [x] 16.3 实现订单创建/编辑页面
    - 创建 `client/src/views/BookingFormView.vue`：订单表单（房源选择、客人姓名、入住/退房日期、租期类型、平台来源下拉含 12 个选项、总收入、佣金）
    - 前端验证：退房日期 > 入住日期、收入/佣金非负、必填字段
    - 创建 `client/src/composables/useValidation.js` 表单验证逻辑复用
    - 编辑模式加载已有订单数据，展示净收入计算结果和创建人
    - 移动端单列布局
    - _需求: 6.2, 6.7, 6.9, 18.1, 18.2, 18.3, 18.7, 12.5_

- [ ] 17. 前端页面实现 - 工单管理
  - [x] 17.1 实现工单列表与表单页面
    - 创建 `client/src/stores/ticket.js`：工单状态管理
    - 创建 `client/src/views/TicketListView.vue`：工单列表，按状态/问题类型筛选，urgent 红色标签
    - 创建 `client/src/views/TicketFormView.vue`：工单创建表单（房源选择、问题类型、描述、优先级、图片上传），详情页展示图片预览
    - 前端验证：问题类型枚举、描述非空
    - _需求: 7.1, 7.2, 7.3, 7.6, 7.7, 18.5, 18.7_

- [ ] 18. 前端页面实现 - 管理功能
  - [x] 18.1 实现房源管理页面
    - 创建 `client/src/stores/room.js`：房源状态管理
    - 创建 `client/src/views/RoomListView.vue`：房源列表（名称、类型、日基础房价、状态），中英文名称同时展示
    - 创建 `client/src/views/RoomFormView.vue`：房源编辑表单（中文名、英文名、类型下拉、日基础房价、状态切换）
    - 前端验证：名称非空、房价 > 0、类型枚举
    - _需求: 4.1, 4.2, 4.5, 10.6, 18.4, 18.7_

  - [x] 18.2 实现财务报表页面
    - 创建 `client/src/views/ReportView.vue`：四维度切换（房源/租期类型/平台来源/月份）
    - 创建 `client/src/components/report/ReportTable.vue`：报表表格含汇总行
    - CSV 导出按钮（周/月粒度选择）
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9_

  - [x] 18.3 实现系统配置页面
    - 创建 `client/src/stores/app.js`：全局状态（语言、配置项）
    - 创建 `client/src/views/ConfigView.vue`：配置项列表（键、值、功能开关、更新时间），新增/编辑配置项
    - 功能开关关闭时隐藏对应功能界面入口
    - _需求: 9.1, 9.2, 9.3, 9.4_

  - [x] 18.4 实现用户管理页面
    - 创建 `client/src/views/UserListView.vue`：用户列表，创建/编辑用户（姓名、邮箱、角色、语言偏好、手机号）
    - _需求: 2.1, 2.2_

  - [x] 18.5 实现 404 页面
    - 创建 `client/src/views/NotFoundView.vue`：404 页面，提供返回首页链接
    - _需求: 3.3_

- [x] 19. 检查点 - 前端完整性验证
  - 确保所有前端组件正常渲染，路由守卫正确工作，API 集成无误，如有问题请向用户确认。

- [ ] 20. 部署配置与备份脚本
  - [x] 20.1 创建 Nginx 配置文件
    - 创建 Nginx 配置：`/` 服务 Vue SPA 静态文件（fallback index.html）、`/api/*` 反向代理到 localhost:3000、`/uploads/*` 服务上传文件目录
    - 配置 CORS 头限制允许域名、启用 gzip 压缩
    - _需求: 16.1, 16.3, 16.4, 13.5_

  - [x] 20.2 创建 PM2 配置与数据库备份脚本
    - 创建 PM2 ecosystem 配置文件（ecosystem.config.js）
    - 创建 `server/scripts/backup.sh` PostgreSQL 备份脚本（pg_dump），支持 cron 定时执行
    - _需求: 16.2, 16.6_

- [x] 21. 最终检查点 - 全系统验证
  - 确保所有测试通过，前后端集成正常，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 交付
- 每个任务引用具体需求编号以确保可追溯性
- 检查点任务确保增量验证，及时发现问题
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- 所有代码使用 JavaScript（Node.js + Vue 3），测试使用 Vitest + fast-check
