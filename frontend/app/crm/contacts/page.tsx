'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock contacts data
  const contacts = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane.smith@acme.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Inc.',
      position: 'Marketing Director',
      status: 'Active',
      tags: ['VIP', 'Marketing'],
      lastContacted: '2023-06-15',
      avatar: '',
    },
    {
      id: '2',
      name: 'John Doe',
      email: 'john.doe@techcorp.com',
      phone: '+1 (555) 987-6543',
      company: 'TechCorp',
      position: 'CEO',
      status: 'Active',
      tags: ['Decision Maker'],
      lastContacted: '2023-06-10',
      avatar: '',
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      email: 'sarah.j@innosoft.com',
      phone: '+1 (555) 456-7890',
      company: 'InnoSoft',
      position: 'Product Manager',
      status: 'Active',
      tags: ['Product', 'Tech'],
      lastContacted: '2023-06-05',
      avatar: '',
    },
    {
      id: '4',
      name: 'Michael Brown',
      email: 'michael.b@globaltech.com',
      phone: '+1 (555) 234-5678',
      company: 'GlobalTech Inc.',
      position: 'CTO',
      status: 'Inactive',
      tags: ['Technical', 'Decision Maker'],
      lastContacted: '2023-05-20',
      avatar: '',
    },
    {
      id: '5',
      name: 'Emily Davis',
      email: 'emily.d@nextstep.com',
      phone: '+1 (555) 876-5432',
      company: 'NextStep Solutions',
      position: 'Sales Manager',
      status: 'Active',
      tags: ['Sales'],
      lastContacted: '2023-06-12',
      avatar: '',
    },
  ];
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.position.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and companies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Contact
          </Button>
          <Button variant="outline">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 16.5L12 21.75L21 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 12L12 17.25L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 7.5L12 12.75L21 7.5L12 2.25L3 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Import
          </Button>
        </div>
      </div>
      
      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All Contacts</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-64">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
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
            type="text"
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            {filteredContacts.length} contacts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground">{contact.position} at {contact.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm">{contact.email}</span>
                    <span className="text-sm text-muted-foreground">{contact.phone}</span>
                  </div>
                  <div className="flex space-x-1">
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <Badge 
                    className={contact.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}
                  >
                    {contact.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium">No contacts found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 