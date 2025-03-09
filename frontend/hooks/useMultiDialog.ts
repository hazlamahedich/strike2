import { useDialog } from '@/lib/contexts/DialogContext';
import { DialogId, generateDialogId } from '@/lib/utils/multiDialogUtils';
import { useCallback, useMemo } from 'react';

interface UseMultiDialogOptions {
  /**
   * Optional ID for the dialog. If not provided, a unique ID will be generated.
   */
  id?: DialogId;
  
  /**
   * Optional prefix for the generated dialog ID.
   * Only used if id is not provided.
   */
  prefix?: string;
  
  /**
   * Optional initial state for the dialog.
   * Default is false (closed).
   */
  initialOpen?: boolean;
}

interface UseMultiDialogResult {
  /**
   * The ID of the dialog.
   */
  dialogId: DialogId;
  
  /**
   * Whether the dialog is currently open.
   */
  isOpen: boolean;
  
  /**
   * Function to open the dialog.
   */
  open: () => void;
  
  /**
   * Function to close the dialog.
   */
  close: () => void;
  
  /**
   * Function to toggle the dialog's open state.
   */
  toggle: () => void;
  
  /**
   * Props to pass to the MultiDialog component.
   */
  dialogProps: {
    dialogId: DialogId;
  };
  
  /**
   * Props to pass to the MultiDialogContent component.
   */
  contentProps: {
    dialogId: DialogId;
  };
}

/**
 * Hook for working with multiple dialogs.
 * 
 * @example
 * const { dialogId, isOpen, open, close, toggle, dialogProps, contentProps } = useMultiDialog({
 *   prefix: 'lead-edit',
 * });
 * 
 * return (
 *   <>
 *     <Button onClick={open}>Open Dialog</Button>
 *     
 *     <MultiDialog {...dialogProps}>
 *       <MultiDialogContent {...contentProps}>
 *         <MultiDialogHeader>
 *           <MultiDialogTitle>Edit Lead</MultiDialogTitle>
 *         </MultiDialogHeader>
 *         <div>Dialog content here...</div>
 *       </MultiDialogContent>
 *     </MultiDialog>
 *   </>
 * );
 */
export function useMultiDialog(options: UseMultiDialogOptions = {}): UseMultiDialogResult {
  const { id, prefix = 'dialog', initialOpen = false } = options;
  
  // Get the dialog context
  const { openDialog, closeDialog, toggleDialog, isDialogOpen } = useDialog();
  
  // Generate a stable dialog ID
  const dialogId = useMemo(() => {
    return id || generateDialogId(prefix);
  }, [id, prefix]);
  
  // Initialize the dialog state if needed
  useMemo(() => {
    if (initialOpen) {
      openDialog(dialogId);
    }
  }, [dialogId, initialOpen, openDialog]);
  
  // Create memoized handlers
  const open = useCallback(() => {
    openDialog(dialogId);
  }, [dialogId, openDialog]);
  
  const close = useCallback(() => {
    closeDialog(dialogId);
  }, [dialogId, closeDialog]);
  
  const toggle = useCallback(() => {
    toggleDialog(dialogId);
  }, [dialogId, toggleDialog]);
  
  // Create memoized props
  const dialogProps = useMemo(() => ({
    dialogId,
  }), [dialogId]);
  
  const contentProps = useMemo(() => ({
    dialogId,
  }), [dialogId]);
  
  return {
    dialogId,
    isOpen: isDialogOpen(dialogId),
    open,
    close,
    toggle,
    dialogProps,
    contentProps,
  };
} 