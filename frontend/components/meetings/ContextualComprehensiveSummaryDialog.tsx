'use client';

import React from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContextualComprehensiveSummaryDialogProps {
  dialogId: string;
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
  handleClose: () => void;
}

export function ContextualComprehensiveSummaryDialog({
  dialogId,
  summary,
  handleClose
}: ContextualComprehensiveSummaryDialogProps) {
  console.log("⭐⭐⭐ CONTEXTUAL COMPREHENSIVE SUMMARY DIALOG - Rendering");
  
  if (!summary) {
    console.log("⭐⭐⭐ CONTEXTUAL COMPREHENSIVE SUMMARY DIALOG - No summary data, not rendering");
    return null;
  }

  return (
    <MeetingDialogContent 
      dialogId={dialogId}
      dialogType={MeetingDialogType.COMPREHENSIVE_SUMMARY}
      title="Comprehensive AI Meeting Summary"
      onClose={handleClose}
    >
      <div className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-4">
        <p className="text-sm text-muted-foreground mb-4">
          AI-generated summary and insights from your meeting
        </p>
        
        <Tabs defaultValue="summary" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="actions">Action Items</TabsTrigger>
            <TabsTrigger value="company">Company Analysis</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="summary" className="mt-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Meeting Summary</h3>
                <p className="text-sm whitespace-pre-line">{summary.summary}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Key Insights</h3>
                {summary.insights && summary.insights.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {summary.insights.map((insight, index) => (
                      <li key={index} className="text-sm">{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No insights available.</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-2">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Action Items</h3>
                {summary.action_items && summary.action_items.length > 0 ? (
                  <div>
                    <ul className="list-disc pl-5 space-y-2">
                      {summary.action_items.map((action, index) => (
                        <li key={index} className="text-sm">{action}</li>
                      ))}
                    </ul>
                    
                    <h3 className="text-lg font-medium mt-6">Next Steps</h3>
                    {summary.next_steps && summary.next_steps.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {summary.next_steps.map((step, index) => (
                          <li key={index} className="text-sm">{step}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No next steps specified.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No action items available.</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="company" className="mt-2">
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
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </MeetingDialogContent>
  );
} 