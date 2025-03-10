'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CRMGlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSelect: (contact: any) => void;
  onDealSelect: (deal: any) => void;
}

export function CRMGlobalSearch({ 
  isOpen, 
  onClose, 
  onContactSelect, 
  onDealSelect 
}: CRMGlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    // Simulate search delay
    const timer = setTimeout(() => {
      setIsLoading(true);
      
      // Mock search results
      const mockResults = [
        // Contacts
        {
          id: 'c1',
          type: 'contact',
          name: 'Jane Smith',
          subtitle: 'Marketing Director at Acme Inc.',
          avatar: '',
          tags: ['VIP'],
        },
        {
          id: 'c2',
          type: 'contact',
          name: 'John Doe',
          subtitle: 'CEO at TechCorp',
          avatar: '',
          tags: ['Decision Maker'],
        },
        {
          id: 'c3',
          type: 'contact',
          name: 'Sarah Johnson',
          subtitle: 'Product Manager at InnoSoft',
          avatar: '',
          tags: [],
        },
        
        // Deals
        {
          id: 'd1',
          type: 'deal',
          name: 'Acme Inc. Enterprise Deal',
          subtitle: '$75,000 - Proposal Stage',
          amount: 75000,
          stage: 'Proposal',
        },
        {
          id: 'd2',
          type: 'deal',
          name: 'TechCorp Software Renewal',
          subtitle: '$45,000 - Negotiation Stage',
          amount: 45000,
          stage: 'Negotiation',
        },
        
        // Tasks
        {
          id: 't1',
          type: 'task',
          name: 'Follow up with Jane Smith',
          subtitle: 'Due tomorrow',
          dueDate: '2023-06-20',
        },
        {
          id: 't2',
          type: 'task',
          name: 'Send proposal to TechCorp',
          subtitle: 'Due in 3 days',
          dueDate: '2023-06-23',
        },
        
        // Emails
        {
          id: 'e1',
          type: 'email',
          name: 'Re: Product Demo',
          subtitle: 'From: jane.smith@acme.com',
          date: '2023-06-15',
        },
        {
          id: 'e2',
          type: 'email',
          name: 'Meeting Confirmation',
          subtitle: 'To: john.doe@techcorp.com',
          date: '2023-06-14',
        },
      ];
      
      // Filter results based on search query
      const filteredResults = mockResults.filter(result => 
        result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Filter by active category if set
      const categoryFilteredResults = activeCategory 
        ? filteredResults.filter(result => result.type === activeCategory)
        : filteredResults;
      
      setSearchResults(categoryFilteredResults);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory]);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle result selection
  const handleResultSelect = (result: any) => {
    if (result.type === 'contact') {
      onContactSelect(result);
      onClose();
    } else if (result.type === 'deal') {
      onDealSelect(result);
      onClose();
    }
    // For other types, we could add more handlers
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };
  
  const contentVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };
  
  // Categories for filtering
  const categories = [
    { id: 'contact', label: 'Contacts', icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21M23 21V19C23 16.7909 21.2091 15 19 15H18M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM19 7C19 8.10457 18.1046 9 17 9C15.8954 9 15 8.10457 15 7C15 5.89543 15.8954 5 17 5C18.1046 5 19 5.89543 19 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
    { id: 'deal', label: 'Deals', icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
    { id: 'task', label: 'Tasks', icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
    { id: 'email', label: 'Emails', icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            variants={contentVariants}
            className="w-full max-w-2xl bg-card rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for contacts, deals, tasks, emails..."
                  className="pl-10 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery('')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
              
              {/* Category filters */}
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={activeCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                  className="text-xs"
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                    className="text-xs"
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Search results */}
            <div className="relative">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">No results found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[60vh]">
                  <div className="p-2">
                    {/* Group results by type */}
                    {['contact', 'deal', 'task', 'email'].map(type => {
                      const typeResults = searchResults.filter(result => result.type === type);
                      if (typeResults.length === 0) return null;
                      
                      return (
                        <div key={type} className="mb-4">
                          <h3 className="px-2 mb-2 text-sm font-medium text-muted-foreground">
                            {type.charAt(0).toUpperCase() + type.slice(1)}s
                          </h3>
                          <div className="space-y-1">
                            {typeResults.map(result => (
                              <div
                                key={result.id}
                                className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => handleResultSelect(result)}
                              >
                                {result.type === 'contact' && (
                                  <Avatar className="h-10 w-10 mr-3">
                                    <AvatarImage src={result.avatar} alt={result.name} />
                                    <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                                  </Avatar>
                                )}
                                
                                {result.type === 'deal' && (
                                  <div className="flex h-10 w-10 mr-3 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                                
                                {result.type === 'task' && (
                                  <div className="flex h-10 w-10 mr-3 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                                
                                {result.type === 'email' && (
                                  <div className="flex h-10 w-10 mr-3 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium truncate">{result.name}</h4>
                                    {result.type === 'deal' && (
                                      <Badge 
                                        className={cn(
                                          "ml-2 text-xs",
                                          result.stage === 'Proposal' && "bg-yellow-500",
                                          result.stage === 'Negotiation' && "bg-blue-500",
                                          result.stage === 'Closed Won' && "bg-green-500",
                                          result.stage === 'Closed Lost' && "bg-red-500"
                                        )}
                                      >
                                        {result.stage}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                                  {result.tags && result.tags.length > 0 && (
                                    <div className="mt-1 flex space-x-1">
                                      {result.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* Footer with keyboard shortcuts */}
            <div className="border-t border-border p-2 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border mr-1">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border mr-1">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border mr-1">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border mr-1">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-auto py-1 px-2">
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 