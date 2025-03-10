'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CRMHeader } from '@/components/crm/CRMHeader';
import { CRMNavigation } from '@/components/crm/CRMNavigation';
import { CRMContextPanel } from '@/components/crm/CRMContextPanel';
import { CRMGlobalSearch } from '@/components/crm/CRMGlobalSearch';
import { CRMNotifications } from '@/components/crm/CRMNotifications';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // State for UI controls
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  // Close panels when route changes
  useEffect(() => {
    setIsSearchOpen(false);
    setIsContextPanelOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileNavOpen(false);
  }, [pathname]);
  
  // Handle context panel content based on selected item
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setSelectedDeal(null);
    setIsContextPanelOpen(true);
  };
  
  const handleDealSelect = (deal: any) => {
    setSelectedDeal(deal);
    setSelectedContact(null);
    setIsContextPanelOpen(true);
  };
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  
  // Only render if authenticated
  if (status !== 'authenticated') {
    return null;
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile navigation overlay */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Navigation sidebar */}
      <CRMNavigation 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        className="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0"
        style={{
          transform: isMobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <CRMHeader 
          onMenuClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onSearchClick={() => setIsSearchOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          user={session?.user}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Context panel - slides in from right */}
      <CRMContextPanel
        isOpen={isContextPanelOpen}
        onClose={() => setIsContextPanelOpen(false)}
        contact={selectedContact}
        deal={selectedDeal}
      />
      
      {/* Global search overlay */}
      <CRMGlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onContactSelect={handleContactSelect}
        onDealSelect={handleDealSelect}
      />
      
      {/* Notifications panel */}
      <CRMNotifications
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
} 