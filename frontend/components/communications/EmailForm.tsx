import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import RichTextEditor from './RichTextEditor';
import { EmailFormValues } from '../../types/email';
import { Loader2, Send, FileText, Sparkles } from 'lucide-react';

const formSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Email content is required' }),
  lead_id: z.string(),
});

interface EmailFormProps {
  initialData: Partial<EmailFormValues>;
  onSubmit: (data: EmailFormValues) => Promise<void>;
  onUseTemplate: () => void;
  onGenerateWithAI: () => void;
  isSubmitting?: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({
  initialData,
  onSubmit,
  onUseTemplate,
  onGenerateWithAI,
  isSubmitting = false,
}) => {
  console.log('EmailForm rendered with initialData:', initialData);
  const [content, setContent] = useState(initialData.content || '');

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: initialData.to || '',
      subject: initialData.subject || '',
      content: initialData.content || '',
      lead_id: initialData.lead_id || '',
    },
  });

  const handleSubmit = async (data: EmailFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
      setContent('');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    form.setValue('content', newContent, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input placeholder="recipient@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Email subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field: { value, onChange, ...rest } }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Write your email message here..."
                  className="min-h-[300px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <input type="hidden" {...form.register('lead_id')} />

        <div className="flex justify-between pt-4">
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onUseTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              Use Template
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onGenerateWithAI}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Reply with AI
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EmailForm; 