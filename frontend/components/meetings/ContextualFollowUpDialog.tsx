'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ClipboardList, Paperclip, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RichTextEditor from '../communications/RichTextEditor';
import { sendEmail } from '@/lib/services/communicationService';
import { scheduleFollowUpTask } from '@/lib/services/aiMeetingService';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';

interface ContextualFollowUpDialogProps {
  dialogId: string;
  leadEmail?: string;
  leadId?: string;
  leadName?: string;
  meetingId: string;
  followUpMessage: string;
  subject: string;
  handleClose: () => void;
}

interface TaskDetails {
  task_id: string;
  scheduled_date: string;
  title: string;
  description: string;
}

export function ContextualFollowUpDialog({
  dialogId,
  leadEmail,
  leadId,
  leadName,
  meetingId,
  followUpMessage,
  subject,
  handleClose
}: ContextualFollowUpDialogProps) {
  // State
  const [editableSubject, setEditableSubject] = useState<string>(subject);
  const [editableMessage, setEditableMessage] = useState<string>(followUpMessage);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState<boolean>(false);
  const [showTaskConfirmation, setShowTaskConfirmation] = useState<boolean>(false);
  const [scheduledTaskDetails, setScheduledTaskDetails] = useState<TaskDetails | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to attachments
      const newFiles = Array.from(e.target.files);
      
      // Check file sizes (SendGrid limit is 30MB total, but we'll limit individual files to 10MB)
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('File size exceeded', {
          description: `${oversizedFiles.length > 1 ? 'Some files are' : 'One file is'} larger than 10MB and cannot be attached.`,
        });
        
        // Filter out oversized files
        const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length > 0) {
          setAttachments([...attachments, ...validFiles]);
          
          // Show success toast for valid files
          toast.success('Files attached', {
            description: `${validFiles.length} ${validFiles.length === 1 ? 'file' : 'files'} attached successfully.`,
          });
        }
      } else {
        // All files are valid
        setAttachments([...attachments, ...newFiles]);
        
        // Show success toast
        toast.success('Files attached', {
          description: `${newFiles.length} ${newFiles.length === 1 ? 'file' : 'files'} attached successfully: ${newFiles.map(f => f.name).join(', ')}`,
        });
      }
      
      // Clear the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newAttachments = [...attachments];
    const removedFile = newAttachments[index];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    // Show toast for removed file
    toast.info('File removed', {
      description: `Removed ${removedFile.name}`,
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Schedule follow-up task
  const scheduleFollowUp = async (daysDelay: number = 3) => {
    setIsSchedulingFollowUp(true);
    try {
      console.log(`⭐⭐⭐ FOLLOW UP: Scheduling follow-up task for meeting ID: ${meetingId} with ${daysDelay} days delay`);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysDelay);
      
      const taskDetails = {
        title: `Follow up with ${leadName}`,
        description: `Follow up on meeting: ${editableSubject}`,
        due_date: dueDate.toISOString()
      };
      
      // Check if meeting ID is valid
      if (!meetingId) {
        throw new Error('Meeting ID is missing or invalid');
      }
      
      const { data, error } = await scheduleFollowUpTask(meetingId, taskDetails);
      
      console.log('⭐⭐⭐ FOLLOW UP: Schedule follow-up response:', { data, error });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      if (!data || !data.task_id) {
        console.error('Invalid response data:', data);
        throw new Error('Received invalid response data from the server');
      }
      
      toast.success('Follow-up task scheduled successfully');
      
      // Store the scheduled task details - use our local data since API only returns task_id
      setScheduledTaskDetails({
        task_id: data.task_id,
        scheduled_date: dueDate.toISOString(),
        title: taskDetails.title,
        description: taskDetails.description
      });
      
      // Show the task confirmation dialog
      setShowTaskConfirmation(true);
    } catch (error) {
      console.error('Error scheduling follow-up task:', error);
      
      // Get more detailed error information
      let errorMessage = 'Failed to schedule follow-up task';
      
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error('Error stack:', error.stack);
      }
      
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!leadEmail) {
      toast.error("No email address", {
        description: "This lead doesn't have an email address.",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Process attachments if any
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          return new Promise<{
            filename: string;
            content: string;
            content_type: string;
            size: number;
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64content = reader.result as string;
              // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
              const base64Data = base64content.split(',')[1];
              resolve({
                filename: file.name,
                content: base64Data,
                content_type: file.type,
                size: file.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      
      // Call the email service to send the email
      const response = await sendEmail({
        to: leadEmail,
        subject: editableSubject,
        content: editableMessage,
        lead_id: leadId ? Number(leadId) : undefined,
        attachments: processedAttachments,
      });
      
      toast.success('Email sent successfully', {
        description: `Your email to ${leadEmail} has been sent.`,
      });
      
      // Close the dialog after sending
      handleClose();
      
      // Log the activity
      console.log('⭐⭐⭐ FOLLOW UP: Email sent:', {
        to: leadEmail,
        subject: editableSubject,
        attachments: attachments.map(file => file.name),
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email', {
        description: 'There was an error sending your email. Please try again.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.EMAIL}
      title="AI-Generated Follow-up"
      onClose={handleClose}
    >
      <div className="p-4">
        {showTaskConfirmation && scheduledTaskDetails ? (
          <div className="space-y-4 overflow-x-auto">
            <div className="overflow-y-auto styled-scrollbar" style={{ maxHeight: '60vh' }}>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium mb-2 text-green-800 dark:text-green-300 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Task Scheduled Successfully
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Task ID:</span> {scheduledTaskDetails.task_id}</p>
                  <p><span className="font-medium">Title:</span> {scheduledTaskDetails.title}</p>
                  <p><span className="font-medium">Description:</span> {scheduledTaskDetails.description}</p>
                  <p><span className="font-medium">Due Date:</span> {format(new Date(scheduledTaskDetails.scheduled_date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="default"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            <div className="overflow-y-auto styled-scrollbar" style={{ maxHeight: '60vh' }}>
              <div>
                <h3 className="text-sm font-medium mb-2">Subject</h3>
                <Input 
                  value={editableSubject}
                  onChange={(e) => setEditableSubject(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Message</h3>
                <RichTextEditor
                  content={editableMessage}
                  onChange={setEditableMessage}
                  placeholder="Edit your follow-up message here..."
                  className="min-h-[300px]"
                />
              </div>
              
              {/* File Attachments */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Attachments</h3>
                  <div className="text-sm text-muted-foreground">
                    {attachments.length > 0 
                      ? attachments.length === 1 
                        ? `1 file attached: ${attachments[0].name}` 
                        : `${attachments.length} files attached: ${attachments.map(file => file.name).join(', ')}`
                      : 'No files attached'
                    }
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    id="follow-up-file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    multiple
                  />
                  <label
                    htmlFor="follow-up-file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach Files
                  </label>
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  <p>SendGrid supports most common file types (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, etc.)</p>
                  <p>Maximum file size: 10MB per file, 30MB total. Executable files (.exe, .bat, etc.) are not allowed.</p>
                </div>
                
                {attachments.length > 0 && (
                  <div className="border rounded-md p-2 space-y-2 max-h-[150px] overflow-y-auto">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-accent/50 rounded-md p-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              
              <Button
                variant="default"
                onClick={() => scheduleFollowUp(3)}
                disabled={isSchedulingFollowUp}
              >
                <ClipboardList className="mr-1 h-4 w-4" />
                {isSchedulingFollowUp ? 'Scheduling...' : 'Schedule Follow-up Task'}
              </Button>
              
              <Button
                variant="default"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !leadEmail}
              >
                <Send className="mr-1 h-4 w-4" />
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MeetingDialogContent>
  );
} 