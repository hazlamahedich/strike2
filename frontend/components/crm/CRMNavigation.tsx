'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CRMNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function CRMNavigation({ 
  isOpen, 
  onClose, 
  className, 
  style 
}: CRMNavigationProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['dashboard']);
  
  const toggleExpanded = (section: string) => {
    setExpanded(current => 
      current.includes(section)
        ? current.filter(item => item !== section)
        : [...current, section]
    );
  };
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  const navigationItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 15C14 14.4477 14.4477 14 15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/dashboard',
      items: [],
    },
    {
      section: 'contacts',
      label: 'Contacts',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21M23 21V19C23 16.7909 21.2091 15 19 15H18M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM19 7C19 8.10457 18.1046 9 17 9C15.8954 9 15 8.10457 15 7C15 5.89543 15.8954 5 17 5C18.1046 5 19 5.89543 19 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/contacts',
      items: [
        { label: 'All Contacts', path: '/crm/contacts' },
        { label: 'Companies', path: '/crm/contacts/companies' },
        { label: 'Import', path: '/crm/contacts/import' },
      ],
    },
    {
      section: 'deals',
      label: 'Deals',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/deals',
      items: [
        { label: 'Pipeline', path: '/crm/deals' },
        { label: 'Forecast', path: '/crm/deals/forecast' },
        { label: 'Won Deals', path: '/crm/deals/won' },
        { label: 'Lost Deals', path: '/crm/deals/lost' },
      ],
    },
    {
      section: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/tasks',
      items: [
        { label: 'My Tasks', path: '/crm/tasks' },
        { label: 'Team Tasks', path: '/crm/tasks/team' },
        { label: 'Calendar', path: '/crm/tasks/calendar' },
      ],
    },
    {
      section: 'communications',
      label: 'Communications',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/communications',
      items: [
        { label: 'Email', path: '/crm/communications/email' },
        { label: 'SMS', path: '/crm/communications/sms' },
        { label: 'Call Log', path: '/crm/communications/calls' },
        { label: 'Templates', path: '/crm/communications/templates' },
      ],
    },
    {
      section: 'marketing',
      label: 'Marketing',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 3.05493C6.50005 3.55238 3 7.36745 3 12C3 16.9706 7.02944 21 12 21C16.6326 21 20.4476 17.5 20.9451 13H11V3.05493Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.4878 9H15V3.5123C17.5572 4.41613 19.5839 6.44285 20.4878 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/marketing',
      items: [
        { label: 'Campaigns', path: '/crm/marketing/campaigns' },
        { label: 'Automation', path: '/crm/marketing/automation' },
        { label: 'Landing Pages', path: '/crm/marketing/landing-pages' },
      ],
    },
    {
      section: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/analytics',
      items: [
        { label: 'Sales Reports', path: '/crm/analytics/sales' },
        { label: 'Performance', path: '/crm/analytics/performance' },
        { label: 'Forecasting', path: '/crm/analytics/forecasting' },
      ],
    },
    {
      section: 'settings',
      label: 'Settings',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.3246 4.31731C10.751 2.5609 13.249 2.5609 13.6754 4.31731C13.9508 5.45193 15.2507 5.99038 16.2478 5.38285C17.7913 4.44239 19.5576 6.2087 18.6172 7.75218C18.0096 8.74925 18.5481 10.0492 19.6827 10.3246C21.4391 10.751 21.4391 13.249 19.6827 13.6754C18.5481 13.9508 18.0096 15.2507 18.6172 16.2478C19.5576 17.7913 17.7913 19.5576 16.2478 18.6172C15.2507 18.0096 13.9508 18.5481 13.6754 19.6827C13.249 21.4391 10.751 21.4391 10.3246 19.6827C10.0492 18.5481 8.74926 18.0096 7.75219 18.6172C6.2087 19.5576 4.44239 17.7913 5.38285 16.2478C5.99038 15.2507 5.45193 13.9508 4.31731 13.6754C2.5609 13.249 2.5609 10.751 4.31731 10.3246C5.45193 10.0492 5.99037 8.74926 5.38285 7.75218C4.44239 6.2087 6.2087 4.44239 7.75219 5.38285C8.74926 5.99037 10.0492 5.45193 10.3246 4.31731Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/crm/settings',
      items: [
        { label: 'General', path: '/crm/settings' },
        { label: 'Team', path: '/crm/settings/team' },
        { label: 'Integrations', path: '/crm/settings/integrations' },
        { label: 'Billing', path: '/crm/settings/billing' },
      ],
    },
  ];
  
  return (
    <div 
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        className
      )}
      style={style}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-between p-4 lg:hidden">
        <Link href="/crm/dashboard" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-md p-1.5">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L12 13L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 6H20V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold">CRM Suite</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
      
      {/* Navigation items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <div key={item.section} className="py-1">
              {item.items.length > 0 ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between font-medium",
                      isActive(item.path) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => toggleExpanded(item.section)}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </div>
                    <svg
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expanded.includes(item.section) && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>
                  
                  {expanded.includes(item.section) && (
                    <div className="mt-1 space-y-1 pl-10">
                      {item.items.map((subItem) => (
                        <Button
                          key={subItem.path}
                          variant="ghost"
                          asChild
                          className={cn(
                            "w-full justify-start font-normal",
                            isActive(subItem.path) && "bg-accent/50 text-accent-foreground"
                          )}
                        >
                          <Link href={subItem.path}>{subItem.label}</Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  asChild
                  className={cn(
                    "w-full justify-start font-medium",
                    isActive(item.path) && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link href={item.path}>
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      
      {/* Help and support */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-accent/20 p-4">
          <h4 className="mb-2 text-sm font-medium">Need Help?</h4>
          <p className="mb-3 text-xs text-muted-foreground">
            Our support team is ready to assist you with any questions.
          </p>
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
} 