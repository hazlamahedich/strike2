'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { Toaster } from '../../../components/ui/toaster';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { getEmailTemplates } from '../../../lib/services/emailService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch templates on page load
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await getEmailTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Failed to load templates',
          description: 'There was an error loading your email templates. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [toast]);
  
  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle template creation
  const handleCreateTemplate = () => {
    toast({
      title: 'Create Template',
      description: 'Template creation functionality will be implemented soon.',
    });
  };
  
  // Handle template editing
  const handleEditTemplate = (id: string) => {
    toast({
      title: 'Edit Template',
      description: `Template editing for ID: ${id} will be implemented soon.`,
    });
  };
  
  // Handle template deletion
  const handleDeleteTemplate = (id: string) => {
    toast({
      title: 'Delete Template',
      description: `Template deletion for ID: ${id} will be implemented soon.`,
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading templates...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription className="truncate">{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none h-24 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: template.content }}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditTemplate(template.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">No templates found. Create your first template to get started.</p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      )}
      
      <Toaster />
    </div>
  );
} 