# 实施计划：移动端 UI 重新设计

## 概述

将 Villa PMS 前端从桌面优先改造为移动优先的现代化 UI。按照基础设施 → 布局框架 → 通用组件 → 页面改造的顺序逐步实施，每一步都在前一步基础上构建，确保无孤立代码。使用 Vue 3 + Composition API + 自定义 CSS（无 UI 框架）。

## 任务

- [x] 1. 基础设施：Design Token、图标系统与响应式工具
  - [x] 1.1 创建 `client/src/assets/styles/tokens.css` Design Token 文件
    - 定义所有 CSS 自定义属性：颜色（--color-primary, --color-nav-bg 等）、字号（--font-size-base: 1rem 等）、间距、圆角（--radius-lg: 12px, --radius-md: 8px）、阴影、触控尺寸（--touch-target-min: 44px, --touch-target-nav: 48px, --fab-size: 56px）、动画时长、底部导航高度（--bottom-nav-height: 56px）
    - 在 `client/src/main.js` 中导入 tokens.css（在 main.css 之前）
    - _需求: 6.1_

  - [x] 1.2 重构 `client/src/assets/styles/main.css` 为移动优先样式
    - 将所有硬编码颜色、字号、间距替换为 Design Token 变量引用
    - 将媒体查询改为 `min-width` 移动优先模式
    - 按钮内边距增大：垂直 ≥ 0.75rem，水平 ≥ 1.25rem
    - 表单输入框高度 ≥ 48px，圆角 ≥ 8px，聚焦时显示主色调边框和阴影
    - 卡片圆角 ≥ 12px，柔和阴影
    - Status_Badge 字号 ≥ 0.8125rem，内边距 ≥ 0.25rem 0.75rem
    - 正文字号 ≥ 1rem，页面标题字号 ≥ 1.375rem
    - 表单错误提示字号 ≥ 0.8125rem
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.6, 7.1, 7.2, 7.4_

  - [x] 1.3 创建 `client/src/components/icons/SvgIcon.vue` 图标组件
    - 实现内联 SVG sprite 方案，通过 `<use href="#icon-name">` 引用图标
    - 支持 `name`（必填）和 `size`（默认 24）props
    - 在 `client/src/App.vue` 中嵌入隐藏的 SVG sprite 定义块，包含约 26 个图标：calendar, booking, ticket, person, more, plus, edit, delete, save, filter, chevron-up, chevron-down, chevron-left, chevron-right, check, close, clock, warning, error, success, search, refresh, room, report, config, users
    - _需求: 3.1, 3.2_

  - [x] 1.4 创建 `client/src/composables/useMediaQuery.js` 响应式断点检测
    - 导出 `useMediaQuery(query)` composable，接收 CSS 媒体查询字符串，返回响应式 boolean ref
    - 使用 `window.matchMedia` API 监听断点变化，组件卸载时清理监听器
    - _需求: 1.2, 1.3_

  - [ ]* 1.5 为 useMediaQuery 编写属性测试
    - **Property 1: 响应式导航切换** — 生成随机屏幕宽度，验证 < 1024px 和 ≥ 1024px 时返回值正确
    - **验证: 需求 1.2, 1.3**

  - [x] 1.6 更新 `client/index.html` viewport meta 标签
    - 设置 `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
    - _需求: 1.1_

- [x] 2. 布局框架：底部导航、AppLayout 与 AppHeader 改造
  - [x] 2.1 创建 `client/src/components/layout/BottomNav.vue` 底部导航组件
    - 接收 `items` 数组（含 to, icon, label, badge）和 `activeRoute` prop
    - 固定在视口底部，深色背景（var(--color-nav-bg)），每个标签项包含 SvgIcon + 中文标签
    - 标签项高度 ≥ 48px，图标 24px，标签文字 ≥ 0.75rem
    - 使用 `<router-link>` 实现导航，当前激活项高亮显示
    - 仅在 < 1024px 时显示（CSS 媒体查询 `display: none` 在 ≥ 1024px）
    - _需求: 1.2, 1.4, 1.5, 2.6, 3.2_

  - [ ]* 2.2 为 BottomNav 编写属性测试
    - **Property 2: BottomNav 标签项基于用户角色** — 生成随机用户角色，验证 Admin 显示 5 项（含"更多"），非 Admin 显示 4 项
    - **验证: 需求 1.4, 12.1, 12.4**
    - **Property 3: BottomNav 标签项内容完整性** — 验证每个标签项同时包含 SVG 图标元素和文字标签元素
    - **验证: 需求 1.5, 3.2**
    - **Property 8: BottomNav 标签项尺寸** — 验证标签项高度 ≥ 48px，图标 ≥ 24px，文字 ≥ 0.75rem
    - **验证: 需求 2.6**

  - [x] 2.3 改造 `client/src/components/layout/AppLayout.vue` 响应式布局
    - 使用 `useMediaQuery('(min-width: 1024px)')` 检测 isDesktop
    - 移动端：隐藏 AppSidebar（v-if="isDesktop"），显示 BottomNav（v-if="!isDesktop"）
    - 根据用户角色（useAuthStore）动态生成 BottomNav 的 items：普通用户 4 项（日历、预订、工单、个人），管理员 5 项（+ 更多）
    - 主内容区底部增加 `padding-bottom: var(--bottom-nav-height)` 防止内容被 BottomNav 遮挡（仅移动端）
    - 页面视图切换使用 `<transition>` 包裹 `<router-view>`，过渡时长 200ms
    - _需求: 1.2, 1.3, 1.4, 1.7, 1.8, 12.1, 12.4_

  - [x] 2.4 改造 `client/src/components/layout/AppHeader.vue` 精简移动端顶栏
    - 移除汉堡菜单按钮（hamburger）及 toggle-sidebar 事件
    - 添加页面标题显示（通过 `useRoute().meta.title` 或路由名称映射）
    - 仅保留页面标题和语言切换按钮
    - 页面标题字号 ≥ 1.375rem（var(--font-size-xl)）
    - _需求: 1.6, 2.3_

  - [x] 2.5 改造 `client/src/components/layout/AppSidebar.vue` 仅桌面端显示
    - 移除移动端的 fixed 定位、滑入动画和 open prop 逻辑
    - 通过 CSS `@media (max-width: 1023px) { display: none }` 隐藏（作为 AppLayout v-if 的备用方案）
    - _需求: 1.3_

- [x] 3. 检查点 — 确保布局框架正常工作
  - 确保所有测试通过，如有问题请向用户确认。


- [x] 4. 通用组件：DataTable 卡片模式、FAB、筛选器、下拉刷新
  - [x] 4.1 改造 `client/src/components/common/DataTable.vue` 增加卡片模式
    - 新增 props: `cardMode`(Boolean), `cardTitleKey`(String), `cardSubtitleKey`(String), `cardStatusKey`(String), `cardLinkFn`(Function)
    - `cardMode=true` 时渲染为卡片列表：每张卡片突出主要信息（cardTitleKey 字段大字号），次要信息小字号，包含 Status_Badge，支持点击导航（cardLinkFn 生成路由）
    - `cardMode=false` 时保持现有表格渲染逻辑不变
    - 空列表状态：卡片模式和表格模式均显示居中的 SvgIcon + 提示文字
    - 卡片圆角 ≥ 12px（var(--radius-lg)），柔和阴影（var(--shadow-sm)）
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.3_

  - [ ]* 4.2 为 DataTable 卡片模式编写属性测试
    - **Property 10: DataTable 响应式渲染模式** — 生成随机屏幕宽度，验证 < 768px 卡片模式，≥ 768px 表格模式
    - **验证: 需求 4.1, 4.2**
    - **Property 11: 卡片布局信息层次** — 验证卡片标题 font-size 大于次要信息 font-size，且包含 Status_Badge
    - **验证: 需求 4.3, 4.4**
    - **Property 12: 卡片点击导航** — 验证点击卡片导航到对应详情页路由
    - **验证: 需求 4.5**

  - [x] 4.3 创建 `client/src/components/common/FloatingActionButton.vue` FAB 组件
    - 接收 `to`(String), `icon`(String, 默认 'plus'), `label`(String, 用于 aria-label) props
    - 56px 圆形按钮（var(--fab-size)），主色调背景（var(--color-primary)），白色加号 SvgIcon
    - 固定定位右下角，距底部 `calc(var(--bottom-nav-height) + 16px)`
    - 点击时通过 `router.push(to)` 导航到新建页面
    - 仅在 < 768px 时显示（CSS 媒体查询控制）
    - _需求: 9.1, 9.2, 9.3, 9.4, 9.5, 3.5_

  - [ ]* 4.4 为 FAB 编写属性测试
    - **Property 25: FAB 响应式显示** — 生成随机屏幕宽度，验证 < 768px 可见，≥ 768px 隐藏
    - **验证: 需求 9.1, 9.5**
    - **Property 26: FAB 点击导航** — 验证点击 FAB 导航到对应新建表单路由
    - **验证: 需求 9.4**

  - [x] 4.5 创建 `client/src/components/common/MobileFilter.vue` 移动端筛选器组件
    - 接收 `filterFields`(Array, 筛选字段定义), `activeCount`(Number, 激活条件数) props，触发 `apply`/`reset` 事件
    - `filterFields` 每项包含 `{ key, label, type, options }` 定义
    - < 768px：显示为"筛选"按钮（含 SvgIcon filter 图标 + 箭头图标指示展开/收起），激活时显示数字角标
    - 点击展开底部抽屉面板（Teleport to body，半透明遮罩 + 从底部滑入），包含所有筛选选项 + "应用"/"重置"按钮
    - ≥ 768px：直接渲染为水平排列的筛选栏（复用现有 filter-bar 样式）
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 3.6_

  - [ ]* 4.6 为 MobileFilter 编写属性测试
    - **Property 27: 筛选器响应式模式** — 生成随机屏幕宽度，验证 < 768px 收起按钮模式，≥ 768px 水平排列模式
    - **验证: 需求 10.1, 10.5**
    - **Property 28: 筛选器激活角标** — 生成随机筛选条件组合，验证角标数字等于激活条件数量
    - **验证: 需求 10.4**

  - [x] 4.7 创建 `client/src/composables/usePullToRefresh.js` 下拉刷新 composable
    - 导出 `usePullToRefresh(options)` composable，options 包含 `{ onRefresh, threshold: 60 }`
    - 监听 touchstart/touchmove/touchend 事件，计算下拉距离
    - 下拉超过 threshold 后释放触发 onRefresh 回调
    - 返回 `{ containerRef, pullDistance, isRefreshing, isPulling }`
    - _需求: 8.1_

  - [x] 4.8 创建 `client/src/components/common/PullToRefresh.vue` 下拉刷新组件
    - 接收 `loading`(Boolean), `disabled`(Boolean) props，触发 `refresh` 事件
    - 使用 usePullToRefresh composable 处理手势逻辑
    - 下拉时显示旋转加载指示器动画（CSS animation）
    - 加载完成后自动隐藏指示器
    - 加载失败时由父组件通过 Toast 显示错误提示
    - _需求: 8.1, 8.2, 8.3_

  - [ ]* 4.9 为 PullToRefresh 编写属性测试
    - **Property 23: 下拉刷新触发** — 生成随机下拉距离，验证超过阈值（60px）时触发 refresh 事件，未超过时不触发
    - **验证: 需求 8.1**

  - [x] 4.10 创建 `client/src/composables/useInfiniteScroll.js` 无限滚动 composable
    - 导出 `useInfiniteScroll(options)` composable，options 包含 `{ loadMore, hasMore, threshold: 200 }`
    - 监听滚动容器（默认 window），距底部 threshold 时触发 loadMore
    - hasMore 为 false 时停止监听
    - 返回 `{ containerRef }`，组件卸载时清理监听器
    - _需求: 8.4, 8.5_

  - [ ]* 4.11 为 useInfiniteScroll 编写属性测试
    - **Property 24: 无限滚动加载** — 生成随机滚动位置和 hasMore 状态，验证仅在距底部 ≤ threshold 且 hasMore=true 时触发加载
    - **验证: 需求 8.4**

- [x] 5. 检查点 — 确保通用组件正常工作
  - 确保所有测试通过，如有问题请向用户确认。


- [x] 6. Toast 通知与确认对话框移动端优化
  - [x] 6.1 改造 `client/src/components/common/ToastNotification.vue` 移动端样式
    - 移动端（< 768px）：Toast 容器改为屏幕顶部居中，宽度 `calc(100% - 32px)`（左右各 16px 边距）
    - 字体 ≥ 0.875rem
    - 每条 Toast 在消息文字前添加对应类型的 SvgIcon 图标：success → check, error → close, info → warning
    - 桌面端保持现有右上角定位
    - _需求: 11.1, 11.4_

  - [x] 6.2 改造 `client/src/components/common/ConfirmDialog.vue` 移动端底部面板
    - 移动端（< 768px）：对话框改为底部弹出面板（position: fixed, bottom: 0），从底部滑入（CSS transition transform）
    - 操作按钮纵向排列（flex-direction: column），主要操作（确认）在上，取消在下
    - 按钮占满宽度（width: 100%）且高度 ≥ 48px
    - 面板顶部圆角（border-radius: var(--radius-lg) var(--radius-lg) 0 0）
    - 桌面端保持现有居中对话框样式
    - _需求: 11.2, 11.3_

  - [ ]* 6.3 为 Toast 和 ConfirmDialog 编写属性测试
    - **Property 29: Toast 移动端样式** — 验证移动端 Toast 全宽布局、字号 ≥ 0.875rem 和类型图标
    - **验证: 需求 11.1, 11.4**
    - **Property 30: 确认对话框移动端布局** — 验证移动端底部面板、按钮纵向排列和高度 ≥ 48px
    - **验证: 需求 11.2, 11.3**

- [ ] 7. Store 改造与路由更新
  - [x] 7.1 改造 `client/src/stores/booking.js` 支持无限滚动
    - 新增 `appendMode` ref（默认 false）
    - 修改 `fetchBookings`：当 appendMode=true 时将新数据追加到 bookings 数组（`[...bookings.value, ...data.data]`），否则替换
    - 新增 `hasMore` computed：`page.value < totalPages.value`
    - 新增 `loadNextPage` action：page++，设置 appendMode=true，调用 fetchBookings，完成后重置 appendMode=false
    - _需求: 8.4_

  - [x] 7.2 改造 `client/src/stores/ticket.js` 支持无限滚动
    - 新增分页状态：`page`(ref, 默认 1), `pageSize`(ref, 默认 20), `total`(ref), `totalPages`(ref)
    - 修改 `fetchTickets` 添加分页参数（page, page_size），解析响应中的 total/total_pages
    - 新增 `appendMode`, `hasMore`, `loadNextPage`（与 booking store 同样模式）
    - _需求: 8.4_

  - [x] 7.3 更新 `client/src/router/index.js` 添加 /more 路由
    - 在 AppLayout children 中添加：`{ path: 'more', name: 'MoreMenu', component: () => import('../views/MoreMenuView.vue'), meta: { role: 'Admin' } }`
    - _需求: 12.2_

  - [x] 7.4 创建 `client/src/views/MoreMenuView.vue` 管理功能菜单页
    - 2×2 网格布局（CSS grid, grid-template-columns: repeat(2, 1fr)）
    - 每个入口包含 SvgIcon（32px）+ 中文标签
    - 4 个入口：房间管理（/rooms, icon: room）、报表（/reports, icon: report）、系统配置（/config, icon: config）、用户管理（/users, icon: users）
    - 每个入口使用 `<router-link>` 导航
    - _需求: 12.2, 12.3_

  - [ ]* 7.5 为 MoreMenuView 编写单元测试
    - **Property 31: 管理菜单项内容** — 验证每个菜单项同时包含 SvgIcon 图标元素和中文标签文字
    - **验证: 需求 12.3**

  - [x] 7.6 更新国际化文件
    - 更新 `client/src/i18n/zh-CN.json`：添加 nav.more（更多）、nav.rooms（房间管理）、nav.reports（报表）、nav.config（系统配置）、nav.users（用户管理）、filter.button（筛选）、filter.apply（应用）、filter.reset（重置）、pullToRefresh.pull（下拉刷新）、pullToRefresh.release（释放刷新）、pullToRefresh.loading（加载中...）、infiniteScroll.loadedAll（已加载全部）、infiniteScroll.loadMore（加载更多）等翻译 key
    - 更新 `client/src/i18n/en-US.json`：添加对应英文翻译
    - _需求: 1.4, 1.5, 12.3_

- [x] 8. 检查点 — 确保 Store、路由和新页面正常工作
  - 确保所有测试通过，如有问题请向用户确认。


- [x] 9. 日历视图移动端优化
  - [x] 9.1 改造 `client/src/components/calendar/CalendarGrid.vue` 移动端优化
    - 房间名称列使用 `position: sticky; left: 0` 在水平滚动时保持固定可见
    - 预订条高度 ≥ 36px，客人姓名文字 ≥ 0.75rem
    - 日期列头同时显示日期数字和星期缩写（如 "1 一", "2 二"）
    - 支持触摸水平滑动浏览日期列（已有 overflow-x: auto + -webkit-overflow-scrolling: touch）
    - _需求: 5.1, 5.2, 5.3, 5.6_

  - [ ]* 9.2 为 CalendarGrid 编写属性测试
    - **Property 13: 日历预订条尺寸** — 验证预订条高度 ≥ 36px，客人姓名文字 font-size ≥ 0.75rem
    - **验证: 需求 5.3**
    - **Property 15: 日历日期列头信息** — 验证日期列头同时显示日期数字和星期缩写
    - **验证: 需求 5.6**

  - [x] 9.3 改造 `client/src/components/calendar/BookingPopover.vue` 移动端底部抽屉
    - 使用 `useMediaQuery('(min-width: 768px)')` 检测 isDesktop
    - < 768px 时：以底部抽屉形式呈现（position: fixed, bottom: 0, left: 0, width: 100%），从底部滑入（CSS transition），顶部圆角
    - ≥ 768px 时：保持现有绝对定位弹出层样式
    - 底部抽屉模式下点击遮罩层关闭
    - _需求: 5.4_

  - [ ]* 9.4 为 BookingPopover 编写属性测试
    - **Property 14: 预订详情移动端底部抽屉** — 验证 < 768px 时以底部抽屉模式渲染（width: 100%, bottom: 0）
    - **验证: 需求 5.4**

  - [x] 9.5 改造 `client/src/views/CalendarView.vue` 移动端适配
    - 月份切换按钮（上一月/下一月）触控区域 ≥ 44px（var(--touch-target-min)）
    - 使用 SvgIcon（chevron-left, chevron-right）替代文字箭头
    - _需求: 5.5_

- [x] 10. 列表页移动端改造（预订、工单、房间、用户）
  - [x] 10.1 改造 `client/src/views/BookingListView.vue`
    - 使用 `useMediaQuery('(min-width: 768px)')` 检测 isDesktop
    - 移动端（!isDesktop）：传入 DataTable `cardMode=true`，cardTitleKey="guest_name"，cardSubtitleKey="room_name"，cardStatusKey="booking_status"，cardLinkFn 生成 `/bookings/${id}` 路由
    - 替换现有筛选栏为 MobileFilter 组件（移动端收起，桌面端展开）
    - 添加 FloatingActionButton（to="/bookings/new"），移动端隐藏页面顶部"新建预订"按钮
    - 用 PullToRefresh 组件包裹列表内容，refresh 事件调用 `store.resetFilters(); store.fetchBookings()`
    - 集成 useInfiniteScroll，loadMore 调用 `store.loadNextPage()`，hasMore 绑定 `store.hasMore`
    - 显示"已加载全部"提示（当 !store.hasMore 且列表非空时）
    - _需求: 4.1, 8.1, 8.4, 8.5, 9.1, 10.1_

  - [x] 10.2 改造 `client/src/views/TicketListView.vue`
    - 与 BookingListView 同样模式：cardMode、MobileFilter、FAB（to="/tickets/new"）、PullToRefresh、useInfiniteScroll
    - cardTitleKey="#id"（工单编号），cardSubtitleKey="description"，cardStatusKey="ticket_status"
    - _需求: 4.1, 8.1, 8.4, 9.1, 10.1_

  - [x] 10.3 改造 `client/src/views/RoomListView.vue`
    - 集成 DataTable cardMode 和 MobileFilter
    - 房间列表无 FAB（房间管理仅管理员通过"更多"菜单访问）
    - _需求: 4.1, 10.1_

  - [x] 10.4 改造 `client/src/views/UserListView.vue`
    - 集成 DataTable cardMode 和移动端优化
    - _需求: 4.1_

- [x] 11. 检查点 — 确保日历和列表页正常工作
  - 确保所有测试通过，如有问题请向用户确认。


- [x] 12. 表单页与登录页移动端优化
  - [x] 12.1 改造 `client/src/components/common/FormField.vue` 增大触控区域
    - 输入框和选择框高度 ≥ 48px（通过 CSS 变量 var(--touch-target-nav)）
    - 相邻 FormField 垂直间距 ≥ 1rem（var(--spacing-md)）
    - 错误提示文字 font-size ≥ 0.8125rem（var(--font-size-sm)），红色（var(--color-danger)）
    - < 640px 时单列布局，每个字段宽度 100%
    - _需求: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 12.2 为 FormField 编写属性测试
    - **Property 18: FormField 输入框高度** — 验证输入框高度 ≥ 48px
    - **验证: 需求 7.1**
    - **Property 19: FormField 垂直间距** — 验证相邻 FormField 间距 ≥ 1rem
    - **验证: 需求 7.2**
    - **Property 20: FormField 移动端单列布局** — 验证 < 640px 时字段宽度 100%
    - **验证: 需求 7.3**
    - **Property 21: FormField 错误提示样式** — 验证错误提示 font-size ≥ 0.8125rem 且红色
    - **验证: 需求 7.4**

  - [x] 12.3 改造 `client/src/views/LoginView.vue` 移动端视觉优化
    - 全屏深色渐变背景（linear-gradient，替代现有浅灰 #f3f4f6 背景）
    - 登录卡片居中显示，包含应用 Logo（SvgIcon 或文字 "Villa PMS"）
    - 大尺寸输入框（高度 ≥ 48px），圆角 ≥ 8px（var(--radius-md)）
    - 登录按钮使用主色调，高度 ≥ 48px
    - _需求: 6.5_

  - [x] 12.4 改造 `client/src/views/BookingFormView.vue` 移动端表单优化
    - < 640px 时单列布局（现有双列改为 grid-template-columns: 1fr）
    - 日期输入框确保使用 `type="date"` 调起原生日期选择器
    - 表单提交时按钮 disabled + 加载状态文字，防止重复提交
    - _需求: 7.3, 7.5, 7.6_

  - [x] 12.5 改造 `client/src/views/TicketFormView.vue` 移动端表单优化
    - 与 BookingFormView 同样模式：< 640px 单列布局、大尺寸输入框、提交防重复
    - _需求: 7.3, 7.6_

  - [x] 12.6 改造 `client/src/views/RoomFormView.vue` 移动端表单优化
    - 与 BookingFormView 同样模式
    - _需求: 7.3, 7.6_

- [x] 13. 其他页面移动端优化
  - [x] 13.1 改造 `client/src/views/ReportView.vue` 移动端优化
    - 报表内容在移动端以可水平滚动的表格或卡片形式展示
    - 筛选器使用 MobileFilter 组件
    - _需求: 4.1, 10.1_

  - [x] 13.2 改造 `client/src/views/ConfigView.vue` 移动端优化
    - 配置项在移动端以单列卡片形式展示
    - _需求: 7.3_

  - [x] 13.3 改造 `client/src/views/ProfileView.vue` 移动端优化
    - 个人信息页在移动端以单列布局展示，输入框高度 ≥ 48px
    - _需求: 7.3_

- [x] 14. 全局集成：操作按钮图标与 Status_Badge 图标
  - [x] 14.1 为所有主要操作按钮添加图标
    - 遍历所有视图文件，为主要操作按钮添加 SvgIcon：新建（plus）、保存（save）、删除（delete）、编辑（edit）
    - 确保按钮同时包含图标和文字
    - 涉及文件：BookingFormView, TicketFormView, RoomFormView, BookingListView, TicketListView, RoomListView, UserListView
    - _需求: 3.3_

  - [ ]* 14.2 为主要操作按钮编写属性测试
    - **Property 9: 主要操作按钮包含图标** — 验证新建、保存、删除、编辑按钮同时包含 SvgIcon 图标元素和文字
    - **验证: 需求 3.3**

  - [x] 14.3 为 Status_Badge 添加状态图标
    - 在 main.css 的 Status_Badge 样式中集成图标显示
    - 待处理（pending）→ clock 图标，已入住/已完成（checked_in/completed）→ check 图标，已退房（checked_out）→ close 图标，紧急（urgent）→ warning 图标
    - 在 DataTable 卡片模式和列表页中的 Status_Badge 渲染时添加 SvgIcon
    - _需求: 3.4_

  - [ ]* 14.4 为 Status_Badge 编写属性测试
    - **Property 7: Status_Badge 尺寸与图标** — 验证 font-size ≥ 0.8125rem，内边距 ≥ 0.25rem 0.75rem，且包含对应状态的图标元素
    - **验证: 需求 2.5, 3.4**

- [x] 15. 最终检查点 — 确保所有测试通过
  - 确保所有测试通过，如有问题请向用户确认。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快 MVP 进度
- 每个任务引用了具体的需求编号以确保可追溯性
- 检查点任务确保增量验证
- 属性测试使用 fast-check 库验证通用正确性属性，单元测试验证具体示例和边界情况
- 本计划仅涉及前端代码变更，不涉及后端 API 修改
- 测试框架：Vitest + @vue/test-utils + fast-check（需新增 fast-check 依赖）
