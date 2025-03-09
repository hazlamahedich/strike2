-- Add parent_activity_id field to activities table for grouping related activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS parent_activity_id INTEGER;

-- Add index for faster lookups by parent_activity_id
CREATE INDEX IF NOT EXISTS idx_activities_parent_activity_id ON activities(parent_activity_id);

-- Add foreign key constraint to ensure parent_activity_id references a valid activity
ALTER TABLE activities ADD CONSTRAINT fk_parent_activity 
    FOREIGN KEY (parent_activity_id) REFERENCES activities(id) ON DELETE SET NULL;

-- Add group_id field for grouping related activities that don't have a direct parent-child relationship
ALTER TABLE activities ADD COLUMN IF NOT EXISTS group_id VARCHAR(100);

-- Add index for faster lookups by group_id
CREATE INDEX IF NOT EXISTS idx_activities_group_id ON activities(group_id);

-- Add comment to explain the parent_activity_id field
COMMENT ON COLUMN activities.parent_activity_id IS 'References the parent activity ID for grouping related activities';

-- Add comment to explain the group_id field
COMMENT ON COLUMN activities.group_id IS 'Identifier for grouping related activities that don''t have a direct parent-child relationship'; 