-- Platforms table
CREATE TABLE IF NOT EXISTS platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents (offline intermediaries) table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add source fields to bookings
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(10) CHECK (source_type IN ('platform', 'agent')),
    ADD COLUMN IF NOT EXISTS platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS agent_fee DECIMAL(12, 2) DEFAULT 0 CHECK (agent_fee >= 0);

-- Seed default platforms from existing platform_source values
INSERT INTO platforms (name, commission_rate, tax_rate) VALUES
    ('Airbnb', 3.0, 0),
    ('Agoda', 15.0, 7.0),
    ('Booking.com', 15.0, 7.0),
    ('Trip.com', 10.0, 7.0),
    ('途家', 8.0, 0),
    ('小猪', 8.0, 0),
    ('美团民宿', 8.0, 0),
    ('飞猪', 8.0, 0),
    ('Expedia', 15.0, 0),
    ('VRBO', 8.0, 0),
    ('直客', 0, 0),
    ('其他', 0, 0)
ON CONFLICT (name) DO NOTHING;

-- Add tax column to bookings (platform tax amount)
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS tax DECIMAL(12, 2) DEFAULT 0 CHECK (tax >= 0);
