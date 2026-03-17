CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    issue_type VARCHAR(20) NOT NULL CHECK (issue_type IN ('plumbing', 'furniture', 'cleaning', 'network', 'other')),
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal')),
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (ticket_status IN ('pending', 'completed')),
    photo_urls JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
