import { useEffect, useRef } from 'react';
import { MeetingForm } from './MeetingForm';
import { Lead } from '@/lib/types/lead';

type MeetingDialogProps = {
  id: string;
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MeetingDialog({ id, lead, onSuccess, onCancel }: MeetingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Method to open the dialog
  const open = () => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  // Method to close the dialog
  const close = () => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  };

  // Expose methods to window for external access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a namespace for our dialogs if it doesn't exist
      if (!window.meetingDialogs) {
        window.meetingDialogs = {};
      }
      
      // Add this dialog's methods to the namespace
      window.meetingDialogs[id] = {
        open,
        close
      };
      
      // Cleanup when component unmounts
      return () => {
        if (window.meetingDialogs && window.meetingDialogs[id]) {
          delete window.meetingDialogs[id];
        }
      };
    }
  }, [id]);

  return (
    <dialog 
      id={id}
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-[600px] w-full"
      style={{ margin: 'auto' }}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Schedule a Meeting</h3>
          <button 
            type="button"
            className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              close();
              if (onCancel) onCancel();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <MeetingForm 
          lead={lead}
          onSuccess={() => {
            console.log('Form success callback triggered');
            close();
            if (onSuccess) onSuccess();
          }} 
          onCancel={() => {
            console.log('Form cancel callback triggered');
            close();
            if (onCancel) onCancel();
          }} 
        />
      </div>
    </dialog>
  );
}

// Add type definition for the window object
declare global {
  interface Window {
    meetingDialogs?: {
      [key: string]: {
        open: () => void;
        close: () => void;
      };
    };
  }
} 