# 需求文档

## 简介

Villa PMS 是一个管理泰国 17 套物业的别墅物业管理系统。当前 UI 采用桌面优先设计，存在字体小、触控目标小、缺少图标、移动端布局不友好等问题。本次重新设计的目标是将整个前端 UI 改造为移动优先的现代化界面，提升手机端的可用性和视觉体验。本次改造仅涉及前端 UI，不涉及后端 API 变更。

## 术语表

- **App_Shell**: 应用主布局框架，包含顶部栏、底部导航栏和主内容区域
- **Bottom_Nav**: 底部标签导航栏，手机端的主要导航方式
- **Sidebar**: 侧边栏导航，桌面端使用
- **Touch_Target**: 可点击/可触摸的 UI 元素（按钮、链接、图标等）
- **FAB**: 浮动操作按钮（Floating Action Button），用于页面主要操作
- **Card_Layout**: 卡片式布局，用于在移动端替代传统表格展示数据
- **Calendar_Grid**: 日历网格组件，展示房间预订时间线
- **DataTable**: 数据表格组件，用于列表页展示数据
- **FormField**: 表单字段组件，包含标签、输入框和错误提示
- **Status_Badge**: 状态标签，用颜色和图标展示预订/工单/房间状态
- **Icon_Library**: 图标库，提供 SVG 图标用于导航、按钮和状态指示
- **Pull_To_Refresh**: 下拉刷新交互模式
- **Swipe_Gesture**: 滑动手势交互
- **Design_Token**: 设计令牌，统一管理颜色、字号、间距等设计变量

## 需求

### 需求 1：移动优先响应式布局框架

**用户故事：** 作为物业管理员，我希望在手机上获得原生应用般的布局体验，以便高效地管理物业。

#### 验收标准

1. THE App_Shell SHALL 采用移动优先的响应式布局，默认针对 375px 及以上宽度的移动设备进行优化
2. WHEN 屏幕宽度小于 1024px 时，THE App_Shell SHALL 在底部显示 Bottom_Nav 作为主导航，隐藏 Sidebar
3. WHEN 屏幕宽度大于等于 1024px 时，THE App_Shell SHALL 在左侧显示 Sidebar 导航，隐藏 Bottom_Nav
4. THE Bottom_Nav SHALL 包含以下标签项：日历、预订、工单、个人（普通用户）；管理员额外显示"更多"标签以访问管理功能
5. THE Bottom_Nav SHALL 使用深色背景（深蓝或深灰色调），每个标签项包含图标和中文标签文字
6. THE App_Shell SHALL 在顶部显示一个精简的 Header，仅包含页面标题和语言切换按钮
7. WHEN 用户切换 Bottom_Nav 标签时，THE App_Shell SHALL 在 200ms 内完成页面视图切换
8. THE App_Shell 的主内容区域 SHALL 在 Bottom_Nav 上方留出足够的底部内边距，防止内容被导航栏遮挡

### 需求 2：大尺寸触控目标与字体

**用户故事：** 作为手机用户，我希望所有按钮和文字都足够大，以便在手机上轻松点击和阅读。

#### 验收标准

1. THE App_Shell 中所有可交互的 Touch_Target（按钮、链接、导航项、选择框）SHALL 具有不小于 44px × 44px 的最小触控区域
2. THE App_Shell SHALL 将正文字体大小设置为不小于 1rem（16px），表单标签和输入框字体大小设置为不小于 1rem
3. THE App_Shell SHALL 将页面标题字体大小设置为不小于 1.375rem（22px）
4. THE App_Shell 中所有按钮 SHALL 具有不小于 0.75rem 的垂直内边距和不小于 1.25rem 的水平内边距
5. THE Status_Badge SHALL 使用不小于 0.8125rem 的字体大小和不小于 0.25rem 0.75rem 的内边距
6. THE Bottom_Nav 中每个标签项 SHALL 具有不小于 48px 的高度，图标大小不小于 24px，标签文字不小于 0.75rem

### 需求 3：图标库集成

**用户故事：** 作为用户，我希望看到直观的图标来辅助理解导航和操作，以便更快地找到所需功能。

#### 验收标准

1. THE App_Shell SHALL 集成一个 Icon_Library（Material Design Icons 或同等 SVG 图标库）
2. THE Bottom_Nav 的每个标签项 SHALL 显示对应功能的图标（如日历图标、预订图标、工单图标、用户图标）
3. THE App_Shell 中所有主要操作按钮（新建、保存、删除、编辑）SHALL 在文字旁显示对应图标
4. THE Status_Badge SHALL 在状态文字旁显示对应的状态图标（如待处理用时钟图标、已入住用勾选图标）
5. THE FAB SHALL 使用加号图标表示新建操作
6. THE App_Shell 中筛选器的展开/收起 SHALL 使用箭头图标指示当前状态

### 需求 4：卡片式移动端列表布局

**用户故事：** 作为手机用户，我希望列表数据以卡片形式展示，以便在小屏幕上清晰地查看每条记录。

#### 验收标准

1. WHEN 屏幕宽度小于 768px 时，THE DataTable SHALL 以 Card_Layout 形式展示数据，每条记录显示为一张独立卡片
2. WHEN 屏幕宽度大于等于 768px 时，THE DataTable SHALL 以传统表格形式展示数据
3. THE Card_Layout 中每张卡片 SHALL 突出显示主要信息（如客人姓名、房间名称），次要信息（如日期、金额）以较小字体显示
4. THE Card_Layout 中每张卡片 SHALL 显示对应的 Status_Badge
5. THE Card_Layout 中每张卡片 SHALL 支持点击进入详情页
6. WHEN 列表数据为空时，THE Card_Layout SHALL 显示居中的空状态提示文字和图标

### 需求 5：移动端日历视图优化

**用户故事：** 作为物业管理员，我希望在手机上方便地查看和操作预订日历，以便快速了解房间占用情况。

#### 验收标准

1. WHEN 屏幕宽度小于 768px 时，THE Calendar_Grid SHALL 支持水平滑动浏览日期列
2. THE Calendar_Grid 的房间名称列 SHALL 在水平滚动时保持固定可见
3. THE Calendar_Grid 中预订条 SHALL 具有不小于 36px 的高度，客人姓名文字不小于 0.75rem
4. WHEN 用户点击预订条时，THE Calendar_Grid SHALL 显示预订详情弹出层，弹出层在移动端以底部抽屉形式呈现
5. THE Calendar_Grid 的月份切换按钮 SHALL 具有不小于 44px 的触控区域
6. THE Calendar_Grid 的日期列头 SHALL 显示日期数字和星期缩写

### 需求 6：现代化视觉设计

**用户故事：** 作为用户，我希望应用界面美观现代，以便获得愉悦的使用体验。

#### 验收标准

1. THE App_Shell SHALL 使用统一的 Design_Token 系统管理颜色、字号、间距和圆角等设计变量
2. THE App_Shell SHALL 使用以下主色调方案：主色为蓝色系（用于主要操作和强调），深色系用于 Header 和 Bottom_Nav 背景，浅灰色用于页面背景
3. THE App_Shell 中所有卡片 SHALL 使用圆角（不小于 12px）和柔和阴影
4. THE App_Shell 中所有页面过渡 SHALL 使用平滑动画效果
5. THE Login 页面 SHALL 使用全屏深色渐变背景，登录卡片居中显示，包含应用 Logo 和大尺寸输入框
6. THE App_Shell 中所有表单输入框 SHALL 使用圆角边框（不小于 8px），聚焦时显示主色调边框和阴影
7. THE App_Shell SHALL 确保所有文字与背景的对比度符合 WCAG 2.1 AA 级标准（普通文字对比度不低于 4.5:1）

### 需求 7：移动端表单体验优化

**用户故事：** 作为手机用户，我希望在手机上填写表单时输入框足够大且间距合理，以便快速准确地完成数据录入。

#### 验收标准

1. THE FormField 中所有输入框和选择框 SHALL 具有不小于 48px 的高度
2. THE FormField 中相邻表单字段之间 SHALL 具有不小于 1rem 的垂直间距
3. WHEN 屏幕宽度小于 640px 时，THE FormField SHALL 以单列布局排列，每个字段占满整行宽度
4. THE FormField 的错误提示文字 SHALL 使用不小于 0.8125rem 的字体大小和红色文字
5. THE FormField 中日期输入框 SHALL 使用原生日期选择器，确保在移动端调起系统日期选择界面
6. WHEN 表单提交过程中，THE App_Shell SHALL 显示全屏加载遮罩或按钮加载状态，防止重复提交

### 需求 8：下拉刷新与滚动加载

**用户故事：** 作为手机用户，我希望通过下拉刷新获取最新数据，通过滚动加载更多记录，以便获得流畅的浏览体验。

#### 验收标准

1. WHEN 用户在列表页顶部向下拉动时，THE App_Shell SHALL 触发 Pull_To_Refresh 操作，重新加载当前列表数据
2. THE Pull_To_Refresh SHALL 显示加载指示器动画，加载完成后自动隐藏
3. IF Pull_To_Refresh 操作失败，THEN THE App_Shell SHALL 显示错误提示并恢复列表原有状态
4. THE 列表页 SHALL 在分页数据场景下支持滚动到底部自动加载下一页数据
5. WHEN 所有数据已加载完毕时，THE App_Shell SHALL 显示"已加载全部"提示文字

### 需求 9：浮动操作按钮

**用户故事：** 作为手机用户，我希望通过浮动按钮快速执行新建操作，以便减少操作步骤。

#### 验收标准

1. WHEN 屏幕宽度小于 768px 时，THE 预订列表页和工单列表页 SHALL 在右下角显示 FAB 用于新建操作
2. THE FAB SHALL 具有不小于 56px 的直径，使用主色调背景和白色加号图标
3. THE FAB SHALL 固定定位在视口右下角，距离底部导航栏上方不小于 16px
4. WHEN 用户点击 FAB 时，THE App_Shell SHALL 导航到对应的新建表单页面
5. WHEN 屏幕宽度大于等于 768px 时，THE App_Shell SHALL 隐藏 FAB，使用页面顶部的新建按钮

### 需求 10：移动端筛选器优化

**用户故事：** 作为手机用户，我希望筛选器不占用过多屏幕空间，以便在小屏幕上有更多空间查看数据。

#### 验收标准

1. WHEN 屏幕宽度小于 768px 时，THE 列表页筛选器 SHALL 默认收起，显示为一个带图标的"筛选"按钮
2. WHEN 用户点击筛选按钮时，THE 筛选器 SHALL 以底部抽屉或下拉面板形式展开，显示所有筛选选项
3. THE 筛选器展开面板 SHALL 包含"应用"和"重置"按钮
4. WHEN 有筛选条件激活时，THE 筛选按钮 SHALL 显示一个数字角标指示当前激活的筛选条件数量
5. WHEN 屏幕宽度大于等于 768px 时，THE 筛选器 SHALL 以传统的水平排列形式直接显示在页面上

### 需求 11：Toast 通知与确认对话框优化

**用户故事：** 作为手机用户，我希望通知和确认对话框在手机上显示合理且易于操作。

#### 验收标准

1. THE Toast 通知 SHALL 在移动端显示在屏幕顶部，宽度占满屏幕（左右留 16px 边距），字体不小于 0.875rem
2. THE 确认对话框 SHALL 在移动端以底部弹出面板形式显示，按钮占满宽度且高度不小于 48px
3. THE 确认对话框的操作按钮 SHALL 纵向排列，主要操作在上，取消操作在下
4. THE Toast 通知 SHALL 包含对应类型的图标（成功用勾选、错误用叉号、警告用感叹号）

### 需求 12：管理员功能入口优化

**用户故事：** 作为管理员，我希望在手机上方便地访问管理功能（房间管理、报表、配置、用户管理），以便在移动端完成管理操作。

#### 验收标准

1. WHEN 当前用户角色为管理员时，THE Bottom_Nav SHALL 显示"更多"标签项
2. WHEN 管理员点击"更多"标签时，THE App_Shell SHALL 显示管理功能菜单，包含房间管理、报表、系统配置、用户管理四个入口
3. THE 管理功能菜单 SHALL 以网格或列表形式展示，每个入口包含图标和中文标签
4. WHEN 当前用户角色为普通用户时，THE Bottom_Nav SHALL 隐藏"更多"标签项，仅显示日历、预订、工单、个人四个标签
