-- Add photos column to room_templates
ALTER TABLE room_templates ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
