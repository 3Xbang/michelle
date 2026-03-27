# Requirements Document

## Introduction

本功能在现有别墅 PMS（hotel.miraa.asia，路径 /mira/）中新增两个独立模块：**预售房源管理**和**销售 CRM**。

现有系统已有出租房源（Rental）模块，新模块与其并列，专门管理待售房产的销售流程，包括：房源录入、客户档案、看房记录、购买意向跟进、销售员业绩统计，以及跟进提醒。

客户可通过公开网页（无需登录）提交购买意向表单，销售员在内部系统中管理全流程。

---

## Glossary

- **Sales_Property**: 预售房源，待出售的房产单元（区别于出租房源 Room）
- **Customer**: 客户，有购房意向的潜在买家
- **Salesperson**: 销售员，系统内部用户（role = 'Staff' 或 'Admin'），负责跟进客户
- **Viewing_Record**: 看房记录，记录某客户在某时间由某销售员带看某套房源
- **Purchase_Intent**: 购买意向，记录某客户对某套房源的意向热度及跟进历史
- **Follow_Up**: 跟进记录，每次联系客户的时间和备注
- **Intent_Level**: 意向热度，分为：冷（cold）/ 温（warm）/ 热（hot）/ 签约（signed）
- **Lead_Source**: 客户来源，如：自然到访、朋友介绍、线上广告、中介等
- **Public_Form**: 公开购买意向表单，无需登录即可访问的网页
- **PMS**: 物业管理系统（Property Management System），即现有的 hotel.miraa.asia 系统
- **Ad_Material**: 广告素材，基于某套房源创建的推广内容，包含标题、描述文案、标签和选用照片
- **Ad_Status**: 广告状态，分为：草稿（draft）/ 已发布（published）/ 已暂停（paused）
- **Cover_Photo**: 封面图，房源照片中被指定为主展示图的一张
- **Owner_Info**: 房主信息，外来房源（委托销售）的房主姓名和联系方式
- **Follow_Up_Threshold**: 跟进提醒阈值，超过该天数未跟进则触发提醒，默认 7 天，Admin 可在系统设置中修改

---

## Requirements

### Requirement 1: 预售房源管理

**User Story:** 作为销售员，我希望能录入和管理预售房源信息，以便向客户展示可售房产并追踪销售状态。

#### Acceptance Criteria

1. THE Sales_Property_Module SHALL 支持录入以下字段：名称、户型、建筑面积（㎡）、售价（元）、楼层、朝向、房源类型（自有/外来）、状态（可售/已预订/已售）、照片（多张）、备注。
2. WHEN 销售员提交新增房源表单时，THE Sales_Property_Module SHALL 验证名称、户型、面积、售价为必填项，并在缺失时返回具体字段的错误提示。
3. WHEN 销售员提交房源时，THE Sales_Property_Module SHALL 将房源保存至数据库并在列表中立即显示。
4. WHEN 销售员编辑已有房源时，THE Sales_Property_Module SHALL 保存修改并更新 updated_at 时间戳。
5. WHEN 销售员删除房源时，THE Sales_Property_Module SHALL 要求二次确认，确认后将房源标记为已删除（软删除），不物理删除数据。
6. THE Sales_Property_Module SHALL 在房源列表中支持按状态（可售/已预订/已售）筛选。
7. THE Sales_Property_Module SHALL 在房源列表中支持按房源类型（自有/外来）筛选。
8. WHEN 销售员上传房源照片时，THE Sales_Property_Module SHALL 接受 JPG/PNG 格式、单张不超过 5MB 的图片，并存储至服务器 uploads 目录。
9. IF 照片上传失败，THEN THE Sales_Property_Module SHALL 返回错误提示，并保留已上传的其他照片不受影响。
10. WHEN 销售员管理房源照片时，THE Sales_Property_Module SHALL 支持通过拖拽调整照片排列顺序，并将顺序持久化保存。
11. WHEN 销售员指定封面图时，THE Sales_Property_Module SHALL 将选定照片标记为 Cover_Photo，并在房源列表和详情页优先展示该照片。
12. WHEN 销售员删除单张照片时，THE Sales_Property_Module SHALL 要求二次确认后删除该照片，并在该照片为 Cover_Photo 时自动将排序第一的照片设为新封面图。
13. WHERE 房源类型为外来时，THE Sales_Property_Module SHALL 要求录入 Owner_Info（房主姓名和联系方式），并在房源详情页显示该信息。
14. WHEN 某套房源的意向热度被更新为"签约"（Intent_Level = 'signed'）时，THE Sales_Property_Module SHALL 自动将该房源状态更新为"已售"。

---

### Requirement 2: 客户档案管理

**User Story:** 作为销售员，我希望能录入和管理客户信息，以便建立完整的客户档案并追踪购房需求。

#### Acceptance Criteria

1. THE Customer_Module SHALL 支持录入以下字段：姓名、手机号、微信号（选填）、预算范围（最低/最高，元）、需求偏好（文本，选填）、客户来源（Lead_Source）、负责销售员、备注。
2. WHEN 销售员提交新增客户表单时，THE Customer_Module SHALL 验证姓名和手机号为必填项，并在缺失时返回具体字段的错误提示。
3. WHEN 销售员提交客户信息时，THE Customer_Module SHALL 将客户保存至数据库并在列表中立即显示。
4. THE Customer_Module SHALL 在客户列表中支持按负责销售员筛选。
5. THE Customer_Module SHALL 在客户列表中支持按客户来源筛选。
6. THE Customer_Module SHALL 在客户列表中支持按姓名或手机号关键词搜索。
7. WHEN 销售员编辑客户信息时，THE Customer_Module SHALL 保存修改并更新 updated_at 时间戳。
8. WHILE 用户角色为 Staff 时，THE Customer_Module SHALL 仅显示该销售员负责的客户。
9. WHILE 用户角色为 Admin 时，THE Customer_Module SHALL 显示所有销售员的客户。

---

### Requirement 3: 公开购买意向表单

**User Story:** 作为潜在买家，我希望能通过公开网页提交购买意向，以便销售员联系我，而无需注册账号。

#### Acceptance Criteria

1. THE Public_Form SHALL 在无需登录的情况下可访问，路径为 /mira/sales/inquiry。
2. THE Public_Form SHALL 包含以下字段：姓名（必填）、手机号（必填）、微信号（选填）、预算范围（选填）、感兴趣的房源（可多选，选填）、需求备注（选填）。
3. WHEN 访客提交表单时，THE Public_Form SHALL 验证姓名和手机号不为空，并在缺失时在对应字段下方显示错误提示。
4. WHEN 访客成功提交表单时，THE Public_Form SHALL 在数据库中创建客户记录（来源标记为"网络表单"，状态设为"待分配"），并向访客显示"提交成功，我们将尽快联系您"的确认信息。
5. WHEN 管理员查看待分配客户列表时，THE Public_Form SHALL 显示所有状态为"待分配"的客户，Admin 可手动将其分配给指定销售员，分配后客户状态更新为正常并关联对应销售员。
6. IF 表单提交失败（网络错误或服务器错误），THEN THE Public_Form SHALL 显示"提交失败，请稍后重试"的错误提示，并保留用户已填写的内容。
7. THE Public_Form SHALL 对同一手机号在 10 分钟内的重复提交进行限流，超出后返回提示"提交过于频繁，请稍后再试"。

---

### Requirement 4: 看房记录管理

**User Story:** 作为销售员，我希望能记录客户的看房情况，以便从房源和客户两个维度追踪看房历史。

#### Acceptance Criteria

1. THE Viewing_Record_Module SHALL 支持录入以下字段：客户（关联 Customer）、房源（关联 Sales_Property）、看房时间（日期+时间）、带看销售员（关联 Salesperson）、备注（选填）。
2. WHEN 销售员提交看房记录时，THE Viewing_Record_Module SHALL 验证客户、房源、看房时间、带看销售员为必填项。
3. WHEN 销售员查看某套房源详情时，THE Viewing_Record_Module SHALL 显示该房源的所有看房记录，按看房时间倒序排列。
4. WHEN 销售员查看某个客户详情时，THE Viewing_Record_Module SHALL 显示该客户的所有看房记录，按看房时间倒序排列。
5. WHEN 销售员编辑看房记录时，THE Viewing_Record_Module SHALL 保存修改并更新 updated_at 时间戳。
6. WHEN 销售员删除看房记录时，THE Viewing_Record_Module SHALL 要求二次确认后执行软删除。

---

### Requirement 5: 购买意向管理

**User Story:** 作为销售员，我希望能记录和管理客户对房源的购买意向及跟进历史，以便优先跟进高意向客户。

#### Acceptance Criteria

1. THE Purchase_Intent_Module SHALL 支持为某客户对某房源创建意向记录，包含字段：客户、房源、意向热度（Intent_Level：冷/温/热/签约）、负责销售员、备注。
2. WHEN 销售员更新意向热度时，THE Purchase_Intent_Module SHALL 保存新的热度值并记录变更时间。
3. THE Purchase_Intent_Module SHALL 支持在意向记录下添加跟进记录（Follow_Up），每条跟进记录包含：跟进时间、跟进内容、操作销售员。
4. WHEN 销售员查看房源维度时，THE Purchase_Intent_Module SHALL 显示对该房源有意向的所有客户列表，并按意向热度降序排列（签约 > 热 > 温 > 冷）。
5. WHEN 销售员查看客户维度时，THE Purchase_Intent_Module SHALL 显示该客户有意向的所有房源列表，并按意向热度降序排列。
6. THE Purchase_Intent_Module SHALL 支持按意向热度筛选意向列表。
7. THE Purchase_Intent_Module SHALL 支持按负责销售员筛选意向列表。
8. WHILE 用户角色为 Staff 时，THE Purchase_Intent_Module SHALL 仅显示该销售员负责的意向记录。
9. WHILE 用户角色为 Admin 时，THE Purchase_Intent_Module SHALL 显示所有销售员的意向记录。

---

### Requirement 6: 销售员业绩统计

**User Story:** 作为管理员，我希望能查看各销售员的业绩数据，以便评估销售团队的工作效果。

#### Acceptance Criteria

1. THE Sales_Report_Module SHALL 为每位销售员统计以下指标：带看数（Viewing_Record 数量）、意向数（Purchase_Intent 数量，不含冷意向）、签约数（Intent_Level = 'signed' 的数量）。
2. THE Sales_Report_Module SHALL 支持按时间范围（开始日期至结束日期）筛选统计数据。
3. WHEN Admin 查看业绩统计时，THE Sales_Report_Module SHALL 显示所有销售员的汇总数据。
4. WHEN Staff 查看业绩统计时，THE Sales_Report_Module SHALL 仅显示该销售员自己的数据。
5. THE Sales_Report_Module SHALL 在统计页面以表格形式展示各销售员的三项指标，并支持按任意指标排序。

---

### Requirement 7: 跟进提醒

**User Story:** 作为销售员，我希望系统能提醒我哪些客户长时间未跟进，以便及时维护客户关系。

#### Acceptance Criteria

1. THE Reminder_Module SHALL 在销售员登录后的首页或 CRM 模块入口处，显示"待跟进客户"列表。
2. THE Reminder_Module SHALL 将超过 Follow_Up_Threshold 天数未添加跟进记录（Follow_Up）的活跃意向客户（Intent_Level 为温或热）标记为"待跟进"。
3. WHEN 销售员查看待跟进列表时，THE Reminder_Module SHALL 显示客户姓名、最后跟进时间、距今天数、意向热度，并按距今天数降序排列。
4. WHILE 用户角色为 Staff 时，THE Reminder_Module SHALL 仅显示该销售员负责的待跟进客户。
5. WHILE 用户角色为 Admin 时，THE Reminder_Module SHALL 显示所有销售员的待跟进客户，并标注负责销售员姓名。
6. THE Reminder_Module SHALL 默认使用 7 天作为 Follow_Up_Threshold。
7. WHERE Admin 在系统设置中修改了 Follow_Up_Threshold 时，THE Reminder_Module SHALL 使用新配置的天数替代默认值，并对所有销售员生效。

---

### Requirement 8: 数据完整性与权限控制

**User Story:** 作为系统管理员，我希望销售 CRM 数据有完整的权限控制，以防止销售员越权访问他人数据。

#### Acceptance Criteria

1. WHEN 未登录用户访问 CRM 内部页面时，THE Auth_Module SHALL 重定向至登录页面 /mira/login。
2. WHEN Staff 角色用户尝试访问其他销售员的客户详情时，THE Auth_Module SHALL 返回 403 错误。
3. WHEN Staff 角色用户尝试修改其他销售员的意向记录时，THE Auth_Module SHALL 返回 403 错误。
4. THE Sales_Property_Module SHALL 允许所有已登录用户（Admin 和 Staff）查看房源列表和详情。
5. WHEN Staff 角色用户尝试删除房源时，THE Sales_Property_Module SHALL 返回 403 错误，仅 Admin 可删除房源。
6. IF 数据库操作失败，THEN THE System SHALL 回滚事务并返回包含错误描述的 500 响应，不暴露数据库内部错误信息。

---

### Requirement 9: 广告素材管理

**User Story:** 作为销售员，我希望能为每套房源创建广告素材并预览效果，以便快速生成推广内容并分发给潜在买家。

#### Acceptance Criteria

1. THE Ad_Material_Module SHALL 支持为某套 Sales_Property 创建 Ad_Material，包含以下字段：标题（必填）、描述文案（必填）、标签/卖点（多个，选填）、选用照片（从该房源已上传照片中多选）、Ad_Status（默认为草稿）。
2. WHEN 销售员提交新增广告素材时，THE Ad_Material_Module SHALL 验证标题和描述文案为必填项，并在缺失时返回具体字段的错误提示。
3. WHEN 销售员保存广告素材时，THE Ad_Material_Module SHALL 将其保存至数据库并关联对应房源，初始 Ad_Status 为草稿（draft）。
4. THE Ad_Material_Module SHALL 支持将 Ad_Status 在草稿（draft）、已发布（published）、已暂停（paused）之间切换，并记录状态变更时间。
5. WHEN 销售员查看广告预览时，THE Ad_Material_Module SHALL 以模拟 Facebook 帖子的样式展示广告素材，包含标题、描述文案、标签和选用照片。
6. WHEN 销售员点击"复制文案"时，THE Ad_Material_Module SHALL 将标题和描述文案拼接后写入系统剪贴板，并显示"已复制"的操作反馈。
7. WHEN 销售员点击"批量下载图片"时，THE Ad_Material_Module SHALL 将该广告素材选用的所有照片打包为 ZIP 文件并触发浏览器下载，ZIP 文件名包含房源名称和广告标题。
8. IF 批量下载时选用照片数量为零，THEN THE Ad_Material_Module SHALL 显示"请先选择至少一张照片"的错误提示，不触发下载。
9. THE Ad_Material_Module SHALL 在数据结构中预留 facebook_ad_id、facebook_campaign_id、facebook_ad_account_id 字段，以支持未来接入 Facebook Marketing API，当前阶段这些字段允许为空。
10. WHEN 销售员查看某套房源的广告素材列表时，THE Ad_Material_Module SHALL 显示该房源下所有 Ad_Material，并支持按 Ad_Status 筛选。
11. WHEN 销售员删除广告素材时，THE Ad_Material_Module SHALL 要求二次确认后执行软删除，不物理删除数据。
