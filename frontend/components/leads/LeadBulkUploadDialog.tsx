import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import { Download, Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LeadCreate } from '../../types/lead';
import { useBulkCreateLeads } from '../../hooks/useLeads';

// Inline Alert component
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4",
      variant === "destructive" 
        ? "border-destructive/50 text-destructive dark:border-destructive" 
        : "bg-background text-foreground",
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Inline Progress component
const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
});
Progress.displayName = "Progress";

interface LeadBulkUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadBulkUploadDialog({
  isOpen,
  onClose,
  onSuccess,
}: LeadBulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  
  const { bulkCreateLeads } = useBulkCreateLeads();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadStatus('idle');
    setErrorMessage(null);
    setValidationResults(null);
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'job_title', 'status', 'source', 'notes'];
    const csvContent = headers.join(',') + '\n';
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'Lead import template has been downloaded.',
    });
  };

  const validateFile = async () => {
    if (!file) return;
    
    setUploadStatus('validating');
    setErrorMessage(null);
    
    try {
      // Read the file
      const text = await file.text();
      const rows = text.split('\n');
      
      // Check if file is empty
      if (rows.length <= 1) {
        setErrorMessage('The file appears to be empty or contains only headers.');
        setUploadStatus('error');
        return;
      }
      
      // Validate headers
      const headers = rows[0].split(',').map(h => h.trim());
      const requiredHeaders = ['first_name', 'last_name'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrorMessage(`Missing required headers: ${missingHeaders.join(', ')}`);
        setUploadStatus('error');
        return;
      }
      
      // Validate rows
      const errors: Array<{ row: number; message: string }> = [];
      let validRows = 0;
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const values = rows[i].split(',').map(v => v.trim());
        
        // Check if row has correct number of columns
        if (values.length !== headers.length) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`,
          });
          continue;
        }
        
        // Create a record from the row
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        
        // Validate required fields
        if (!record.first_name) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} is missing first name`,
          });
          continue;
        }
        
        if (!record.last_name) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} is missing last name`,
          });
          continue;
        }
        
        // Validate email format if provided
        if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} has invalid email format`,
          });
          continue;
        }
        
        validRows++;
      }
      
      setValidationResults({
        valid: errors.length === 0,
        totalRows: rows.length - 1, // Exclude header row
        validRows,
        invalidRows: errors.length,
        errors,
      });
      
      if (errors.length === 0) {
        setUploadStatus('idle');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      setErrorMessage('Failed to validate file. Please check the file format.');
      setUploadStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!file || !validationResults?.valid) return;
    
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      
      const leads: LeadCreate[] = [];
      
      // Parse rows into lead objects
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const values = rows[i].split(',').map(v => v.trim());
        const lead: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            lead[header] = values[index];
          }
        });
        
        leads.push(lead as LeadCreate);
        
        // Update progress
        const progress = Math.round((i / (rows.length - 1)) * 100);
        setUploadProgress(progress);
      }
      
      // Simulate upload delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Upload leads
      const result = await bulkCreateLeads(leads);
      
      if (result) {
        setUploadStatus('success');
        toast({
          title: 'Upload Successful',
          description: `${leads.length} leads have been imported successfully.`,
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Close dialog after a delay
        setTimeout(() => {
          onClose();
          setFile(null);
          setUploadStatus('idle');
          setValidationResults(null);
        }, 2000);
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to upload leads. Please try again.');
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the leads.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple leads at once. 
            Download the template to ensure your file is formatted correctly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Upload CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button 
                  variant="secondary" 
                  onClick={validateFile}
                  disabled={uploadStatus === 'validating' || uploadStatus === 'uploading'}
                >
                  Validate
                </Button>
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
          
          {uploadStatus === 'validating' && (
            <div className="space-y-2">
              <p className="text-sm">Validating file...</p>
              <Progress value={50} className="h-2" />
            </div>
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <p className="text-sm">Uploading leads...</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {validationResults && (
            <Alert variant={validationResults.valid ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {validationResults.valid ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div>
                  <AlertTitle>
                    {validationResults.valid 
                      ? "File Validated Successfully" 
                      : "Validation Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    <p>
                      Total rows: {validationResults.totalRows}, 
                      Valid: {validationResults.validRows}, 
                      Invalid: {validationResults.invalidRows}
                    </p>
                    
                    {validationResults.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto text-sm">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc pl-5">
                          {validationResults.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error.message}</li>
                          ))}
                          {validationResults.errors.length > 5 && (
                            <li>...and {validationResults.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {uploadStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Upload Successful</AlertTitle>
              <AlertDescription>
                Your leads have been imported successfully.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || !validationResults?.valid || isUploading || uploadStatus === 'validating'}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <FileUp className="h-4 w-4" />
                Upload Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 