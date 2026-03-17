# 需求文档：泰国别墅物业管理系统（Villa PMS）重建

## 简介

Villa PMS 是一套面向泰国清迈/普吉地区别墅物业管理的 Web 应用系统。系统管理 17 个物业单元，支持订单管理、房态日历、工单维修、财务报表、房源管理等核心功能。本次为全量重建，从 uni-app 移动端架构迁移至纯 Web 应用（Vue 3 + Vite 前端 + Node.js/Express 后端），部署于 AWS EC2，使用自建 PostgreSQL 数据库和 JWT 认证。系统支持中英文双语，预留泰语扩展。

## 术语表

- **Villa_PMS**：泰国别墅物业管理系统，本文档的目标系统
- **管理员（Admin）**：拥有系统全部权限的用户角色，可访问报表、配置等管理功能
- **员工（Staff）**：拥有日常操作权限的用户角色，不可访问报表和系统配置
- **房源（Room）**：系统管理的物业单元，包含别墅(villa)、民宿(homestay)、公寓(apartment)三种类型
- **订单（Booking）**：客人对房源的预订记录，包含入住/退房日期、收入等信息
- **工单（Ticket）**：物业维修/维护任务记录，包含问题类型、优先级、状态等
- **房态日历（Calendar_Dashboard）**：以月视图日历形式展示各房源订单占用情况的仪表盘
- **平台来源（Platform_Source）**：订单来源渠道，包括 Airbnb、Agoda、Booking.com 等 12 个平台
- **租期类型（Rental_Type）**：订单的租赁周期类型，包括日租(daily)、月租(monthly)、年租(yearly)
- **净收入（Net_Income）**：总收入减去平台佣金后的实际收入
- **JWT**：JSON Web Token，用于用户身份认证的令牌机制
- **API_Server**：Villa_PMS 的 Node.js/Express 后端服务
- **Web_Client**：Villa_PMS 的 Vue 3 前端应用
- **系统标签（System_Label）**：用于国际化的多语言标签配置
- **功能开关（Feature_Switch）**：系统配置中用于启用/禁用特定功能的开关项

## 需求

### 需求 1：用户认证

**用户故事：** 作为系统用户，我希望通过邮箱和密码安全登录系统，以便访问物业管理功能。

#### 验收标准

1. WHEN 用户提交有效的邮箱和密码, THE API_Server SHALL 验证凭据并返回包含用户角色和语言偏好的 JWT 令牌
2. WHEN 用户提交无效的邮箱或密码, THE API_Server SHALL 返回 401 状态码和错误提示信息
3. WHEN 用户携带有效 JWT 令牌发起请求, THE API_Server SHALL 允许访问受保护的 API 端点
4. WHEN JWT 令牌过期或无效, THE API_Server SHALL 返回 401 状态码并引导用户重新登录
5. WHEN 用户点击登出, THE Web_Client SHALL 清除本地存储的 JWT 令牌并跳转至登录页面
6. THE API_Server SHALL 使用 bcrypt 对用户密码进行哈希存储
7. WHEN 系统初始化, THE API_Server SHALL 创建默认管理员账户（admin@villapms.com）

### 需求 2：用户管理

**用户故事：** 作为管理员，我希望管理系统用户账户，以便控制团队成员的系统访问权限。

#### 验收标准

1. WHEN 管理员创建新用户, THE API_Server SHALL 存储用户的姓名、邮箱、角色(Admin/Staff)、语言偏好(CN/EN)和手机号
2. WHEN 管理员修改用户角色, THE API_Server SHALL 更新用户角色并在下次请求时生效
3. THE API_Server SHALL 确保邮箱地址在用户表中唯一
4. WHEN 员工尝试访问用户管理功能, THE API_Server SHALL 返回 403 状态码拒绝访问

### 需求 3：权限控制

**用户故事：** 作为系统管理员，我希望不同角色拥有不同的访问权限，以便保护敏感数据和管理功能。

#### 验收标准

1. WHILE 用户角色为 Admin, THE Web_Client SHALL 显示所有功能模块（房态日历、订单管理、工单管理、房源管理、财务报表、系统配置、用户管理、个人中心）
2. WHILE 用户角色为 Staff, THE Web_Client SHALL 隐藏财务报表、系统配置和用户管理模块的导航入口
3. WHEN 员工尝试通过 URL 直接访问受限页面, THE Web_Client SHALL 重定向至房态日历页面
4. THE API_Server SHALL 在每个受保护的 API 端点验证用户角色权限
5. WHEN 员工尝试调用管理员专属 API, THE API_Server SHALL 返回 403 状态码

### 需求 4：房源管理

**用户故事：** 作为管理员，我希望管理所有物业单元的信息，以便维护准确的房源数据。

#### 验收标准

1. THE Web_Client SHALL 以列表形式展示所有房源，包含房源名称、类型、日基础房价和状态
2. WHEN 管理员编辑房源信息, THE API_Server SHALL 更新房源的中文名称、英文名称、房源类型(villa/homestay/apartment)、日基础房价和状态(active/maintenance)
3. THE API_Server SHALL 保留房源的 room_group_id 和 auto_assign 字段供未来扩展
4. WHEN 房源状态设为 maintenance, THE Web_Client SHALL 在房态日历中以灰色标识该房源
5. WHEN 管理员新增房源, THE API_Server SHALL 验证房源名称不为空且日基础房价大于零

### 需求 5：房态日历仪表盘

**用户故事：** 作为物业管理人员，我希望通过日历视图直观查看各房源的订单占用情况，以便快速掌握整体房态。

#### 验收标准

1. THE Calendar_Dashboard SHALL 以月视图日历形式展示所有 active 状态房源的订单占用情况
2. WHEN 用户点击前/后月份切换按钮, THE Calendar_Dashboard SHALL 加载并展示对应月份的房态数据
3. THE Calendar_Dashboard SHALL 用不同颜色区分订单状态：pending（黄色）、checked_in（绿色）、checked_out（灰色）
4. WHEN 用户点击日历中的订单色块, THE Web_Client SHALL 弹出订单摘要浮层，显示客人姓名、入住/退房日期、平台来源和订单状态
5. WHEN 用户点击订单摘要浮层中的"查看详情", THE Web_Client SHALL 跳转至该订单的详情页面
6. THE Calendar_Dashboard SHALL 在日历左侧纵向排列所有房源名称，每行对应一个房源的日期占用条
7. WHEN 页面加载完成, THE Calendar_Dashboard SHALL 默认展示当前月份的房态数据

### 需求 6：订单管理

**用户故事：** 作为物业管理人员，我希望创建和管理客人的预订订单，以便跟踪所有房源的预订情况和收入。

#### 验收标准

1. THE Web_Client SHALL 以列表形式展示所有订单，支持按房源、订单状态、平台来源和日期范围筛选
2. WHEN 用户创建新订单, THE API_Server SHALL 存储房源ID、客人姓名、入住日期、退房日期、租期类型(daily/monthly/yearly)、平台来源、总收入、佣金和订单状态
3. WHEN 用户创建新订单, THE API_Server SHALL 自动计算净收入（净收入 = 总收入 - 佣金）
4. WHEN 新订单的入住/退房日期与同一房源的已有订单存在重叠, THE API_Server SHALL 拒绝创建并返回日期冲突的错误提示
5. THE API_Server SHALL 支持订单状态按 pending → checked_in → checked_out 的顺序流转
6. WHEN 用户尝试将订单状态跳过中间状态直接流转（如 pending 直接到 checked_out）, THE API_Server SHALL 拒绝操作并返回状态流转错误
7. WHEN 用户查看订单详情, THE Web_Client SHALL 展示订单的全部字段信息，包含创建人、净收入计算结果
8. THE API_Server SHALL 保留 external_order_id、raw_email_content 和 currency 字段供未来扩展
9. THE API_Server SHALL 支持以下 12 个平台来源：Airbnb、Agoda、Booking.com、Trip.com/携程、途家、小猪、美团民宿、飞猪、Expedia、VRBO、直客、其他
10. WHEN 用户编辑已有订单, THE API_Server SHALL 重新执行日期冲突检测（排除当前订单自身）

### 需求 7：工单管理

**用户故事：** 作为物业管理人员，我希望创建和跟踪维修工单，以便及时处理物业维护问题。

#### 验收标准

1. THE Web_Client SHALL 以列表形式展示所有工单，支持按状态(pending/completed)和问题类型筛选
2. WHEN 用户创建新工单, THE API_Server SHALL 存储关联房源ID、问题类型(plumbing/furniture/cleaning/network/other)、问题描述、优先级(urgent/normal)和图片
3. WHEN 用户上传工单图片, THE API_Server SHALL 将图片存储至服务器文件系统并记录图片 URL 列表
4. WHEN 管理员标记工单为已完成, THE API_Server SHALL 更新工单状态为 completed 并记录完成时间
5. WHEN 员工尝试标记工单为已完成, THE API_Server SHALL 返回 403 状态码拒绝操作
6. THE Web_Client SHALL 在工单列表中以红色标签标识 urgent 优先级的工单
7. WHEN 用户查看工单详情, THE Web_Client SHALL 展示工单的全部信息，包含上传的图片预览

### 需求 8：财务报表

**用户故事：** 作为管理员，我希望查看多维度的财务统计报表，以便分析物业经营状况和收入趋势。

#### 验收标准

1. THE Web_Client SHALL 提供按房源、租期类型、平台来源、月份四个维度的财务数据聚合视图
2. WHEN 管理员选择按房源维度查看, THE Web_Client SHALL 展示每个房源的总收入、总佣金和总净收入
3. WHEN 管理员选择按租期类型维度查看, THE Web_Client SHALL 展示日租/月租/年租各类型的总收入、总佣金和总净收入
4. WHEN 管理员选择按平台来源维度查看, THE Web_Client SHALL 展示每个平台的总收入、总佣金和总净收入
5. WHEN 管理员选择按月份维度查看, THE Web_Client SHALL 展示每月的总收入、总佣金和总净收入
6. WHEN 管理员点击导出按钮, THE API_Server SHALL 生成当前报表视图的 CSV 文件并返回下载
7. THE API_Server SHALL 支持按周和按月两种时间粒度导出 CSV 报表
8. WHEN 员工尝试访问财务报表 API, THE API_Server SHALL 返回 403 状态码拒绝访问
9. THE Web_Client SHALL 在报表页面展示数据汇总行，显示所有记录的合计值

### 需求 9：系统配置管理

**用户故事：** 作为管理员，我希望管理系统配置项和功能开关，以便灵活控制系统行为。

#### 验收标准

1. THE Web_Client SHALL 以列表形式展示所有系统配置项，包含配置键、配置值、功能开关状态和最后更新时间
2. WHEN 管理员修改配置项, THE API_Server SHALL 更新配置值和功能开关状态，并记录更新时间
3. WHEN 管理员新增配置项, THE API_Server SHALL 验证配置键在配置表中唯一
4. WHEN 功能开关设为关闭, THE Web_Client SHALL 隐藏对应功能的界面入口
5. WHEN 员工尝试访问系统配置 API, THE API_Server SHALL 返回 403 状态码拒绝访问

### 需求 10：国际化多语言支持

**用户故事：** 作为系统用户，我希望在中文和英文之间切换界面语言，以便使用自己熟悉的语言操作系统。

#### 验收标准

1. THE Web_Client SHALL 支持中文(zh-CN)和英文(en-US)两种界面语言
2. WHEN 用户切换语言, THE Web_Client SHALL 立即更新所有界面文本为目标语言，无需刷新页面
3. WHEN 用户切换语言, THE API_Server SHALL 更新该用户的语言偏好设置
4. WHEN 用户登录, THE Web_Client SHALL 根据用户存储的语言偏好自动设置界面语言
5. THE API_Server SHALL 通过系统标签表(system_labels)管理所有多语言文本，包含 label_key、label_cn、label_en 和预留的 label_th 字段
6. THE Web_Client SHALL 对房源名称同时展示中文名称和英文名称

### 需求 11：个人中心

**用户故事：** 作为系统用户，我希望查看和修改个人信息，以便维护自己的账户资料。

#### 验收标准

1. THE Web_Client SHALL 展示当前登录用户的姓名、邮箱、角色、手机号和语言偏好
2. WHEN 用户修改个人信息（姓名、手机号、语言偏好）, THE API_Server SHALL 更新用户记录
3. WHEN 用户修改密码, THE API_Server SHALL 验证旧密码正确后更新为新密码的 bcrypt 哈希值
4. WHEN 用户提交的旧密码不正确, THE API_Server SHALL 返回 400 状态码和错误提示

### 需求 12：响应式 Web 布局

**用户故事：** 作为系统用户，我希望在桌面电脑、平板和手机上都能正常使用系统，以便在不同设备上管理物业。

#### 验收标准

1. THE Web_Client SHALL 支持三种视口断点：桌面端（宽度 >= 1024px）、平板端（768px <= 宽度 < 1024px）、移动端（宽度 < 768px）
2. WHILE 视口宽度 >= 1024px, THE Web_Client SHALL 展示侧边栏导航和完整的内容区域
3. WHILE 视口宽度 < 1024px, THE Web_Client SHALL 将侧边栏收起为汉堡菜单
4. THE Calendar_Dashboard SHALL 在移动端视口下支持水平滚动以展示完整的月视图日历
5. THE Web_Client SHALL 确保所有表单在移动端视口下以单列布局展示
6. THE Web_Client SHALL 确保所有数据表格在移动端视口下支持水平滚动

### 需求 13：API 安全防护

**用户故事：** 作为系统管理员，我希望 API 具备安全防护机制，以便防止恶意攻击和未授权访问。

#### 验收标准

1. THE API_Server SHALL 对所有受保护端点要求有效的 JWT 令牌
2. THE API_Server SHALL 对登录接口实施速率限制，同一 IP 地址在 15 分钟内最多允许 10 次失败尝试
3. WHEN 同一 IP 超过登录失败次数限制, THE API_Server SHALL 返回 429 状态码并提示剩余等待时间
4. THE API_Server SHALL 对所有用户输入进行参数校验和 SQL 注入防护
5. THE API_Server SHALL 在响应头中设置 CORS 策略，仅允许指定域名的跨域请求
6. THE API_Server SHALL 对所有 API 请求和错误记录结构化日志，包含时间戳、请求路径、用户ID和响应状态码
7. IF API_Server 发生未捕获异常, THEN THE API_Server SHALL 返回 500 状态码和通用错误消息，不暴露内部错误详情

### 需求 14：统一错误处理

**用户故事：** 作为系统用户，我希望在操作出错时看到清晰的错误提示，以便理解问题并采取正确的操作。

#### 验收标准

1. THE API_Server SHALL 使用统一的错误响应格式：包含 error_code（字符串错误码）、message（用户可读的错误描述）和 details（可选的详细信息）
2. WHEN API 返回错误响应, THE Web_Client SHALL 以 Toast 通知形式展示错误消息
3. WHEN 网络请求失败（无响应）, THE Web_Client SHALL 展示"网络连接失败，请检查网络"的提示
4. THE API_Server SHALL 对所有 400 系列错误返回具体的业务错误码（如 BOOKING_DATE_CONFLICT、INVALID_STATUS_TRANSITION）
5. WHEN API 返回 401 状态码, THE Web_Client SHALL 自动清除登录状态并跳转至登录页面

### 需求 15：数据库设计

**用户故事：** 作为开发者，我希望系统使用结构清晰的 PostgreSQL 数据库，以便高效存储和查询物业管理数据。

#### 验收标准

1. THE API_Server SHALL 使用自建 PostgreSQL 数据库，包含以下六张核心表：users、rooms、bookings、tickets、system_labels、config
2. THE API_Server SHALL 在 users 表中存储：id(主键)、name、email(唯一)、password_hash、role(Admin/Staff)、preferred_lang(CN/EN)、phone、created_at、updated_at
3. THE API_Server SHALL 在 rooms 表中存储：id(主键)、room_name_cn、room_name_en、room_type(villa/homestay/apartment)、room_group_id(预留)、auto_assign(预留)、base_daily_rate、status(active/maintenance)、created_at、updated_at
4. THE API_Server SHALL 在 bookings 表中存储：id(主键)、room_id(外键)、created_by(外键)、guest_name、check_in、check_out、rental_type(daily/monthly/yearly)、platform_source、total_revenue、commission、net_income、external_order_id(预留)、raw_email_content(预留)、currency(预留)、booking_status(pending/checked_in/checked_out)、created_at、updated_at
5. THE API_Server SHALL 在 tickets 表中存储：id(主键)、room_id(外键)、created_by(外键)、issue_type(plumbing/furniture/cleaning/network/other)、description、priority(urgent/normal)、ticket_status(pending/completed)、photo_urls(JSON数组)、completed_at、created_at、updated_at
6. THE API_Server SHALL 在 system_labels 表中存储：id(主键)、label_key(唯一)、label_cn、label_en、label_th(预留)、category
7. THE API_Server SHALL 在 config 表中存储：id(主键)、config_key(唯一)、config_value、feature_switch(布尔)、updated_at
8. THE API_Server SHALL 对 bookings 表的 room_id 和 check_in/check_out 字段建立索引以优化日期冲突查询性能
9. THE API_Server SHALL 使用数据库迁移脚本管理表结构变更

### 需求 16：EC2 部署架构

**用户故事：** 作为系统管理员，我希望系统部署在 AWS EC2 上，以便获得稳定可控的运行环境。

#### 验收标准

1. THE Villa_PMS SHALL 部署于 AWS EC2 实例，前端静态文件由 Nginx 提供服务
2. THE API_Server SHALL 作为 Node.js 进程运行，由 PM2 进程管理器管理
3. THE Villa_PMS SHALL 使用 Nginx 作为反向代理，将 API 请求转发至 Node.js 后端
4. THE Villa_PMS SHALL 将上传的图片文件存储在 EC2 实例的指定目录中，由 Nginx 提供静态文件访问
5. THE API_Server SHALL 通过环境变量读取数据库连接信息、JWT 密钥和其他敏感配置
6. THE Villa_PMS SHALL 提供数据库备份脚本，支持定时自动备份 PostgreSQL 数据

### 需求 17：订单列表排序与分页

**用户故事：** 作为物业管理人员，我希望订单列表支持排序和分页，以便在大量订单中快速找到目标记录。

#### 验收标准

1. THE API_Server SHALL 对订单列表 API 支持分页参数（page 和 page_size），默认每页 20 条
2. THE API_Server SHALL 在分页响应中返回总记录数和总页数
3. WHEN 用户点击表头列名, THE Web_Client SHALL 按该列升序/降序切换排序
4. THE API_Server SHALL 支持按入住日期、退房日期、创建时间、总收入字段排序
5. THE Web_Client SHALL 在列表底部展示分页控件，包含页码导航和每页条数选择

### 需求 18：数据验证

**用户故事：** 作为系统用户，我希望系统对输入数据进行严格验证，以便防止无效数据进入系统。

#### 验收标准

1. WHEN 用户提交订单, THE API_Server SHALL 验证退房日期晚于入住日期
2. WHEN 用户提交订单, THE API_Server SHALL 验证总收入和佣金为非负数值
3. WHEN 用户提交订单, THE API_Server SHALL 验证平台来源属于 12 个预定义选项之一
4. WHEN 用户提交房源信息, THE API_Server SHALL 验证房源类型属于 villa/homestay/apartment 之一
5. WHEN 用户提交工单, THE API_Server SHALL 验证问题类型属于 plumbing/furniture/cleaning/network/other 之一
6. WHEN 数据验证失败, THE API_Server SHALL 返回 400 状态码和具体的字段级错误信息
7. THE Web_Client SHALL 在表单提交前执行前端数据验证，并在对应字段下方展示验证错误提示
8. FOR ALL 订单记录, 解析净收入再格式化后解析 SHALL 产生等价的数值（净收入计算的幂等性验证：net_income = total_revenue - commission）
