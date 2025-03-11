# Mock Data Implementation Guide

This guide explains the standardized approach for handling mock data in the application. Following these guidelines will ensure consistency across the codebase and make it easier to transition to live data when needed.

## Overview

The application uses a centralized approach to manage mock data settings through the `useMockData` hook. This hook provides a single source of truth for determining whether to use mock data or real data throughout the application.

## How to Use Mock Data in Components

### For React Components

Use the `useMockData` hook from `/hooks/useMockData.ts`:

```tsx
import { useMockData } from '@/hooks/useMockData';

function MyComponent() {
  const { isEnabled } = useMockData();
  
  return (
    <div>
      {isEnabled ? (
        <div>Using mock data</div>
      ) : (
        <div>Using real data</div>
      )}
    </div>
  );
}
```

### For Non-React Contexts (API Services, Utilities)

Use the `getMockDataStatus` function from `/lib/utils/mockDataUtils.ts`:

```ts
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

export const fetchData = async () => {
  if (getMockDataStatus()) {
    // Return mock data
    return mockData;
  } else {
    // Fetch and return real data
    const response = await fetch('/api/data');
    return response.json();
  }
};
```

## Toggling Mock Data

The mock data setting can be toggled in the Settings page under the Preferences tab. This setting is stored in:

1. User preferences in the database
2. LocalStorage for persistence between sessions
3. A global variable for real-time access

When the setting is toggled, all components using the standardized approach will automatically update.

## Implementation Details

### Core Components

1. **useMockData Hook** (`/hooks/useMockData.ts`)
   - The primary interface for React components
   - Syncs with user preferences
   - Manages additional mock data settings

2. **mockDataUtils** (`/lib/utils/mockDataUtils.ts`)
   - Provides non-hook access to mock data status
   - Useful for services and utilities

3. **Config** (`/lib/config.ts`)
   - Maintains backward compatibility
   - Stores the global mock data state

### Data Flow

1. User toggles mock data in the UI
2. The `useMockData` hook updates:
   - User preferences in the database
   - LocalStorage
   - The global variable in config.ts
   - Dispatches a custom event
3. Components using the hook or utility function reflect the change

## Transitioning from Old to New Approach

### Old Approach (Deprecated)

```ts
import { useMockData } from '@/lib/config';

if (useMockData()) {
  // Use mock data
} else {
  // Use real data
}
```

### New Approach

For React components:
```tsx
import { useMockData } from '@/hooks/useMockData';

function MyComponent() {
  const { isEnabled } = useMockData();
  
  if (isEnabled) {
    // Use mock data
  } else {
    // Use real data
  }
}
```

For non-React contexts:
```ts
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

if (getMockDataStatus()) {
  // Use mock data
} else {
  // Use real data
}
```

## Best Practices

1. **Always use the standardized approach** - Don't create new ways to check for mock data
2. **Keep mock data close to real data** - Structure mock data to match the real data format
3. **Use conditional imports** - Load mock data only when needed
4. **Document mock data usage** - Add comments explaining mock data implementation
5. **Test both paths** - Ensure your code works with both mock and real data

## Preparing for Live Data

When transitioning to live data:

1. Ensure all components use the standardized approach
2. Test with mock data disabled
3. Address any issues with real data integration
4. Update the default setting in the `useMockData` hook if needed

## Troubleshooting

If components aren't responding to mock data changes:

1. Verify they're using the standardized approach
2. Check if they're listening for the `mock-data-changed` event
3. Ensure the component re-renders when the setting changes
4. Check localStorage for the correct setting 