import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { AIEmailGenerationRequest } from '../../types/email';

interface AIEmailGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (generated: { subject: string; content: string }) => void;
  lead: any; // Using any to accommodate different lead types
}

const AIEmailGenerator: React.FC<AIEmailGeneratorProps> = ({
  isOpen,
  onClose,
  onGenerate,
  lead,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [purpose, setPurpose] = useState<AIEmailGenerationRequest['purpose']>('initial_contact');
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // In a real app, you would call your API to generate the email
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated email based on the selected purpose and tone
      let subject = '';
      let content = '';
      
      // Generate subject based on purpose
      switch (purpose) {
        case 'initial_contact':
          subject = `Introduction from Your Company to ${lead.company_name || lead.company || 'Your Business'}`;
          break;
        case 'follow_up':
          subject = `Following up on our conversation - Next steps for ${lead.company_name || lead.company || 'your business'}`;
          break;
        case 'proposal':
          subject = `Proposal for ${lead.company_name || lead.company || 'Your Business'} - Customized Solution`;
          break;
        case 'meeting_request':
          subject = `Request for a meeting to discuss potential collaboration`;
          break;
        case 'thank_you':
          subject = `Thank you for your time, ${lead.first_name || 'there'}`;
          break;
        default:
          subject = `Regarding our potential collaboration`;
      }
      
      // Generate content based on purpose and tone
      const greeting = `Dear ${lead.first_name || 'there'},`;
      let body = '';
      let closing = '';
      
      // Body based on purpose
      switch (purpose) {
        case 'initial_contact':
          body = `I hope this email finds you well. I recently came across ${lead.company_name || lead.company || 'your business'} and was impressed by your work in the industry.

I'm reaching out because I believe our services could be valuable for your business. We specialize in helping companies like yours to improve their operations and achieve better results.

Would you be interested in learning more about how we might be able to help ${lead.company_name || lead.company || 'your business'}? I'd be happy to schedule a brief call to discuss this further.`;
          break;
        case 'follow_up':
          body = `I wanted to follow up on our previous conversation about how we might be able to support your goals at ${lead.company_name || lead.company || 'your business'}.

I've been thinking about the challenges you mentioned, and I believe we have some solutions that could be particularly effective for your situation. I'd love to share these ideas with you.

Have you had a chance to consider the information I shared previously? I'm available to answer any questions you might have.`;
          break;
        case 'proposal':
          body = `Based on our previous discussions about your needs at ${lead.company_name || lead.company || 'your business'}, I'm pleased to present a customized proposal for your consideration.

Our solution addresses the key challenges you mentioned, particularly regarding ${context || 'your business goals'}. We've designed an approach that will help you achieve measurable results while staying within your budget constraints.

I've attached the full proposal for your review. I'd be happy to walk you through the details and answer any questions you might have.`;
          break;
        case 'meeting_request':
          body = `I hope you're doing well. I'd like to schedule a meeting to discuss how we can support your goals at ${lead.company_name || lead.company || 'your business'}.

During this meeting, I'd like to explore your current challenges and share some insights on how our solutions have helped similar businesses in your industry.

Would you be available for a 30-minute call next week? Please let me know what times would work best for your schedule.`;
          break;
        case 'thank_you':
          body = `Thank you for taking the time to meet with me yesterday. I really enjoyed our conversation about ${context || 'your business needs'} and learning more about ${lead.company_name || lead.company || 'your business'}.

I'm excited about the possibility of working together and helping you achieve your goals. As promised, I'll send over the additional information we discussed in the next few days.

Please don't hesitate to reach out if you have any questions in the meantime.`;
          break;
        default:
          body = `I hope this email finds you well. I wanted to reach out regarding our potential collaboration and discuss how we might be able to support your goals at ${lead.company_name || lead.company || 'your business'}.

I believe our expertise in the industry could be valuable for addressing your specific needs, particularly regarding ${context || 'your business challenges'}.

I'd love to continue our conversation and explore how we can work together effectively.`;
      }
      
      // Closing based on tone
      switch (tone) {
        case 'professional':
          closing = `Best regards,\n[Your Name]\n[Your Position]\n[Your Company]`;
          break;
        case 'friendly':
          closing = `Warm regards,\n[Your Name]\n[Your Company]`;
          break;
        case 'formal':
          closing = `Sincerely,\n[Your Name]\n[Your Position]\n[Your Company]`;
          break;
        case 'casual':
          closing = `Cheers,\n[Your Name]\n[Your Company]`;
          break;
        default:
          closing = `Best regards,\n[Your Name]\n[Your Company]`;
      }
      
      // Combine all parts into HTML content
      content = `<p>${greeting}</p><p>${body.replace(/\n\n/g, '</p><p>')}</p><p>${closing.replace(/\n/g, '<br>')}</p>`;
      
      onGenerate({ subject, content });
      
      toast({
        title: 'Email generated',
        description: 'AI-generated email is ready for review and editing',
      });
    } catch (error) {
      console.error('Failed to generate email:', error);
      toast({
        title: 'Failed to generate email',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Email with AI</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">Email Purpose</Label>
            <Select
              value={purpose}
              onValueChange={(value) => setPurpose(value as AIEmailGenerationRequest['purpose'])}
            >
              <SelectTrigger id="purpose">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial_contact">Initial Contact</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="meeting_request">Meeting Request</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tone">Email Tone</Label>
            <Select
              value={tone}
              onValueChange={setTone}
            >
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Add any specific details or context for the AI to consider..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIEmailGenerator; 