"use client";

import React, { useEffect } from "react";
import {
  ImprovedDialogContent,
  ImprovedDialogHeader,
  ImprovedDialogFooter,
} from "../ui/improved-dialog";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useImprovedDialog } from "@/lib/contexts/ImprovedDialogContext";

interface ComprehensiveSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    summary: string;
    insights: string[];
    action_items: string[];
    next_steps: string[];
    company_analysis?: {
      company_summary?: string;
      industry?: string;
      company_size_estimate?: string;
      strengths?: string[];
      potential_pain_points?: string[];
    };
  } | null;
}

const ImprovedComprehensiveSummaryDialog: React.FC<ComprehensiveSummaryDialogProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  const { openDialog, closeDialog } = useImprovedDialog();
  const dialogId = "comprehensive-summary-dialog";
  
  useEffect(() => {
    if (isOpen && summary) {
      openDialog(
        dialogId,
        <ImprovedDialogContent dialogId={dialogId} className="sm:max-w-3xl max-h-[90vh]">
          <ImprovedDialogHeader>
            <h2 className="text-lg font-semibold">Comprehensive AI Meeting Summary</h2>
            <p className="text-sm text-muted-foreground">
              AI-generated summary and insights from your meeting
            </p>
          </ImprovedDialogHeader>
          
          <Tabs defaultValue="summary" className="w-full flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="actions">Action Items</TabsTrigger>
              <TabsTrigger value="company">Company Analysis</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="summary" className="mt-0 p-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Meeting Summary</h3>
                  <p className="text-sm whitespace-pre-wrap">{summary.summary}</p>
                  
                  {summary.next_steps && summary.next_steps.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">Next Steps</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {summary.next_steps.map((item, index) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0 p-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Key Insights</h3>
                  {summary.insights && summary.insights.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {summary.insights.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No insights available.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="mt-0 p-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Action Items</h3>
                  {summary.action_items && summary.action_items.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {summary.action_items.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No action items available.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="company" className="mt-0 p-1">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Analysis</h3>
                  
                  {summary.company_analysis ? (
                    <>
                      {summary.company_analysis.company_summary && (
                        <div className="mt-2">
                          <h4 className="text-md font-medium">Company Summary</h4>
                          <p className="text-sm">{summary.company_analysis.company_summary}</p>
                        </div>
                      )}
                      
                      {summary.company_analysis.industry && (
                        <div className="mt-2">
                          <h4 className="text-md font-medium">Industry</h4>
                          <p className="text-sm">{summary.company_analysis.industry}</p>
                        </div>
                      )}
                      
                      {summary.company_analysis.company_size_estimate && (
                        <div className="mt-2">
                          <h4 className="text-md font-medium">Company Size Estimate</h4>
                          <p className="text-sm">{summary.company_analysis.company_size_estimate}</p>
                        </div>
                      )}
                      
                      {summary.company_analysis.strengths && summary.company_analysis.strengths.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-md font-medium">Strengths</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {summary.company_analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {summary.company_analysis.potential_pain_points && summary.company_analysis.potential_pain_points.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-md font-medium">Potential Pain Points</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {summary.company_analysis.potential_pain_points.map((painPoint, index) => (
                              <li key={index} className="text-sm">{painPoint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No company analysis available.</p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <ImprovedDialogFooter className="mt-4">
            <Button onClick={() => {
              closeDialog(dialogId);
              onClose();
            }}>Close</Button>
          </ImprovedDialogFooter>
        </ImprovedDialogContent>
      );
    } else if (!isOpen) {
      closeDialog(dialogId);
    }
  }, [isOpen, summary, openDialog, closeDialog, onClose]);
  
  // The actual rendering is handled by ImprovedDialogContainer
  return null;
};

export default ImprovedComprehensiveSummaryDialog; 