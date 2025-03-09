# Call Recording and Transcription with Whisper

This document explains how call recording and transcription with OpenAI's Whisper model works in the STRIKE CRM system.

## Overview

STRIKE CRM now includes call recording and transcription capabilities that allow you to:

1. Record calls made through the Twilio integration
2. Automatically transcribe recordings using OpenAI's Whisper model
3. View and search transcriptions in the call history
4. Analyze call content for insights and sentiment
5. Track call recordings and transcriptions in the lead activity timeline

## How It Works

### Call Recording

When a call is made through STRIKE:

1. The system automatically records the call using Twilio's recording feature
2. When the call ends, Twilio sends a webhook notification to STRIKE
3. STRIKE updates the call status and stores the recording URL
4. An activity is logged in the lead's timeline showing that a recording is available

### Transcription Process

The transcription process is triggered in several ways:

1. **Automatic Transcription**: When a call recording is completed, the system automatically initiates transcription
2. **On-Demand Transcription**: When a user requests a transcript for a call that hasn't been transcribed yet
3. **Batch Processing**: Administrators can trigger transcription for multiple calls at once

### Transcription Flow

1. The system downloads the audio recording from Twilio
2. The audio is sent to OpenAI's Whisper API for transcription
3. The resulting transcript is stored in the database
4. The transcript is associated with the call record
5. An activity is logged in the lead's timeline showing that a transcription is available

## Technical Implementation

### Components

1. **Recording Status Webhook**: Receives notifications from Twilio when recordings are completed
2. **Whisper Integration**: Sends audio to OpenAI's Whisper API for transcription
3. **Transcript Storage**: Stores transcriptions in the database
4. **Transcript Retrieval API**: Allows users to access transcriptions
5. **Activity Timeline Integration**: Logs recording and transcription events in the lead's activity timeline

### Database Schema

The `calls` table has been extended with the following fields:

- `transcription`: The full text of the transcription
- `transcription_method`: The method used for transcription (e.g., "whisper", "twilio")
- `transcription_timestamp`: When the transcription was created
- `recording_sid`: The Twilio recording SID
- `recording_url`: The URL to the recording file
- `call_sid`: The Twilio call SID

The following changes have been made to the database schema:

1. Added fields to the `calls` table:
   - `recording_url`: URL to the call recording
   - `recording_sid`: Twilio Recording SID
   - `transcription`: Full text of the call transcription
   - `transcription_method`: Method used for transcription (whisper or twilio)

2. Added fields to the `activities` table to support grouping:
   - `parent_activity_id`: References the parent activity (e.g., the original call activity)
   - `group_id`: String identifier for grouping related activities

### Migration

To add the necessary fields to the `activities` table, run the following migration:

```sql
-- Add parent_activity_id field for establishing relationships between activities
ALTER TABLE activities ADD COLUMN parent_activity_id INTEGER;

-- Add index for faster lookups
CREATE INDEX idx_activities_parent_activity_id ON activities(parent_activity_id);

-- Add foreign key constraint to ensure parent_activity_id references a valid activity
ALTER TABLE activities 
  ADD CONSTRAINT fk_parent_activity 
  FOREIGN KEY (parent_activity_id) 
  REFERENCES activities(id) 
  ON DELETE SET NULL;

-- Add group_id field for grouping activities that don't have a direct parent-child relationship
ALTER TABLE activities ADD COLUMN group_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX idx_activities_group_id ON activities(group_id);
```

This migration enables the grouping of related activities in the timeline, ensuring that call recordings, transcriptions, and transcript views are displayed together with their parent call activity.

### Activity Timeline Integration

Call recording and transcription events are automatically logged in the lead's activity timeline. This provides a comprehensive view of all interactions with a lead, including when recordings become available and when transcriptions are completed.

### Activity Types

The following activity types are added to the lead's timeline:

- **Call Recording Available**: Logged when a call recording is available for playback.
- **Call Transcription Completed**: Logged when a call transcription is completed.
- **Transcript Viewed**: Logged when a user views a call transcript.

### Activity Grouping

Call-related activities are now grouped together in the activity timeline for better organization. This means that:

1. The original call activity serves as the parent activity
2. Related activities (recordings, transcriptions, transcript views) are linked to the parent call
3. All related activities share a common group ID based on the call SID

This grouping ensures that all activities related to a specific call are displayed together in the timeline, making it easier to track the complete history of a call.

### Accessing Recordings and Transcriptions

Recordings and transcriptions can be accessed directly from the activity timeline. Each activity includes metadata such as:

- Call SID
- Recording URL
- Transcription method (Whisper or Twilio)
- Duration
- Timestamp
- Caller and recipient information

## Usage

### Viewing Transcriptions

1. Navigate to the Call History section
2. Click on a call to view its details
3. If a transcription is available, it will be displayed in the "Transcription" tab
4. If a transcription is in progress, you'll see a "Transcription in progress" message

### Accessing Recordings and Transcriptions from the Timeline

1. Go to the lead's profile page
2. Open the "Activity Timeline" tab
3. Look for activities with the types:
   - "Call Recording Available"
   - "Call Transcription Completed"
   - "Transcript Viewed"
4. Click on the activity to view details or access the recording/transcription

### Searching Transcriptions

1. Use the search function in the Call History section
2. Enter keywords to search across all transcriptions
3. Results will show calls with matching content in their transcriptions

### Analyzing Transcriptions

The system can analyze transcriptions for:

1. **Sentiment**: Positive, negative, or neutral tone
2. **Key Phrases**: Important topics or terms mentioned
3. **Action Items**: Tasks or follow-ups mentioned during the call
4. **Questions**: Questions asked during the call

## Configuration

### Required API Keys

To use the call recording and transcription features, you need:

1. **Twilio API Keys**: For call recording
2. **OpenAI API Key**: For Whisper transcription

### Environment Variables

The following environment variables must be set:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
OPENAI_API_KEY=your_openai_api_key
```

### Webhook Configuration

In your Twilio dashboard:

1. Go to Phone Numbers > Manage > Active Numbers
2. Select your number
3. Under "Voice & Fax", set the webhook URL for "A call ends" to:
   ```
   https://your-strike-domain.com/api/v1/communications/call-status-callback
   ```
4. Set the webhook URL for "A recording is available" to:
   ```
   https://your-strike-domain.com/api/v1/communications/recording-status-callback
   ```

## Troubleshooting

### Common Issues

1. **Missing Transcriptions**: 
   - Check that your OpenAI API key is valid
   - Verify that the recording URL is accessible
   - Check the logs for any errors during transcription

2. **Poor Transcription Quality**:
   - Ensure good call quality with minimal background noise
   - Check if the recording format is supported by Whisper
   - Consider using a different Whisper model for better accuracy

3. **Delayed Transcriptions**:
   - Large audio files may take longer to transcribe
   - Check your OpenAI API rate limits
   - Verify that background tasks are running properly

4. **Missing Timeline Activities**:
   - Ensure the call is properly associated with a lead
   - Check that the lead_id is correctly set in the call record
   - Verify that the activity logging functions are working properly

### Logs

Transcription logs can be found in:
- Application logs with the prefix "Transcribing recording" or "Failed to transcribe"
- The `calls` table with `transcription_method` indicating the status
- The `activities` table with activity types related to recordings and transcriptions

## Privacy and Compliance

When using call recording and transcription:

1. Ensure you have proper consent from all parties before recording calls
2. Inform callers that the call may be recorded and transcribed
3. Store transcriptions securely and in compliance with relevant regulations
4. Implement appropriate data retention policies

## Future Enhancements

Planned enhancements for call recording and transcription:

1. **Speaker Diarization**: Identify who said what in the transcription
2. **Custom Vocabulary**: Improve transcription accuracy for industry-specific terms
3. **Real-time Transcription**: Transcribe calls as they happen
4. **Multilingual Support**: Transcribe calls in multiple languages
5. **Advanced Timeline Filtering**: Filter the activity timeline by recording/transcription events
6. **Transcript Summarization**: Automatically generate summaries of call transcripts

### Implementation Details

The activity grouping feature is implemented as follows:

1. **Database Changes**:
   - Added `parent_activity_id` field to reference parent activities
   - Added `group_id` field to group related activities
   - Created indexes for efficient lookups
   - Added foreign key constraint for data integrity

2. **Backend Changes**:
   - Created a new `insert_related_activity` function to handle activity relationships
   - Modified `transcribe_recording_with_whisper` to link transcription activities to call activities
   - Updated `recording_status_callback` endpoint to link recording activities
   - Enhanced `get_call_transcript` to link transcript view activities
   - Updated `get_lead_timeline` to include relationship fields in the response

3. **Frontend Changes**:
   - Updated the activity timeline component to group related activities
   - Added support for new activity types (call_recording, call_transcription, transcript_viewed)
   - Enhanced the timeline display to show parent-child relationships
   - Added appropriate icons for each activity type

This implementation ensures that all call-related activities are properly grouped in the timeline, providing a more organized and intuitive user experience. 