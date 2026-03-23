-- Owners (业主/委托方) table
CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    wechat VARCHAR(50),
    notes TEXT,
    management_fee_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (management_fee_rate >= 0 AND management_fee_rate <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room templates (房型模板) table
CREATE TABLE IF NOT EXISTS room_templates (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    bedrooms SMALLINT NOT NULL DEFAULT 1 CHECK (bedrooms >= 0 AND bedrooms <= 20),
    bathrooms SMALLINT NOT NULL DEFAULT 1 CHECK (bathrooms >= 0 AND bathrooms <= 20),
    kitchens SMALLINT NOT NULL DEFAULT 0 CHECK (kitchens >= 0 AND kitchens <= 10),
    daily_rate DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (daily_rate >= 0),
    monthly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_rate >= 0),
    yearly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (yearly_rate >= 0),
    room_prefix VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add owner_id and template_id to rooms
ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES room_templates(id) ON DELETE SET NULL;

-- Index for fast lookup by owner
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_template_id ON rooms(template_id);
CREATE INDEX IF NOT EXISTS idx_room_templates_owner_id ON room_templates(owner_id);
