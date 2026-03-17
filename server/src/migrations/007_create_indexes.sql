CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings (room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_platform ON bookings (platform_source);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at);
