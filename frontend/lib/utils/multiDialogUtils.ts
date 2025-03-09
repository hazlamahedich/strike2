/**
 * Utility functions for working with multiple dialogs
 */

// Type definition for dialog IDs
export type DialogId = string;

/**
 * Generate a unique dialog ID
 * @param prefix Optional prefix for the dialog ID
 * @returns A unique dialog ID
 */
export function generateDialogId(prefix: string = 'dialog'): DialogId {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create a set of dialog IDs for a specific feature or component
 * @param basePrefix The base prefix for all dialog IDs
 * @param dialogNames Array of dialog names
 * @returns An object with dialog IDs
 * 
 * @example
 * const LEAD_DIALOGS = createDialogIdSet('lead', ['create', 'edit', 'view', 'delete']);
 * // Result: { CREATE: 'lead-create', EDIT: 'lead-edit', VIEW: 'lead-view', DELETE: 'lead-delete' }
 */
export function createDialogIdSet<T extends string>(
  basePrefix: string,
  dialogNames: T[]
): Record<Uppercase<T>, DialogId> {
  return dialogNames.reduce((acc, name) => {
    const uppercaseName = name.toUpperCase() as Uppercase<T>;
    acc[uppercaseName] = `${basePrefix}-${name}`;
    return acc;
  }, {} as Record<Uppercase<T>, DialogId>);
}

/**
 * Position a dialog relative to a trigger element
 * @param dialogElement The dialog element to position
 * @param triggerElement The trigger element that opened the dialog
 * @param offset Optional offset from the trigger element
 */
export function positionDialogRelativeToTrigger(
  dialogElement: HTMLElement,
  triggerElement: HTMLElement,
  offset: { x: number; y: number } = { x: 0, y: 10 }
): void {
  if (!dialogElement || !triggerElement) return;

  const triggerRect = triggerElement.getBoundingClientRect();
  const dialogRect = dialogElement.getBoundingClientRect();
  
  // Calculate the position
  let left = triggerRect.left + offset.x;
  let top = triggerRect.bottom + offset.y;
  
  // Adjust if the dialog would go off-screen
  const rightEdge = left + dialogRect.width;
  const bottomEdge = top + dialogRect.height;
  
  if (rightEdge > window.innerWidth) {
    left = window.innerWidth - dialogRect.width - 10;
  }
  
  if (bottomEdge > window.innerHeight) {
    top = triggerRect.top - dialogRect.height - offset.y;
  }
  
  // Apply the position
  dialogElement.style.position = 'fixed';
  dialogElement.style.left = `${left}px`;
  dialogElement.style.top = `${top}px`;
} 