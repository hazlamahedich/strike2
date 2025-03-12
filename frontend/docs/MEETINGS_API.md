# Meetings API Documentation

This document provides information about the Meetings API endpoints and how they handle mock data.

## API Endpoints

### GET /api/meetings

Retrieves a list of all meetings.

**Response:**
```json
[
  {
    "id": "1",
    "title": "Initial Client Meeting",
    "description": "First meeting with the client to discuss requirements",
    "start_time": "2023-06-01T10:00:00Z",
    "end_time": "2023-06-01T11:00:00Z",
    "location": "Virtual",
    "meeting_type": "INITIAL_CALL",
    "status": "SCHEDULED",
    "lead_id": "lead_123",
    "notes": "Meeting notes go here",
    "agenda_items": ["Introduction", "Requirements discussion", "Next steps"],
    "created_at": "2023-05-31T10:00:00Z",
    "updated_at": "2023-05-31T10:00:00Z",
    "summary": null,
    "action_items": [],
    "comprehensive_summary": null
  }
]
```

### GET /api/meetings/:id

Retrieves a specific meeting by ID.

**Response:**
```json
{
  "id": "1",
  "title": "Initial Client Meeting",
  "description": "First meeting with the client to discuss requirements",
  "start_time": "2023-06-01T10:00:00Z",
  "end_time": "2023-06-01T11:00:00Z",
  "location": "Virtual",
  "meeting_type": "INITIAL_CALL",
  "status": "SCHEDULED",
  "lead_id": "lead_123",
  "notes": "Meeting notes go here",
  "agenda_items": ["Introduction", "Requirements discussion", "Next steps"],
  "created_at": "2023-05-31T10:00:00Z",
  "updated_at": "2023-05-31T10:00:00Z",
  "summary": null,
  "action_items": [],
  "comprehensive_summary": null
}
```

### POST /api/meetings

Creates a new meeting.

**Request Body:**
```json
{
  "title": "New Meeting",
  "description": "Description of the new meeting",
  "start_time": "2023-06-01T10:00:00Z",
  "end_time": "2023-06-01T11:00:00Z",
  "location": "Virtual",
  "meeting_type": "INITIAL_CALL",
  "status": "SCHEDULED",
  "lead_id": "lead_123",
  "notes": "Meeting notes go here",
  "agenda_items": ["Introduction", "Requirements discussion", "Next steps"]
}
```

**Response:**
```json
{
  "id": "1",
  "title": "New Meeting",
  "description": "Description of the new meeting",
  "start_time": "2023-06-01T10:00:00Z",
  "end_time": "2023-06-01T11:00:00Z",
  "location": "Virtual",
  "meeting_type": "INITIAL_CALL",
  "status": "SCHEDULED",
  "lead_id": "lead_123",
  "notes": "Meeting notes go here",
  "agenda_items": ["Introduction", "Requirements discussion", "Next steps"],
  "created_at": "2023-05-31T10:00:00Z",
  "updated_at": "2023-05-31T10:00:00Z",
  "summary": null,
  "action_items": [],
  "comprehensive_summary": null
}
```

### PUT /api/meetings/:id

Updates an existing meeting.

**Request Body:**
```json
{
  "title": "Updated Meeting",
  "description": "Updated description",
  "notes": "Updated notes",
  "summary": "Meeting summary",
  "action_items": ["Action item 1", "Action item 2"],
  "comprehensive_summary": {
    "summary": "Comprehensive summary text",
    "insights": ["Insight 1", "Insight 2"],
    "action_items": ["Action item 1", "Action item 2"],
    "next_steps": ["Next step 1", "Next step 2"]
  }
}
```

**Response:**
```json
{
  "id": "1",
  "title": "Updated Meeting",
  "description": "Updated description",
  "start_time": "2023-06-01T10:00:00Z",
  "end_time": "2023-06-01T11:00:00Z",
  "location": "Virtual",
  "meeting_type": "INITIAL_CALL",
  "status": "SCHEDULED",
  "lead_id": "lead_123",
  "notes": "Updated notes",
  "agenda_items": ["Introduction", "Requirements discussion", "Next steps"],
  "created_at": "2023-05-31T10:00:00Z",
  "updated_at": "2023-05-31T11:00:00Z",
  "summary": "Meeting summary",
  "action_items": ["Action item 1", "Action item 2"],
  "comprehensive_summary": {
    "summary": "Comprehensive summary text",
    "insights": ["Insight 1", "Insight 2"],
    "action_items": ["Action item 1", "Action item 2"],
    "next_steps": ["Next step 1", "Next step 2"]
  }
}
```

### GET /api/v1/ai/meetings/comprehensive-summary/:meetingId

Generates a comprehensive summary for a meeting.

**Response:**
```json
{
  "summary": "This meeting covered key aspects of the product offering and addressed the client's concerns about implementation timeline and costs.",
  "insights": [
    "Client's main pain point is lack of visibility into their current process",
    "Decision timeline is approximately 4-6 weeks"
  ],
  "action_items": [
    "Send detailed product specifications document",
    "Schedule a technical demo with their IT team"
  ],
  "next_steps": [
    "Schedule technical demo within the next 7 days",
    "Prepare customized proposal addressing budget constraints"
  ]
}
```

### PUT /api/v1/ai/meetings/update-summary/:meetingId

Updates a meeting with a comprehensive summary.

**Request Body:**
```json
{
  "comprehensive_summary": {
    "summary": "Comprehensive summary text",
    "insights": ["Insight 1", "Insight 2"],
    "action_items": ["Action item 1", "Action item 2"],
    "next_steps": ["Next step 1", "Next step 2"]
  }
}
```

**Response:**
```json
{
  "id": "1",
  "title": "Updated Meeting",
  "description": "Updated description",
  "start_time": "2023-06-01T10:00:00Z",
  "end_time": "2023-06-01T11:00:00Z",
  "location": "Virtual",
  "notes": "Meeting notes go here",
  "agenda_items": ["Introduction", "Requirements discussion", "Next steps"],
  "created_at": "2023-05-31T10:00:00Z",
  "updated_at": "2023-05-31T11:00:00Z",
  "summary": null,
  "action_items": [],
  "comprehensive_summary": {
    "summary": "Comprehensive summary text",
    "insights": ["Insight 1", "Insight 2"],
    "action_items": ["Action item 1", "Action item 2"],
    "next_steps": ["Next step 1", "Next step 2"]
  }
}
```

## Mock Data Implementation

All API endpoints in this application support both mock and real data modes. The current implementation returns mock data in both modes, but is structured to easily switch to real data when ready for production.

### How Mock Data Works

The application uses a global mock data flag to determine whether to use mock data or real data. This flag is managed by:

1. For React components: `useMockData` hook from `/hooks/useMockData.ts`
2. For non-React contexts (like API routes): `getMockDataStatus` function from `/lib/utils/mockDataUtils.ts`

### Using Mock Data in API Routes

All API routes check the mock data flag using `getMockDataStatus()` and respond accordingly:

```typescript
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// In your API route handler
const useMockData = getMockDataStatus();

if (useMockData) {
  // Return mock data
  return NextResponse.json(mockData);
} else {
  // In production, would fetch real data from the database
  // For now, still returns mock data but is structured for easy replacement
  return NextResponse.json(mockData);
}
```

### Toggling Mock Data

The mock data flag can be toggled in the application settings. When toggled, all components and API routes will automatically switch between mock and real data modes.

### Production Readiness

The current implementation is designed to be production-ready with minimal changes:

1. The API routes are already structured to handle both mock and real data modes
2. When ready for production, simply implement the real data fetching logic in the "else" branches
3. No changes to the frontend components are needed, as they already use the API endpoints correctly

## Meeting Summary Fields

The Meeting object includes the following fields for AI-generated summaries:

- `summary`: A brief summary of the meeting
- `action_items`: A list of action items from the meeting
- `comprehensive_summary`: An object containing a detailed summary, insights, action items, and next steps

These fields are persisted in the database and will be available when the meeting is loaded again.

## Troubleshooting

If you encounter issues with saving comprehensive summaries, check the following:

1. Make sure the meeting ID is being passed correctly (as a string)
2. Check the browser console for detailed error messages
3. Verify that the API routes are correctly configured
4. Ensure that the mock data flag is set correctly

The application includes extensive logging to help diagnose issues. Look for log messages in the browser console and server logs. 