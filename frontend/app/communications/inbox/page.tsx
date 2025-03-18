'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Search, 
  Mail, 
  MailOpen, 
  Trash2, 
  Tag, 
  Filter, 
  RefreshCw, 
  Paperclip,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  Check,
  Reply
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../../../components/ui/dropdown-menu';
import { useToast } from '../../../components/ui/use-toast';
import { getReceivedEmails, ReceivedEmail } from '../../../lib/services/emailService';

// Import the Checkbox component directly from @radix-ui/react-checkbox
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "../../../lib/utils";

// Create a simple Checkbox component
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

// Create a simple Skeleton component
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export default function InboxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<ReceivedEmail[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<'received_at' | 'from' | 'subject'>('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterUnread, setFilterUnread] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [starredEmails, setStarredEmails] = useState<string[]>([]);

  // Fetch emails on component mount
  useEffect(() => {
    fetchEmails();
  }, []);

  // Apply filters and search when emails, searchQuery, or filters change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [emails, searchQuery, filterUnread, sortField, sortDirection]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const data = await getReceivedEmails();
      setEmails(data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Failed to load emails',
        description: 'There was an error loading your emails. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...emails];

    // Apply unread filter if enabled
    if (filterUnread) {
      result = result.filter(email => !email.read);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        email =>
          email.subject.toLowerCase().includes(query) ||
          email.from.toLowerCase().includes(query) ||
          email.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'received_at') {
        return sortDirection === 'asc'
          ? new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
          : new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
      } else {
        const aValue = a[sortField].toLowerCase();
        const bValue = b[sortField].toLowerCase();
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    setFilteredEmails(result);
  };

  const handleSort = (field: 'received_at' | 'from' | 'subject') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmails(prev => 
      prev.includes(id) 
        ? prev.filter(emailId => emailId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map(email => email.id));
    }
  };

  const handleMarkAsRead = (ids: string[] = selectedEmails) => {
    if (ids.length === 0) return;
    
    // Update the emails state to mark selected emails as read
    setEmails(prev => 
      prev.map(email => 
        ids.includes(email.id) ? { ...email, read: true } : email
      )
    );
    
    toast({
      title: 'Emails marked as read',
      description: `${ids.length} email(s) marked as read.`,
    });
    
    // Clear selection after action
    setSelectedEmails([]);
  };

  const handleMarkAsUnread = (ids: string[] = selectedEmails) => {
    if (ids.length === 0) return;
    
    // Update the emails state to mark selected emails as unread
    setEmails(prev => 
      prev.map(email => 
        ids.includes(email.id) ? { ...email, read: false } : email
      )
    );
    
    toast({
      title: 'Emails marked as unread',
      description: `${ids.length} email(s) marked as unread.`,
    });
    
    // Clear selection after action
    setSelectedEmails([]);
  };

  const handleDelete = (ids: string[] = selectedEmails) => {
    if (ids.length === 0) return;
    
    // Remove the selected emails from the state
    setEmails(prev => prev.filter(email => !ids.includes(email.id)));
    
    toast({
      title: 'Emails deleted',
      description: `${ids.length} email(s) moved to trash.`,
    });
    
    // Clear selection after action
    setSelectedEmails([]);
  };

  const handleRefresh = () => {
    fetchEmails();
    toast({
      title: 'Refreshing inbox',
      description: 'Checking for new emails...',
    });
  };

  const toggleEmailExpand = (id: string) => {
    if (expandedEmail === id) {
      setExpandedEmail(null);
    } else {
      setExpandedEmail(id);
      // Mark as read when expanded
      if (!emails.find(email => email.id === id)?.read) {
        handleMarkAsRead([id]);
      }
    }
  };

  const toggleStarEmail = (id: string, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation(); // Prevent row click event
    
    setStarredEmails(prev => 
      prev.includes(id) 
        ? prev.filter(emailId => emailId !== id) 
        : [...prev, id]
    );
  };

  const handleReply = (email: ReceivedEmail) => {
    // Store the reply data in localStorage to be used by the compose form
    const replyData = {
      to: email.from,
      subject: `Re: ${email.subject}`,
      content: `
        <br/><br/>
        <p>On ${format(new Date(email.received_at), 'PPpp')}, ${email.from} wrote:</p>
        <blockquote style="padding-left: 1rem; border-left: 2px solid #ccc; margin-left: 0.5rem;">
          ${email.content}
        </blockquote>
      `
    };
    
    localStorage.setItem('emailReplyData', JSON.stringify(replyData));
    
    // Navigate to the compose tab
    router.push('/communications?tab=compose');
    
    toast({
      title: 'Reply prepared',
      description: `Replying to ${email.from}`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    
    // Otherwise show the full date
    return format(date, 'MMM d, yyyy');
  };

  const renderEmailRow = (email: ReceivedEmail) => {
    const isExpanded = expandedEmail === email.id;
    const isSelected = selectedEmails.includes(email.id);
    const isStarred = starredEmails.includes(email.id);
    
    return (
      <div key={email.id} className="border-b last:border-b-0 dark:border-gray-700">
        <div 
          className={`flex items-center p-3 hover:bg-muted cursor-pointer ${
            isSelected ? 'bg-accent/20' : ''
          } ${!email.read ? 'font-semibold' : ''}`}
          onClick={() => toggleEmailExpand(email.id)}
        >
          <div className="flex items-center space-x-2 w-12">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => handleSelectEmail(email.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => toggleStarEmail(email.id, e)}>
              {isStarred ? (
                <Star className="h-4 w-4 text-yellow-400 cursor-pointer" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground cursor-pointer" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-medium truncate flex-1">{email.from}</span>
              <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                {formatDate(email.received_at)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="truncate flex-1">{email.subject}</span>
              {email.attachments && email.attachments.length > 0 && (
                <Paperclip className="h-4 w-4 text-muted-foreground ml-2" />
              )}
              {!email.read && (
                <div className="h-2 w-2 rounded-full bg-primary ml-2"></div>
              )}
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-muted/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{email.subject}</h3>
                <p className="text-sm text-muted-foreground">
                  From: <span className="font-medium">{email.from}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  To: <span>{email.to}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: <span>{format(new Date(email.received_at), 'PPpp')}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReply(email);
                  }}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete([email.id]);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    email.read 
                      ? handleMarkAsUnread([email.id])
                      : handleMarkAsRead([email.id]);
                  }}
                >
                  {email.read ? (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Mark as unread
                    </>
                  ) : (
                    <>
                      <MailOpen className="h-4 w-4 mr-1" />
                      Mark as read
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {email.labels && email.labels.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1">
                {email.labels.map((label, index) => (
                  <Badge key={index} variant="outline">{label}</Badge>
                ))}
              </div>
            )}
            
            <div 
              className="prose dark:prose-invert max-w-none mt-4 border-t pt-4 dark:border-gray-700"
              dangerouslySetInnerHTML={{ __html: email.content }}
            />
            
            {email.attachments && email.attachments.length > 0 && (
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-2">Attachments ({email.attachments.length})</h4>
                <div className="space-y-2">
                  {email.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center p-2 border rounded dark:border-gray-700 bg-background">
                      <Paperclip className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm flex-1">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Email Inbox</h1>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>
                {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}, {emails.filter(e => !e.read).length} unread
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search emails..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterUnread(!filterUnread)}>
                      <Checkbox 
                        checked={filterUnread} 
                        className="mr-2"
                      />
                      Show unread only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort
                      {sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('received_at')}>
                      {sortField === 'received_at' && (
                        <span className="mr-2">✓</span>
                      )}
                      Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('from')}>
                      {sortField === 'from' && (
                        <span className="mr-2">✓</span>
                      )}
                      Sender
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('subject')}>
                      {sortField === 'subject' && (
                        <span className="mr-2">✓</span>
                      )}
                      Subject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Email actions */}
            {selectedEmails.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedEmails.length} selected
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleMarkAsRead()}
                >
                  <MailOpen className="h-4 w-4 mr-1" />
                  Mark as read
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleMarkAsUnread()}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Mark as unread
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete()}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
            
            {/* Email list */}
            <div className="border rounded-md overflow-hidden dark:border-gray-700">
              <div className="bg-muted p-3 border-b dark:border-gray-700 flex items-center">
                <div className="flex items-center space-x-2 w-12">
                  <Checkbox 
                    checked={selectedEmails.length > 0 && selectedEmails.length === filteredEmails.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="flex-1 font-medium">
                  {selectedEmails.length > 0 
                    ? `${selectedEmails.length} selected` 
                    : 'Inbox'}
                </div>
              </div>
              
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredEmails.length > 0 ? (
                filteredEmails.map(renderEmailRow)
              ) : (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No emails found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Try adjusting your search or filters' 
                      : 'Your inbox is empty'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 