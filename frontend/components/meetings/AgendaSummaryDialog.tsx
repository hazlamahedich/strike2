"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { PlusCircle } from "lucide-react";

interface AgendaSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agendaItems: string[];
  meetingType?: string;
  onAddToMeeting?: () => void;
}

const AgendaSummaryDialog: React.FC<AgendaSummaryDialogProps> = ({
  isOpen,
  onClose,
  agendaItems,
  meetingType,
  onAddToMeeting,
}) => {
  // Format meeting type for display (convert from enum format)
  const formatMeetingType = (type?: string) => {
    if (!type) return "Meeting";
    
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Suggested Agenda</DialogTitle>
          <DialogDescription>
            {formatMeetingType(meetingType)} Meeting Agenda
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter className="mt-4 flex justify-between">
          {onAddToMeeting && agendaItems.length > 0 && (
            <Button 
              onClick={() => {
                onAddToMeeting();
                onClose();
              }}
              className="mr-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Meeting
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgendaSummaryDialog; 