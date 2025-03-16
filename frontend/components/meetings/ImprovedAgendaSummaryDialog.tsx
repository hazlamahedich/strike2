"use client";

import React, { useEffect } from "react";
import {
  ImprovedDialogContent,
  ImprovedDialogHeader,
  ImprovedDialogFooter,
} from "../ui/improved-dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { useImprovedDialog } from "@/lib/contexts/ImprovedDialogContext";

interface AgendaSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agendaItems: string[];
  meetingType?: string;
  onAddToMeeting?: () => void;
}

const ImprovedAgendaSummaryDialog: React.FC<AgendaSummaryDialogProps> = ({
  isOpen,
  onClose,
  agendaItems,
  meetingType,
  onAddToMeeting,
}) => {
  const { openDialog, closeDialog } = useImprovedDialog();
  const dialogId = "agenda-summary-dialog";
  
  // Format meeting type for display (convert from enum format)
  const formatMeetingType = (type?: string) => {
    if (!type) return "Meeting";
    
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  useEffect(() => {
    if (isOpen) {
      openDialog(
        dialogId,
        <ImprovedDialogContent dialogId={dialogId} className="sm:max-w-md">
          <ImprovedDialogHeader>
            <h2 className="text-lg font-semibold">AI Suggested Agenda</h2>
            <p className="text-sm text-muted-foreground">
              {formatMeetingType(meetingType)} Meeting Agenda
            </p>
          </ImprovedDialogHeader>
          
          <ScrollArea className="max-h-[60vh] mt-4 p-1">
            <div className="space-y-2">
              {agendaItems.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {agendaItems.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No agenda items available. Try generating some suggestions.
                </p>
              )}
            </div>
          </ScrollArea>
          
          <ImprovedDialogFooter className="mt-4 flex justify-between">
            {onAddToMeeting && agendaItems.length > 0 && (
              <Button 
                onClick={() => {
                  onAddToMeeting();
                  closeDialog(dialogId);
                  onClose();
                }}
                className="mr-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to Meeting
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              closeDialog(dialogId);
              onClose();
            }}>
              Close
            </Button>
          </ImprovedDialogFooter>
        </ImprovedDialogContent>
      );
    } else {
      closeDialog(dialogId);
    }
  }, [isOpen, agendaItems, meetingType, onAddToMeeting, openDialog, closeDialog, onClose]);
  
  // The actual rendering is handled by ImprovedDialogContainer
  return null;
};

export default ImprovedAgendaSummaryDialog; 