-- Add transcription fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcription_method VARCHAR(50);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcription_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_sid VARCHAR(100);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Create index for faster lookups by call_sid
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_sid VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_calls_call_sid ON calls(call_sid);

-- Add comment to explain the transcription_method field
COMMENT ON COLUMN calls.transcription_method IS 'Method used for transcription: "twilio", "whisper", etc.';

-- Update existing calls that have recording_url but no transcription
-- This will mark them for transcription the next time they are accessed
UPDATE calls 
SET transcription_method = 'pending_transcription' 
WHERE recording_url IS NOT NULL 
AND transcription IS NULL; 