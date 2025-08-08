-- Create app_skeletons table to store generated app structures
CREATE TABLE IF NOT EXISTS app_skeletons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mvp_id TEXT REFERENCES mvps(id) ON DELETE SET NULL,
    
    -- Basic app info
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    app_type TEXT NOT NULL CHECK (app_type IN ('web', 'mobile', 'hybrid')),
    complexity TEXT NOT NULL CHECK (complexity IN ('mvp', 'advanced', 'production')),
    
    -- Structured data (stored as JSONB for flexibility and querying)
    screens JSONB NOT NULL DEFAULT '[]',
    user_roles JSONB NOT NULL DEFAULT '[]',
    data_models JSONB NOT NULL DEFAULT '[]',
    page_flows JSONB NOT NULL DEFAULT '[]',
    modals JSONB NOT NULL DEFAULT '[]',
    integrations JSONB NOT NULL DEFAULT '[]',
    architecture JSONB,
    
    -- Generation settings
    generation_settings JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_app_skeletons_user_id ON app_skeletons(user_id);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_mvp_id ON app_skeletons(mvp_id);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_app_type ON app_skeletons(app_type);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_complexity ON app_skeletons(complexity);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_created_at ON app_skeletons(created_at);

-- GIN indexes for JSONB columns for fast searching
CREATE INDEX IF NOT EXISTS idx_app_skeletons_screens_gin ON app_skeletons USING GIN(screens);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_user_roles_gin ON app_skeletons USING GIN(user_roles);
CREATE INDEX IF NOT EXISTS idx_app_skeletons_data_models_gin ON app_skeletons USING GIN(data_models);

-- Enable Row Level Security
ALTER TABLE app_skeletons ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own app skeletons
CREATE POLICY "Users can view their own app skeletons" ON app_skeletons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app skeletons" ON app_skeletons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app skeletons" ON app_skeletons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app skeletons" ON app_skeletons
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_skeletons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_app_skeletons_updated_at
    BEFORE UPDATE ON app_skeletons
    FOR EACH ROW
    EXECUTE FUNCTION update_app_skeletons_updated_at();

-- Add a computed column for quick stats
ALTER TABLE app_skeletons ADD COLUMN IF NOT EXISTS screens_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(screens)) STORED;
ALTER TABLE app_skeletons ADD COLUMN IF NOT EXISTS user_roles_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(user_roles)) STORED;
ALTER TABLE app_skeletons ADD COLUMN IF NOT EXISTS data_models_count INTEGER GENERATED ALWAYS AS (jsonb_array_length(data_models)) STORED;
