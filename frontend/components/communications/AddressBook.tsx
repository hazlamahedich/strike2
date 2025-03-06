import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, UserPlus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define the contact type
export interface Contact {
  id: number;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  job_title?: string;
  contact_type: 'lead' | 'client' | 'vendor' | 'partner' | 'other';
  lead_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Define the form schema for creating/editing contacts
const contactFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  phone_number: z.string().min(1, { message: 'Phone number is required' }),
  email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  contact_type: z.enum(['lead', 'client', 'vendor', 'partner', 'other']),
  lead_id: z.number().optional(),
  notes: z.string().optional().or(z.literal(''))
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Mock API functions (replace with actual API calls)
const fetchContacts = async (): Promise<Contact[]> => {
  // In a real app, this would be an API call
  return [
    {
      id: 1,
      name: 'John Doe',
      phone_number: '+1234567890',
      email: 'john.doe@example.com',
      company: 'Acme Inc',
      job_title: 'CEO',
      contact_type: 'lead',
      lead_id: 1,
      notes: 'Potential high-value client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone_number: '+0987654321',
      email: 'jane.smith@example.com',
      company: 'XYZ Corp',
      job_title: 'CTO',
      contact_type: 'client',
      lead_id: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

const createContact = async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
  // In a real app, this would be an API call
  return {
    ...contact,
    id: Math.floor(Math.random() * 1000),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

const updateContact = async (id: number, contact: Partial<Contact>): Promise<Contact> => {
  // In a real app, this would be an API call
  return {
    ...contact,
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Contact;
};

const deleteContact = async (id: number): Promise<boolean> => {
  // In a real app, this would be an API call
  return true;
};

export default function AddressBook({ onSelectContact }: { onSelectContact?: (contact: Contact) => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  // Initialize the form for adding contacts
  const addForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      email: '',
      company: '',
      job_title: '',
      contact_type: 'lead',
      notes: ''
    }
  });

  // Initialize the form for editing contacts
  const editForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      email: '',
      company: '',
      job_title: '',
      contact_type: 'lead',
      notes: ''
    }
  });

  // Fetch contacts on component mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchContacts();
        setContacts(data);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContacts();
  }, [toast]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone_number.includes(searchTerm) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle adding a new contact
  const handleAddContact = async (data: ContactFormValues) => {
    try {
      const newContact = await createContact(data as Omit<Contact, 'id' | 'created_at' | 'updated_at'>);
      setContacts(prev => [...prev, newContact]);
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle editing a contact
  const handleEditContact = async (data: ContactFormValues) => {
    if (!selectedContact) return;
    
    try {
      const updatedContact = await updateContact(selectedContact.id, data);
      setContacts(prev => prev.map(contact => 
        contact.id === selectedContact.id ? updatedContact : contact
      ));
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    } catch (error) {
      console.error('Failed to update contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle deleting a contact
  const handleDeleteContact = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await deleteContact(id);
      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Open edit dialog and populate form with selected contact data
  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    editForm.reset({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || '',
      company: contact.company || '',
      job_title: contact.job_title || '',
      contact_type: contact.contact_type,
      lead_id: contact.lead_id,
      notes: contact.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle contact selection (for calling, etc.)
  const handleContactSelect = (contact: Contact) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Address Book</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddContact)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addForm.control}
                  name="contact_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save Contact</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No contacts found. Add a new contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-primary/10"
                        onClick={() => handleContactSelect(contact)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {contact.phone_number}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {contact.email && (
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {contact.email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell>
                      <span className="capitalize">{contact.contact_type}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(contact)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditContact)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Update Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 