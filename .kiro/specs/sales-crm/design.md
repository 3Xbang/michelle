# Design Document: Sales CRM

## Overview

在现有别墅 PMS（hotel.miraa.asia，路径 `/mira/`）中新增 **Sales CRM** 模块，与现有出租（Rental）模块并列。该模块涵盖预售房源管理、客户档案、看房记录、购买意向跟进、销售员业绩统计、跟进提醒和广告素材管理，并提供一个无需登录的公开购买意向表单。

技术栈与现有系统保持一致：
- 后端：Node.js + Express + PostgreSQL
- 前端：Vue 3 + Vite + Vue Router + Pinia
- 认证：JWT，存储于 localStorage
- 文件上传：复用现有 `/api/upload` 路由，扩展权限至 Staff

---

## Architecture

```mermaid
graph TD
    subgraph 前端 Vue 3
        A[AppLayout + Sidebar] --> B[Sales CRM 路由组]
        B --> B1[SalesPropertyList/Form/Detail]
        B --> B2[CustomerList/Form/Detail]
        B --> B3[PurchaseIntentList/Detail]
        B --> B4[ViewingRecordForm]
        B --> B5[SalesReport]
        B --> B6[AdMaterialList/Form/Preview]
        B --> B7[FollowUpReminder]
        PF[PublicInquiryForm] -- 无需登录 --> API
    end

    subgraph 后端 Express
        API[/api/sales/*] --> MW[authenticate + rbac]
        MW --> SVC[Service Layer]
        SVC --> DB[(PostgreSQL)]
        PUBAPI[/api/public/inquiry] --> RATELIMIT[Rate Limiter]
        RATELIMIT --> SVC
        UPLOAD[/api/upload] --> FS[uploads/]
    end
```

### 关键设计决策

1. **复用上传路由**：照片上传复用 `/api/upload/image`，但需将权限从 `Admin only` 扩展为 `Admin + Staff`，以允许销售员上传房源照片。
2. **软删除统一模式**：所有实体（房源、客户、看房记录、意向、广告素材）均使用 `deleted_at` 字段实现软删除，查询时统一过滤 `WHERE deleted_at IS NULL`。
3. **权限中间件复用**：复用现有 `authenticate` + `rbac` 中间件，在 Service 层增加 `salesperson_id` 过滤逻辑实现 Staff 数据隔离。
4. **跟进阈值配置**：复用现有 `config` 表，key 为 `sales_followup_threshold_days`，默认值 `7`。
5. **公开表单限流**：在现有 `rateLimiter.js` 中新增按手机号限流的中间件，10 分钟内同一手机号最多提交 1 次。
6. **ZIP 下载**：后端使用 `archiver` 库打包照片，前端触发 blob 下载，避免前端依赖 JSZip 处理服务器文件路径。

---

## Components and Interfaces

### 后端路由模块

| 路由前缀 | 文件 | 说明 |
|---|---|---|
| `/api/sales/properties` | `routes/sales/properties.js` | 预售房源 CRUD + 照片管理 |
| `/api/sales/customers` | `routes/sales/customers.js` | 客户档案 CRUD |
| `/api/sales/viewing-records` | `routes/sales/viewingRecords.js` | 看房记录 CRUD |
| `/api/sales/intents` | `routes/sales/intents.js` | 购买意向 + 跟进记录 |
| `/api/sales/reports` | `routes/sales/reports.js` | 业绩统计 |
| `/api/sales/reminders` | `routes/sales/reminders.js` | 跟进提醒列表 |
| `/api/sales/ad-materials` | `routes/sales/adMaterials.js` | 广告素材 CRUD + ZIP 下载 |
| `/api/public/inquiry` | `routes/public/inquiry.js` | 公开表单（无需认证） |

### 前端页面组件

| 路由路径 | 组件 | 权限 |
|---|---|---|
| `/sales/properties` | `SalesPropertyListView` | Admin + Staff |
| `/sales/properties/new` | `SalesPropertyFormView` | Admin + Staff |
| `/sales/properties/:id` | `SalesPropertyDetailView` | Admin + Staff |
| `/sales/customers` | `CustomerListView` | Admin + Staff |
| `/sales/customers/new` | `CustomerFormView` | Admin + Staff |
| `/sales/customers/:id` | `CustomerDetailView` | Admin + Staff |
| `/sales/intents` | `PurchaseIntentListView` | Admin + Staff |
| `/sales/intents/:id` | `PurchaseIntentDetailView` | Admin + Staff |
| `/sales/reports` | `SalesReportView` | Admin + Staff |
| `/sales/ad-materials` | `AdMaterialListView` | Admin + Staff |
| `/sales/ad-materials/new` | `AdMaterialFormView` | Admin + Staff |
| `/sales/ad-materials/:id/preview` | `AdMaterialPreviewView` | Admin + Staff |
| `/sales/inquiry` | `PublicInquiryView` | 公开（无需登录） |

### Pinia Stores

- `useSalesPropertyStore` — 房源列表、当前房源、照片排序
- `useCustomerStore` — 客户列表、搜索/筛选状态
- `usePurchaseIntentStore` — 意向列表、跟进记录
- `useSalesReportStore` — 业绩统计数据
- `useAdMaterialStore` — 广告素材列表和状态

---

## Data Models

### PostgreSQL 表结构

#### `sales_properties`（预售房源）

```sql
CREATE TABLE sales_properties (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    unit_type       VARCHAR(50)  NOT NULL,          -- 户型，如 3室2厅
    area_sqm        NUMERIC(8,2) NOT NULL,           -- 建筑面积
    price           NUMERIC(12,2) NOT NULL,          -- 售价（元）
    floor           VARCHAR(20),
    orientation     VARCHAR(20),                     -- 朝向
    property_type   VARCHAR(10)  NOT NULL DEFAULT 'own'
                    CHECK (property_type IN ('own', 'external')),
    status          VARCHAR(15)  NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'reserved', 'sold')),
    owner_name      VARCHAR(100),                    -- 外来房源房主姓名
    owner_contact   VARCHAR(100),                    -- 外来房源房主联系方式
    notes           TEXT,
    created_by      INTEGER REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sales_property_photos`（房源照片）

```sql
CREATE TABLE sales_property_photos (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES sales_properties(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `customers`（客户档案）

```sql
CREATE TABLE customers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    wechat          VARCHAR(100),
    budget_min      NUMERIC(12,2),
    budget_max      NUMERIC(12,2),
    preferences     TEXT,
    lead_source     VARCHAR(30)  NOT NULL DEFAULT 'other'
                    CHECK (lead_source IN ('walk_in','referral','online_ad','agent','web_form','other')),
    salesperson_id  INTEGER REFERENCES users(id),
    assign_status   VARCHAR(15)  NOT NULL DEFAULT 'normal'
                    CHECK (assign_status IN ('pending', 'normal')),
    notes           TEXT,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `viewing_records`（看房记录）

```sql
CREATE TABLE viewing_records (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    property_id     INTEGER NOT NULL REFERENCES sales_properties(id),
    viewed_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    salesperson_id  INTEGER NOT NULL REFERENCES users(id),
    notes           TEXT,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `purchase_intents`（购买意向）

```sql
CREATE TABLE purchase_intents (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    property_id     INTEGER NOT NULL REFERENCES sales_properties(id),
    intent_level    VARCHAR(10)  NOT NULL DEFAULT 'cold'
                    CHECK (intent_level IN ('cold', 'warm', 'hot', 'signed')),
    salesperson_id  INTEGER NOT NULL REFERENCES users(id),
    notes           TEXT,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (customer_id, property_id)               -- 一个客户对一套房源只有一条意向
);
```

#### `follow_ups`（跟进记录）

```sql
CREATE TABLE follow_ups (
    id          SERIAL PRIMARY KEY,
    intent_id   INTEGER NOT NULL REFERENCES purchase_intents(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    content     TEXT NOT NULL,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `ad_materials`（广告素材）

```sql
CREATE TABLE ad_materials (
    id                      SERIAL PRIMARY KEY,
    property_id             INTEGER NOT NULL REFERENCES sales_properties(id),
    title                   VARCHAR(200) NOT NULL,
    description             TEXT NOT NULL,
    tags                    TEXT[],                  -- 标签/卖点数组
    photo_ids               INTEGER[],               -- 选用照片 id 列表（有序）
    ad_status               VARCHAR(10) NOT NULL DEFAULT 'draft'
                            CHECK (ad_status IN ('draft', 'published', 'paused')),
    status_changed_at       TIMESTAMP WITH TIME ZONE,
    facebook_ad_id          VARCHAR(100),            -- 预留 FB API 字段
    facebook_campaign_id    VARCHAR(100),
    facebook_ad_account_id  VARCHAR(100),
    created_by              INTEGER REFERENCES users(id),
    deleted_at              TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### config 表新增键

```sql
INSERT INTO config (config_key, config_value) VALUES
  ('sales_followup_threshold_days', '7')
ON CONFLICT (config_key) DO NOTHING;
```

### 索引

```sql
CREATE INDEX idx_sales_properties_status    ON sales_properties(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_properties_type      ON sales_properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_salesperson      ON customers(salesperson_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_lead_source      ON customers(lead_source) WHERE deleted_at IS NULL;
CREATE INDEX idx_viewing_records_property   ON viewing_records(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_viewing_records_customer   ON viewing_records(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_intents_property  ON purchase_intents(property_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_intents_customer  ON purchase_intents(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchase_intents_level     ON purchase_intents(intent_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_follow_ups_intent          ON follow_ups(intent_id);
CREATE INDEX idx_ad_materials_property      ON ad_materials(property_id) WHERE deleted_at IS NULL;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 必填项验证拒绝不完整输入

*For any* 创建请求（房源、客户、看房记录、广告素材），若缺少任意必填字段，系统应返回 400 错误，且数据库中不应新增记录。

**Validates: Requirements 1.2, 2.2, 3.3, 4.2, 9.2**

---

### Property 2: 创建后可查询（Round-trip）

*For any* 合法的创建请求（房源、客户、意向），成功创建后，通过对应的查询接口应能检索到该记录，且内容与提交数据一致。

**Validates: Requirements 1.3, 2.3, 5.1**

---

### Property 3: 编辑后 updated_at 单调递增

*For any* 实体（房源、客户、看房记录、意向），执行编辑操作后，`updated_at` 的值应严格大于编辑前的值。

**Validates: Requirements 1.4, 2.7, 4.5, 5.2**

---

### Property 4: 软删除后不出现在列表

*For any* 实体（房源、客户、看房记录、广告素材），执行软删除后，通过正常列表查询接口不应再返回该记录，但数据库中 `deleted_at` 字段应有值。

**Validates: Requirements 1.5, 4.6, 9.11**

---

### Property 5: 过滤查询结果一致性

*For any* 支持筛选的列表接口（按状态、类型、来源、热度、销售员），返回结果中所有记录的对应字段值应等于筛选参数值，不应包含其他值的记录。

**Validates: Requirements 1.6, 1.7, 2.4, 2.5, 5.6, 5.7, 9.10**

---

### Property 6: Staff 数据隔离

*For any* Staff 角色用户，通过客户、意向、看房记录、待跟进、业绩统计接口返回的所有记录，其 `salesperson_id` 应等于该用户的 id，不应包含其他销售员的数据。访问他人数据时应返回 403。

**Validates: Requirements 2.8, 5.8, 6.4, 7.4, 8.2, 8.3**

---

### Property 7: 照片上传格式和大小约束

*For any* 上传请求，若文件格式不在 JPG/PNG 范围内，或文件大小超过 5MB，系统应返回 400 错误，不保存文件。

**Validates: Requirements 1.8**

---

### Property 8: 封面图唯一性不变量

*For any* 房源，在任意时刻，`sales_property_photos` 中 `is_cover = TRUE` 的记录数量应不超过 1。删除封面图后，若存在其他照片，排序最小的照片应自动成为新封面图。

**Validates: Requirements 1.11, 1.12**

---

### Property 9: 照片排序持久化（Round-trip）

*For any* 房源的照片列表，设置排序后，查询该房源照片应按 `sort_order` 升序返回，顺序与设置时一致。

**Validates: Requirements 1.10**

---

### Property 10: 外来房源必须包含房主信息

*For any* `property_type = 'external'` 的房源创建或编辑请求，若 `owner_name` 或 `owner_contact` 为空，系统应返回 400 错误。

**Validates: Requirements 1.13**

---

### Property 11: 签约自动触发房源状态变更

*For any* 购买意向，当 `intent_level` 被更新为 `'signed'` 时，关联的 `sales_properties.status` 应自动变更为 `'sold'`。

**Validates: Requirements 1.14**

---

### Property 12: 客户搜索结果包含关键词

*For any* 姓名或手机号搜索关键词，返回结果中所有客户记录的姓名或手机号应包含该关键词（大小写不敏感）。

**Validates: Requirements 2.6**

---

### Property 13: 公开表单提交创建待分配客户（Round-trip）

*For any* 合法的公开表单提交（姓名和手机号非空），数据库中应创建一条 `lead_source = 'web_form'`、`assign_status = 'pending'` 的客户记录。

**Validates: Requirements 3.4**

---

### Property 14: 公开表单同一手机号限流

*For any* 手机号，在 10 分钟内第二次提交公开表单时，系统应返回 429 错误，不创建新记录。

**Validates: Requirements 3.7**

---

### Property 15: 看房记录按时间倒序

*For any* 房源或客户的看房记录查询，返回结果应按 `viewed_at` 降序排列，且所有记录的 `property_id`（或 `customer_id`）应等于查询参数。

**Validates: Requirements 4.3, 4.4**

---

### Property 16: 意向列表按热度降序

*For any* 房源或客户的意向列表查询，返回结果应按热度降序排列（signed > hot > warm > cold），不应出现升序或乱序。

**Validates: Requirements 5.4, 5.5**

---

### Property 17: 跟进记录 Round-trip

*For any* 意向记录，添加跟进记录后，查询该意向的跟进列表应包含刚添加的记录，内容与提交数据一致。

**Validates: Requirements 5.3**

---

### Property 18: 业绩统计指标计算正确性

*For any* 销售员和时间范围，统计接口返回的带看数应等于该时间范围内其 `viewing_records` 的数量，意向数应等于非冷意向数量，签约数应等于 `intent_level = 'signed'` 的数量。

**Validates: Requirements 6.1, 6.2**

---

### Property 19: 超阈值意向出现在待跟进列表

*For any* `intent_level` 为 `warm` 或 `hot` 的意向，若其最后一条跟进记录的 `followed_at` 距今超过配置的阈值天数（或从未有跟进记录），该意向对应的客户应出现在待跟进列表中。

**Validates: Requirements 7.2, 7.3**

---

### Property 20: 阈值配置全局生效

*For any* Admin 修改 `sales_followup_threshold_days` 后，待跟进列表的计算应使用新阈值，原来不超阈值但超过新阈值的意向应出现在列表中。

**Validates: Requirements 7.7**

---

### Property 21: 广告素材初始状态为草稿

*For any* 新创建的广告素材，`ad_status` 应为 `'draft'`，无论请求体中是否传入其他状态值。

**Validates: Requirements 9.3**

---

### Property 22: 广告状态合法转换

*For any* 广告素材，`ad_status` 只能在 `draft`、`published`、`paused` 三个值之间切换，传入非法状态值时应返回 400 错误。

**Validates: Requirements 9.4**

---

### Property 23: ZIP 下载包含所有选用照片

*For any* 有选用照片的广告素材，触发批量下载时，生成的 ZIP 文件应包含所有 `photo_ids` 对应的照片文件，且 ZIP 文件名包含房源名称和广告标题。

**Validates: Requirements 9.7**

---

## Error Handling

### 统一错误响应格式

```json
{
  "message": "人类可读的错误描述",
  "field": "触发错误的字段名（仅验证错误时）"
}
```

### HTTP 状态码约定

| 场景 | 状态码 |
|---|---|
| 必填项缺失 / 格式非法 | 400 |
| 未登录访问受保护接口 | 401 |
| 权限不足（Staff 越权） | 403 |
| 资源不存在 | 404 |
| 限流触发 | 429 |
| 数据库操作失败 | 500（不暴露内部错误） |

### 关键错误场景

- **照片上传失败**：返回 400/500，已上传的其他照片不受影响（每张照片独立上传）。
- **ZIP 下载无照片**：返回 400，提示"请先选择至少一张照片"。
- **签约触发房源状态变更失败**：使用数据库事务，失败时回滚意向更新，返回 500。
- **公开表单限流**：返回 429，提示"提交过于频繁，请稍后再试"。

---

## Testing Strategy

### 双轨测试方法

**单元测试**（Vitest + Vue Test Utils）：
- 验证具体示例和边界条件
- 测试 Vue 组件的渲染和交互
- 测试 Pinia store 的状态变更
- 测试表单验证逻辑

**属性测试**（后端使用 `fast-check`，Node.js）：
- 验证上述 23 个 Correctness Properties
- 每个属性测试最少运行 100 次迭代
- 使用随机生成的合法/非法输入覆盖边界情况

### 属性测试配置示例

```javascript
// 示例：Property 1 必填项验证
import fc from 'fast-check';
// Feature: sales-crm, Property 1: 必填项验证拒绝不完整输入
test('Property 1: missing required fields return 400', () => {
  fc.assert(fc.asyncProperty(
    fc.record({
      name: fc.option(fc.string({ minLength: 1 })),
      unit_type: fc.option(fc.string({ minLength: 1 })),
      area_sqm: fc.option(fc.float({ min: 1 })),
      price: fc.option(fc.float({ min: 1 })),
    }, { withDeletedKeys: true }),
    async (partialBody) => {
      // 确保至少缺少一个必填字段
      const body = { ...partialBody };
      delete body[['name','unit_type','area_sqm','price'][Math.floor(Math.random()*4)]];
      const res = await request(app).post('/api/sales/properties').set('Authorization', `Bearer ${staffToken}`).send(body);
      expect(res.status).toBe(400);
    }
  ), { numRuns: 100 });
});
```

### 单元测试重点

- `SalesPropertyFormView`：必填项校验、照片上传交互、拖拽排序
- `PublicInquiryView`：表单提交、错误提示、成功确认
- `AdMaterialPreviewView`：Facebook 样式渲染、复制文案反馈
- `PurchaseIntentDetailView`：热度更新、跟进记录添加
- 后端 Service 层：签约触发房源状态变更的事务逻辑

### 集成测试重点

- 公开表单限流（需要真实 Redis 或内存存储）
- ZIP 下载文件内容验证
- Staff 数据隔离（跨用户访问返回 403）
