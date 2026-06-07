-- Migration: Add folders table and folder_id to concept_history
-- Date: 2026-05-05

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id and parent_id for faster queries
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- Add folder_id to concept_history
ALTER TABLE concept_history ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Add sort_order to concept_history (default 0 for existing records)
ALTER TABLE concept_history ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index on folder_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_concept_history_folder_id ON concept_history(folder_id);