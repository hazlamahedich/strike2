// This file contains declarations for modules that don't have TypeScript definitions

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// Declare our custom components
declare module './EmailTemplateSelector' {
  import { FC } from 'react';
  
  interface EmailTemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: { subject: string; content: string }) => void;
  }
  
  const EmailTemplateSelector: FC<EmailTemplateSelectorProps>;
  export default EmailTemplateSelector;
}

declare module './AIEmailGenerator' {
  import { FC } from 'react';
  
  interface AIEmailGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (generated: { subject: string; content: string }) => void;
    lead: any;
  }
  
  const AIEmailGenerator: FC<AIEmailGeneratorProps>;
  export default AIEmailGenerator;
}

declare module './EmailTemplateForm' {
  import { FC } from 'react';
  import { EmailTemplate, EmailTemplateCreate } from '../types/email';
  
  interface EmailTemplateFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: EmailTemplate) => void;
    initialData?: Partial<EmailTemplateCreate>;
  }
  
  const EmailTemplateForm: FC<EmailTemplateFormProps>;
  export default EmailTemplateForm;
} 