-- Sales CRM migration
-- Tables: sales_properties, sales_property_photos, customers,
--         viewing_records, purchase_intents, follow_ups, ad_materials

-- 1. Properties for sale
CREATE TABLE IF NOT EXISTS sales_properties (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    unit_type       VARCHAR(50)  NOT NULL,
    area_sqm        NUMERIC(8,2) NOT NULL,
    price           NUMERIC(12,2) NOT NULL,
    floor           VARCHAR(20),
    orientation     VARCHAR(20),
    property_type   VARCHAR(10)  NOT NULL DEFAULT 'own' CHECK (property_type IN ('own', 'external')),
    status          VARCHAR(15)  NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    owner_name      VARCHAR(100),
    owner_contact   VARCHAR(100),
    notes           TEXT,
    created_by      INTEGER REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Property photos
CREATE TABLE IF NOT EXISTS sales_property_photos (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES sales_properties(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers / leads
CREATE TABLE IF NOT EXISTS customers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    wechat          VARCHAR(100),
    budget_min      NUMERIC(12,2),
    budget_max      NUMERIC(12,2),
    preferences     TEXT,
    lead_source     VARCHAR(30)  NOT NULL DEFAULT 'other' CHECK (lead_source IN ('walk_in','referral','online_ad','agent','web_form','other')),
    salesperson_id  INTEGER REFERENCES users(id),
    assign_status   VARCHAR(15)  NOT NULL DEFAULT 'normal' CHECK (assign_status IN ('pending', 'normal')),
    notes           TEXT,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Viewing records
CREATE TABLE IF NOT EXISTS viewing_records (
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

-- 5. Purchase intents
CREATE TABLE IF NOT EXISTS purchase_intents (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    property_id     INTEGER NOT NULL REFERENCES sales_properties(id),
    intent_level    VARCHAR(10)  NOT NULL DEFAULT 'cold' CHECK (intent_level IN ('cold', 'warm', 'hot', 'signed')),
    salesperson_id  INTEGER NOT NULL REFERENCES users(id),
    notes           TEXT,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (customer_id, property_id)
);

-- 6. Follow-up records
CREATE TABLE IF NOT EXISTS follow_ups (
    id          SERIAL PRIMARY KEY,
    intent_id   INTEGER NOT NULL REFERENCES purchase_intents(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    content     TEXT NOT NULL,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ad materials
CREATE TABLE IF NOT EXISTS ad_materials (
    id                      SERIAL PRIMARY KEY,
    property_id             INTEGER NOT NULL REFERENCES sales_properties(id),
    title                   VARCHAR(200) NOT NULL,
    description             TEXT NOT NULL,
    tags                    TEXT[],
    photo_ids               INTEGER[],
    ad_status               VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (ad_status IN ('draft', 'published', 'paused')),
    status_changed_at       TIMESTAMP WITH TIME ZONE,
    facebook_ad_id          VARCHAR(100),
    facebook_campaign_id    VARCHAR(100),
    facebook_ad_account_id  VARCHAR(100),
    created_by              INTEGER REFERENCES users(id),
    deleted_at              TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Config: follow-up reminder threshold
INSERT INTO config (config_key, config_value)
VALUES ('sales_followup_threshold_days', '7')
ON CONFLICT (config_key) DO NOTHING;

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_sales_properties_status    ON sales_properties(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_properties_type      ON sales_properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_salesperson      ON customers(salesperson_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_lead_source      ON customers(lead_source) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_viewing_records_property   ON viewing_records(property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_viewing_records_customer   ON viewing_records(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_intents_property  ON purchase_intents(property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_intents_customer  ON purchase_intents(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_intents_level     ON purchase_intents(intent_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follow_ups_intent          ON follow_ups(intent_id);
CREATE INDEX IF NOT EXISTS idx_ad_materials_property      ON ad_materials(property_id) WHERE deleted_at IS NULL;
