CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    guest_name VARCHAR(200) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    rental_type VARCHAR(10) NOT NULL CHECK (rental_type IN ('daily', 'monthly', 'yearly')),
    platform_source VARCHAR(50) NOT NULL,
    total_revenue DECIMAL(12, 2) NOT NULL CHECK (total_revenue >= 0),
    commission DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (commission >= 0),
    net_income DECIMAL(12, 2) NOT NULL,
    external_order_id VARCHAR(100),
    raw_email_content TEXT,
    currency VARCHAR(10) DEFAULT 'THB',
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (booking_status IN ('pending', 'checked_in', 'checked_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (check_out > check_in),
    CONSTRAINT check_commission CHECK (commission <= total_revenue)
);
