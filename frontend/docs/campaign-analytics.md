# Campaign Analytics Implementation

This document outlines the implementation of campaign analytics in the CRM system.

## Overview

The campaign analytics feature provides insights into campaign performance, lead engagement, and activity metrics. It includes:

- Campaign performance metrics (open rates, click rates, conversion rates)
- Lead statistics by source and status
- Activity tracking and completion rates
- Campaign timeline events

## Components

### Data Hooks

The following hooks are available in `lib/hooks/useCampaignAnalytics.ts`:

- `useCampaignOverviewStats()` - Get overall campaign statistics
- `useCampaignPerformance(campaignId)` - Get performance metrics for a specific campaign
- `useCampaignLeadStats(campaignId)` - Get lead statistics for a specific campaign
- `useCampaignActivityStats(campaignId)` - Get activity statistics for a specific campaign
- `useCampaignTimeline(campaignId)` - Get timeline events for a specific campaign

### UI Components

- `CampaignAnalyticsOverview` - Dashboard widget showing campaign overview statistics
- Campaign analytics page at `/dashboard/campaigns/[id]/analytics` with detailed metrics

## Database Schema

The campaign analytics data is stored in the following tables and views:

### Tables

- `campaign_performance` - Stores daily performance metrics for campaigns
- `campaign_timeline_events` - Stores timeline events for campaigns

### Views

- `campaign_lead_stats` - Aggregates lead statistics for campaigns
- `campaign_activity_stats` - Aggregates activity statistics for campaigns
- `campaign_overview_stats` - Provides overview statistics across all campaigns

## Integration with Supabase

The campaign analytics feature is designed to work with Supabase. The SQL migration file at `lib/migrations/campaign_analytics.sql` contains the necessary database schema and RLS policies.

### Row Level Security (RLS)

RLS policies ensure that users can only access campaign analytics data for campaigns they have permission to view:

- Users can view analytics for campaigns they created
- Team members can view analytics for campaigns in their team
- Admins and marketers can view analytics for all campaigns

### Triggers and Functions

- `record_campaign_event()` - Function to record campaign timeline events
- `campaign_status_change_trigger()` - Trigger to automatically record status changes

## Mock Data vs. Real Data

The implementation includes a toggle for using mock data during development:

```typescript
// In lib/hooks/useCampaignAnalytics.ts
const USE_MOCK_DATA = true; // Set to false when ready to use real Supabase data
```

When set to `false`, the hooks will fetch real data from Supabase instead of using the mock data.

## Usage Examples

### Fetching Campaign Performance Data

```typescript
import { useCampaignPerformance } from '@/lib/hooks/useCampaignAnalytics';

function CampaignPerformanceChart({ campaignId }) {
  const { data, isLoading } = useCampaignPerformance(campaignId);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {/* Render chart with data */}
    </div>
  );
}
```

### Displaying Campaign Overview

```typescript
import CampaignAnalyticsOverview from '@/components/dashboard/CampaignAnalyticsOverview';

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <CampaignAnalyticsOverview />
    </div>
  );
}
```

## Future Enhancements

Potential future enhancements for campaign analytics:

1. Real-time analytics with Supabase Realtime
2. Export functionality for analytics data
3. Comparative analytics between campaigns
4. Predictive analytics for campaign performance
5. Custom reporting and dashboard widgets 