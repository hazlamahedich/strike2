/**
 * Utility functions for working with dialogs
 */

/**
 * Opens a meeting dialog with the specified ID
 * @param dialogId The ID of the dialog to open
 * @returns true if the dialog was opened, false otherwise
 */
export function openMeetingDialog(dialogId: string): boolean {
  if (typeof window !== 'undefined' && window.meetingDialogs && window.meetingDialogs[dialogId]) {
    window.meetingDialogs[dialogId].open();
    return true;
  }
  
  console.error(`Meeting dialog with ID "${dialogId}" not found`);
  return false;
}

/**
 * Closes a meeting dialog with the specified ID
 * @param dialogId The ID of the dialog to close
 * @returns true if the dialog was closed, false otherwise
 */
export function closeMeetingDialog(dialogId: string): boolean {
  if (typeof window !== 'undefined' && window.meetingDialogs && window.meetingDialogs[dialogId]) {
    window.meetingDialogs[dialogId].close();
    return true;
  }
  
  console.error(`Meeting dialog with ID "${dialogId}" not found`);
  return false;
} 