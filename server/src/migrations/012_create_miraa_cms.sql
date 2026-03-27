-- Miraa CMS migration
-- Tables: miraa_properties, miraa_property_photos, miraa_banners, miraa_settings

-- 1. Miraa website properties (new homes, resale, rental)
CREATE TABLE IF NOT EXISTS miraa_properties (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    property_type   VARCHAR(10)  NOT NULL CHECK (property_type IN ('new', 'resale', 'rental')),
    price           NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(5)   NOT NULL DEFAULT 'USD',
    area_sqm        NUMERIC(8,2),
    land_sqm        NUMERIC(8,2),
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    location        VARCHAR(200),
    description     TEXT,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_by      INTEGER REFERENCES users(id),
    deleted_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Property photos
CREATE TABLE IF NOT EXISTS miraa_property_photos (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES miraa_properties(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Hero banner images
CREATE TABLE IF NOT EXISTS miraa_banners (
    id          SERIAL PRIMARY KEY,
    url         VARCHAR(500) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Site settings (WhatsApp, LINE, etc.)
INSERT INTO config (config_key, config_value)
VALUES
    ('miraa_whatsapp', '66812345678'),
    ('miraa_line_id', 'mira_samui')
ON CONFLICT (config_key) DO NOTHING;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_miraa_properties_type      ON miraa_properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_miraa_properties_published ON miraa_properties(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_miraa_banners_active       ON miraa_banners(is_active);
