# Analytics Module Documentation

This document provides an overview of the Analytics module in the CRM system.

## Overview

The Analytics module provides comprehensive insights into your CRM data, including leads, campaigns, communications, and overall performance metrics. It features:

- Interactive dashboards with real-time data visualization
- Detailed breakdowns of lead sources, statuses, and conversion rates
- Campaign performance tracking and analysis
- Communication effectiveness metrics
- User performance analytics and team metrics
- AI-powered analysis and recommendations

## Components

### Data Hooks

The following hooks are available in `lib/hooks/useAnalytics.ts`:

- `useOverviewStats()` - Get overall CRM statistics
- `useLeadStats()` - Get detailed lead statistics
- `useCampaignStats()` - Get campaign performance metrics
- `useCommunicationStats()` - Get communication effectiveness metrics
- `usePerformanceMetrics()` - Get business performance metrics
- `useTrendData()` - Get trend data for various metrics
- `useAnalysisRecommendation()` - Get AI-powered analysis and recommendations
- `useUserPerformance()` - Get user performance metrics and team statistics

### UI Components

The following reusable components are available in the `components/analytics` directory:

- `StatCard` - Display a single statistic with optional icon and trend
- `ChartCard` - Display various chart types (line, bar, pie) with consistent styling
- `AnalysisCard` - Display AI-powered analysis and recommendations
- `UserPerformanceCard` - Display user performance metrics and team statistics

## Database Schema

The analytics data is stored in the following tables in Supabase:

- `analytics_overview` - Overall CRM statistics
- `analytics_leads` - Detailed lead statistics
- `analytics_campaigns` - Campaign performance metrics
- `analytics_communications` - Communication effectiveness metrics
- `analytics_performance` - Business performance metrics
- `analytics_trends` - Trend data for various metrics
- `analytics_analysis` - AI-powered analysis and recommendations
- `analytics_user_performance` - User performance metrics and team statistics

The SQL migration file for creating these tables is available at `lib/migrations/analytics_tables.sql`.

## Mock Data vs. Real Data

The implementation includes a toggle for using mock data during development:

```typescript
// In lib/hooks/useAnalytics.ts
export const USE_MOCK_DATA = true; // Set to false when ready to use real Supabase data
```

When set to `false`, the hooks will fetch real data from Supabase instead of using the mock data.

## Integration with Supabase

The analytics module is designed to work with Supabase. Each hook includes both mock data implementation and real Supabase queries.

### Row Level Security (RLS)

RLS policies ensure that users can only access analytics data they have permission to view:

- All authenticated users can view analytics data
- Only admin users can insert/update analytics data

## AI-Powered Analysis

The analytics module includes AI-powered analysis and recommendations based on your CRM data. This is implemented in two ways:

1. **Mock Implementation**: Predefined analysis and recommendations for development
2. **Supabase Integration**: In production, this would call an API endpoint that uses an LLM to analyze the data

## User Performance Analytics

The user performance analytics feature provides insights into individual user and team performance metrics, including:

- Lead management metrics (leads managed, conversion rates)
- Response time and communication effectiveness
- Meeting scheduling and completion rates
- Activity completion and overdue rates
- Performance trends over time
- Team average metrics

This allows managers to:
- Identify top performers and their strategies
- Recognize areas where team members may need additional support
- Track performance improvements over time
- Set realistic benchmarks based on team averages

## Usage Examples

### Displaying Overview Statistics

```tsx
import { useOverviewStats } from '@/lib/hooks/useAnalytics';
import StatCard from '@/components/analytics/StatCard';
import { Users, Target, TrendingUp } from 'lucide-react';

const OverviewStats = () => {
  const { data, isLoading } = useOverviewStats();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="Total Leads"
        value={data?.totalLeads || 0}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Campaigns"
        value={data?.activeCampaigns || 0}
        icon={Target}
        isLoading={isLoading}
      />
      <StatCard
        title="Conversion Rate"
        value={`${data?.conversionRate.toFixed(1) || 0}%`}
        icon={TrendingUp}
        isLoading={isLoading}
      />
    </div>
  );
};
```

### Displaying a Chart

```tsx
import { useTrendData } from '@/lib/hooks/useAnalytics';
import ChartCard from '@/components/analytics/ChartCard';

const LeadGrowthChart = () => {
  const { data, isLoading } = useTrendData();
  
  const formatTrendData = () => {
    if (!data) return [];
    return data.leadGrowth;
  };
  
  return (
    <ChartCard
      title="Lead Growth"
      description="Monthly lead acquisition trend"
      data={formatTrendData()}
      type="line"
      dataKeys={['value']}
      xAxisKey="date"
      isLoading={isLoading}
    />
  );
};
```

### Displaying AI Analysis

```tsx
import { useAnalysisRecommendation } from '@/lib/hooks/useAnalytics';
import AnalysisCard from '@/components/analytics/AnalysisCard';

const AIAnalysis = () => {
  const { data, isLoading } = useAnalysisRecommendation();
  
  return (
    <AnalysisCard
      data={data}
      isLoading={isLoading}
    />
  );
};
```

### Displaying User Performance

```tsx
import { useUserPerformance } from '@/lib/hooks/useAnalytics';
import UserPerformanceCard from '@/components/analytics/UserPerformanceCard';

const UserPerformanceAnalytics = () => {
  const { data, isLoading } = useUserPerformance();
  
  return (
    <UserPerformanceCard
      data={data}
      isLoading={isLoading}
    />
  );
};
```

## Future Enhancements

Planned enhancements for the analytics module include:

- Custom date range selection for all metrics
- Exportable reports in PDF and CSV formats
- More advanced AI analysis with specific recommendations for each area
- Predictive analytics for lead conversion and campaign performance
- Integration with external data sources for market comparison
- User performance goal setting and tracking
- Automated performance improvement suggestions for individual users 