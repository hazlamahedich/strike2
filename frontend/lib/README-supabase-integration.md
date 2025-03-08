# Supabase Integration for Leads Management

This document outlines the changes made to integrate the leads management system with Supabase.

## Overview

The leads management system has been updated to support both mock data (for development) and live Supabase data (for production). A configuration flag `USE_MOCK_DATA` in `lib/config.ts` controls which data source is used.

## Key Components

### 1. Configuration

The `lib/config.ts` file contains a flag to toggle between mock data and live Supabase data:

```typescript
// Set to true to use mock data, false to use live Supabase data
export const USE_MOCK_DATA = true;
```

### 2. API Client

The `lib/api/client.ts` file has been updated to use Supabase for API requests. It provides methods for:

- `get<T>(endpoint, params)`: Fetch data with optional filtering
- `post<T>(endpoint, body)`: Create new records
- `put<T>(endpoint, body)`: Update existing records
- `delete<T>(endpoint, id)`: Delete records

### 3. Lead Mapping

The `lib/utils/lead-mapper.ts` file provides utilities to map between the dashboard's Lead type and the API's Lead interface:

- `apiToDashboardLead(apiLead)`: Converts API Lead to Dashboard Lead format
- `dashboardToApiLead(dashboardLead)`: Converts Dashboard Lead to API Lead format

### 4. Dashboard Integration

The dashboard leads page (`app/dashboard/leads/page.tsx`) has been updated to:

- Use the `USE_MOCK_DATA` flag to determine the data source
- Use the API client for CRUD operations when `USE_MOCK_DATA` is false
- Use the lead mapper to convert between API and dashboard formats

## How to Use

### Development Mode

1. Set `USE_MOCK_DATA = true` in `lib/config.ts` to use mock data
2. The application will use the mock data defined in the dashboard leads page

### Production Mode

1. Set `USE_MOCK_DATA = false` in `lib/config.ts` to use Supabase data
2. Ensure Supabase environment variables are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. The application will use the Supabase client to fetch and manipulate data

## Data Structure

### Supabase Tables

The integration assumes the following Supabase tables:

1. `leads`: Stores lead information
   - `id`: Primary key
   - `first_name`: Lead's first name
   - `last_name`: Lead's last name
   - `email`: Lead's email address
   - `phone`: Lead's phone number
   - `company_name`: Lead's company name
   - `job_title`: Lead's job title
   - `status`: Lead's status (new, contacted, qualified, etc.)
   - `source`: Lead's source (website, referral, etc.)
   - `lead_score`: Lead's score (0-100)
   - `conversion_probability`: Lead's conversion probability (0-1)
   - `custom_fields`: JSON object for additional fields
   - `created_at`: Creation timestamp
   - `updated_at`: Update timestamp

2. `activities`: Stores lead activities for the timeline
   - `id`: Primary key
   - `lead_id`: Foreign key to leads table
   - `type`: Activity type (email, call, meeting, note)
   - `content`: Activity content
   - `created_at`: Creation timestamp
   - `user_id`: User who created the activity

### Custom Fields

The `custom_fields` JSON object in the leads table is used to store additional information:

- `notes`: Lead notes
- `address`: Lead address
- `campaign_id`: Campaign ID
- `campaign_name`: Campaign name
- `last_contact`: Last contact timestamp
- `timeline`: Array of timeline activities

## Next Steps

1. Create the necessary tables in Supabase
2. Set up RLS (Row Level Security) policies for data access
3. Implement authentication with Supabase Auth
4. Add real-time subscriptions for live updates 