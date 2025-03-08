'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

// Define route mappings for prettier names
const routeNameMap: Record<string, string> = {
  'dashboard': 'Dashboard',
  'leads': 'Leads',
  'communications': 'Communications',
  'campaigns': 'Campaigns',
  'tasks': 'Tasks',
  'meetings': 'Meetings',
  'analytics': 'Analytics',
  'settings': 'Settings',
  'create': 'Create',
  'edit': 'Edit',
  'view': 'View',
  'details': 'Details',
  'login': 'Login',
  'auth': 'Authentication',
  'test-email': 'Test Email',
  'test-dialog': 'Test Dialog',
};

// Function to get a prettier name for a route segment
const getPrettyName = (segment: string, fullPath: string): string => {
  // Check if it's an ID (UUID pattern or numeric ID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
  const isNumericId = /^\d+$/.test(segment);
  
  if (isUuid || isNumericId) {
    // For IDs, use a more descriptive label based on the parent route
    const pathParts = fullPath.split('/');
    const parentIndex = pathParts.indexOf(segment) - 1;
    const parentSegment = parentIndex >= 0 ? pathParts[parentIndex] : '';
    
    // Singularize the parent segment name if possible
    const singularParent = parentSegment.endsWith('s') 
      ? parentSegment.slice(0, -1) 
      : parentSegment;
      
    return singularParent ? `${getPrettyName(singularParent, fullPath)} ID` : 'ID';
  }
  
  // Return mapped name or capitalize the segment
  return routeNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Function to build breadcrumb segments from a path
const buildBreadcrumbSegments = (pathname: string) => {
  // Skip empty segments and filter out any API routes
  const pathSegments = pathname.split('/').filter(segment => segment && !segment.startsWith('api'));
  
  const segments = pathSegments.map((segment, index) => {
    // Build the href for this segment
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Get a prettier name for the segment
    const name = getPrettyName(segment, pathname);
    
    return { name, href };
  });
  
  return segments;
};

export function BreadcrumbProvider() {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on the home page or login pages
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/auth/')) {
    return null;
  }
  
  // For dashboard pages, we need to adjust the styling since they have their own layout
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isCommunicationsPage = pathname.startsWith('/communications');
  
  // Skip breadcrumbs on main dashboard page as it's redundant
  if (pathname === '/dashboard') {
    return null;
  }
  
  const segments = buildBreadcrumbSegments(pathname);
  
  // For dashboard and communications pages, we don't need the border-bottom as they have their own layout
  const containerClassName = isDashboardPage || isCommunicationsPage
    ? "py-2 px-4 md:px-6" 
    : "py-2 px-4 md:px-6 border-b";
  
  return (
    <div className={containerClassName}>
      <Breadcrumb segments={segments} />
    </div>
  );
} 