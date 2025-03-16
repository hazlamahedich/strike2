import { useState, useEffect } from 'react';
import { MeetingList } from './MeetingList';
import { MeetingCalendar } from './MeetingCalendar';
import { EnhancedCalendar, EnhancedCalendarWithProvider } from './EnhancedCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimpleMeetingForm } from './SimpleMeetingForm';
import { toast } from '@/components/ui/use-toast';

export function MeetingView() {
  const [activeView, setActiveView] = useState('list');
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  // Store the active view in localStorage to persist between page refreshes
  useEffect(() => {
    try {
      // Try to get the saved view from localStorage
      const savedView = localStorage.getItem('meetingsActiveView');
      console.log('Loaded saved view from localStorage:', savedView);
      if (savedView === 'list' || savedView === 'fullcalendar') {
        setActiveView(savedView);
      }
    } catch (err) {
      console.error('Error loading saved view from localStorage:', err);
      // If there's an error accessing localStorage, just use the default view
    }
  }, []);
  
  // Update localStorage when the view changes
  const handleViewChange = (value: string) => {
    try {
      console.log('View changed to:', value);
      setActiveView(value);
      localStorage.setItem('meetingsActiveView', value);
    } catch (err) {
      console.error('Error saving view to localStorage:', err);
      setError('Failed to save view preference. Your preference may not persist between page refreshes.');
    }
  };

  const handleScheduleSuccess = () => {
    try {
      console.log('Meeting scheduled successfully');
      setShowDialog(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Meeting has been scheduled successfully.",
      });
      
      // Refresh the page to show the new meeting
      window.location.reload();
    } catch (err) {
      console.error('Error handling schedule success:', err);
      setError('Failed to complete the scheduling process. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={() => setShowDialog(true)}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>
      
      {/* Meeting scheduling dialog */}
      {showDialog && (
        <Dialog 
          open={true} 
          onOpenChange={(open) => {
            console.log('Dialog open state changed:', open);
            setShowDialog(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
            </DialogHeader>
            <SimpleMeetingForm 
              onSuccess={handleScheduleSuccess} 
              onCancel={() => {
                console.log('Meeting form canceled');
                setShowDialog(false);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      <Tabs 
        defaultValue="list" 
        value={activeView} 
        onValueChange={handleViewChange}
        className="w-full"
      >
        <div className="flex justify-end mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="fullcalendar" className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              Enhanced Calendar
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="mt-0 w-full">
          <MeetingList />
        </TabsContent>
        
        <TabsContent value="fullcalendar" className="mt-0 w-full">
          <EnhancedCalendarWithProvider />
        </TabsContent>
      </Tabs>
    </div>
  );
} 