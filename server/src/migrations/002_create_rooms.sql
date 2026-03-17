CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_name_cn VARCHAR(100) NOT NULL,
    room_name_en VARCHAR(100) NOT NULL,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('villa', 'homestay', 'apartment')),
    room_group_id INTEGER,
    auto_assign BOOLEAN DEFAULT FALSE,
    base_daily_rate DECIMAL(10, 2) NOT NULL CHECK (base_daily_rate > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
