'use client';

import React from 'react';
import { CrmLayout } from '../../components/crm/CrmLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';

export default function CrmPage() {
  return (
    <CrmLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">CRM Dashboard</h1>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Welcome to your CRM Dashboard</h2>
                <p className="text-muted-foreground">
                  This is a modern, single-screen CRM interface that provides all the tools you need to manage your customer relationships efficiently.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Contacts</h3>
                      <p className="text-sm text-muted-foreground">Manage your contacts and track relationship health.</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Deals</h3>
                      <p className="text-sm text-muted-foreground">Track your sales pipeline and manage deals.</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Tasks</h3>
                      <p className="text-sm text-muted-foreground">Manage your tasks and follow-ups.</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contacts">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Contacts</h2>
                <p className="text-muted-foreground">
                  View and manage your contacts here. The full implementation will include contact cards with relationship health indicators.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deals">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Deal Pipeline</h2>
                <p className="text-muted-foreground">
                  Manage your sales pipeline here. The full implementation will include a drag-and-drop deal pipeline.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="communications">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Communications</h2>
                <p className="text-muted-foreground">
                  View and manage your communications here. The full implementation will include email, call, and meeting logs.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Analytics</h2>
                <p className="text-muted-foreground">
                  View your sales analytics here. The full implementation will include charts and metrics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CrmLayout>
  );
} 