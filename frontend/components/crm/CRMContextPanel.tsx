'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CRMContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: any;
  deal?: any;
}

export function CRMContextPanel({ 
  isOpen, 
  onClose, 
  contact, 
  deal 
}: CRMContextPanelProps) {
  const [activeTab, setActiveTab] = useState('details');
  
  // Get initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Determine what content to show
  const panelTitle = contact ? 'Contact Details' : deal ? 'Deal Details' : 'No Selection';
  
  // Mock data for demonstration
  const mockContact = contact || {
    id: '1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Inc.',
    position: 'Marketing Director',
    status: 'Active',
    tags: ['VIP', 'Marketing', 'Tech'],
    lastContacted: '2023-06-15',
    notes: 'Jane is interested in our enterprise plan. Follow up next week.',
    avatar: '',
    activities: [
      { id: '1', type: 'email', title: 'Sent follow-up email', date: '2023-06-10', description: 'Sent information about our enterprise plan.' },
      { id: '2', type: 'call', title: 'Discovery call', date: '2023-06-05', description: 'Discussed needs and pain points.' },
      { id: '3', type: 'meeting', title: 'Initial meeting', date: '2023-05-28', description: 'Introduction to our services.' },
    ],
    tasks: [
      { id: '1', title: 'Send proposal', dueDate: '2023-06-20', status: 'pending' },
      { id: '2', title: 'Schedule demo', dueDate: '2023-06-25', status: 'pending' },
    ],
  };
  
  const mockDeal = deal || {
    id: '1',
    name: 'Acme Inc. Enterprise Deal',
    amount: 75000,
    stage: 'Proposal',
    probability: 60,
    expectedCloseDate: '2023-07-30',
    contact: 'Jane Smith',
    company: 'Acme Inc.',
    description: 'Enterprise plan for 150 users with custom integrations.',
    tags: ['Enterprise', 'High Value', 'Q3'],
    activities: [
      { id: '1', type: 'proposal', title: 'Sent proposal', date: '2023-06-12', description: 'Sent detailed proposal with pricing.' },
      { id: '2', type: 'meeting', title: 'Needs assessment', date: '2023-06-08', description: 'Detailed discussion of requirements.' },
    ],
    tasks: [
      { id: '1', title: 'Follow up on proposal', dueDate: '2023-06-19', status: 'pending' },
      { id: '2', title: 'Schedule technical review', dueDate: '2023-06-22', status: 'pending' },
    ],
  };
  
  // Panel animation variants
  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: { 
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/50"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={panelVariants}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">{panelTitle}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            {/* Content */}
            <ScrollArea className="h-[calc(100vh-64px)]">
              <div className="p-4">
                {contact && (
                  <div className="mb-6 flex items-center">
                    <Avatar className="h-16 w-16 mr-4">
                      <AvatarImage src={mockContact.avatar} alt={mockContact.name} />
                      <AvatarFallback className="text-lg">{getInitials(mockContact.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{mockContact.name}</h3>
                      <p className="text-sm text-muted-foreground">{mockContact.position} at {mockContact.company}</p>
                      <div className="mt-1 flex space-x-1">
                        {mockContact.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {deal && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{mockDeal.name}</h3>
                      <Badge 
                        className={cn(
                          "text-xs",
                          mockDeal.stage === 'Proposal' && "bg-yellow-500",
                          mockDeal.stage === 'Negotiation' && "bg-blue-500",
                          mockDeal.stage === 'Closed Won' && "bg-green-500",
                          mockDeal.stage === 'Closed Lost' && "bg-red-500"
                        )}
                      >
                        {mockDeal.stage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{mockDeal.company}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-2xl font-bold">${mockDeal.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {mockDeal.probability}% · Closes {new Date(mockDeal.expectedCloseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 flex space-x-1">
                      {mockDeal.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="activities" className="flex-1">Activities</TabsTrigger>
                    <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
                  </TabsList>
                  
                  {/* Details Tab */}
                  <TabsContent value="details" className="mt-4 space-y-4">
                    {contact && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Email</h4>
                            <p className="text-sm">{mockContact.email}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Phone</h4>
                            <p className="text-sm">{mockContact.phone}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Company</h4>
                            <p className="text-sm">{mockContact.company}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Status</h4>
                            <p className="text-sm">{mockContact.status}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Last Contacted</h4>
                            <p className="text-sm">{new Date(mockContact.lastContacted).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Notes</h4>
                          <p className="text-sm">{mockContact.notes}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Email
                          </Button>
                          <Button size="sm" className="flex-1">
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Call
                          </Button>
                          <Button size="sm" className="flex-1">
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Meeting
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {deal && (
                      <>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Description</h4>
                          <p className="text-sm">{mockDeal.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Contact</h4>
                            <p className="text-sm">{mockDeal.contact}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Company</h4>
                            <p className="text-sm">{mockDeal.company}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Expected Close</h4>
                            <p className="text-sm">{new Date(mockDeal.expectedCloseDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground">Probability</h4>
                            <p className="text-sm">{mockDeal.probability}%</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Deal Stage</h4>
                          <div className="flex space-x-1">
                            {['Qualification', 'Meeting', 'Proposal', 'Negotiation', 'Closed Won'].map((stage, index) => (
                              <div 
                                key={stage} 
                                className={cn(
                                  "flex-1 h-2 rounded-full",
                                  index <= ['Qualification', 'Meeting', 'Proposal', 'Negotiation', 'Closed Won'].indexOf(mockDeal.stage)
                                    ? "bg-primary"
                                    : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>Qualification</span>
                            <span>Closed</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M15.232 5.232L18.768 8.768M16.732 3.732L20.268 7.268C20.5631 7.56345 20.7304 7.9716 20.7304 8.3975C20.7304 8.82341 20.5631 9.23156 20.268 9.527L8.5 21.295H3V15.795L14.768 4.027C15.0634 3.73185 15.4716 3.56451 15.8975 3.56451C16.3234 3.56451 16.7316 3.73185 17.027 4.027L16.732 3.732Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </Button>
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Mark as Won
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  {/* Activities Tab */}
                  <TabsContent value="activities" className="mt-4">
                    <div className="space-y-4">
                      {(contact ? mockContact.activities : mockDeal.activities).map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3 rounded-lg border border-border p-3">
                          <div className={cn(
                            "mt-0.5 rounded-full p-1.5",
                            activity.type === 'email' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                            activity.type === 'call' && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                            activity.type === 'meeting' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                            activity.type === 'proposal' && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}>
                            {activity.type === 'email' && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {activity.type === 'call' && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {activity.type === 'meeting' && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {activity.type === 'proposal' && (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{activity.title}</h4>
                              <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                      
                      <Button variant="outline" className="w-full">
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Add Activity
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Tasks Tab */}
                  <TabsContent value="tasks" className="mt-4">
                    <div className="space-y-4">
                      {(contact ? mockContact.tasks : mockDeal.tasks).map((task: any) => (
                        <div key={task.id} className="flex items-center space-x-3 rounded-lg border border-border p-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary">
                            <div className={cn(
                              "h-3 w-3 rounded-full",
                              task.status === 'completed' && "bg-primary"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn(
                                "font-medium",
                                task.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </h4>
                              <span className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button variant="outline" className="w-full">
                        <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Add Task
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 