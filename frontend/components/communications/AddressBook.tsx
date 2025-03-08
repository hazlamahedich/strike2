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
import { getContacts, createContact as apiCreateContact, Contact } from '@/lib/services/communicationService';
import { USE_MOCK_DATA } from '@/lib/config';

// Define the form schema for creating/editing contacts
const contactFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  phone_number: z.string().min(1, { message: 'Phone number is required' }),
  email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  contact_type: z.string().min(1, { message: 'Contact type is required' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// Mock API functions for operations not yet implemented in the service
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
      contact_type: 'lead',
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
      contact_type: 'lead',
    }
  });

  // Fetch contacts on component mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsLoading(true);
        const data = await getContacts();
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
      const newContact = await apiCreateContact({
        name: data.name,
        phone_number: data.phone_number,
        email: data.email || '',
        company: data.company || '',
        contact_type: data.contact_type,
      });
      
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

  // Open edit dialog and populate form with contact data
  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    editForm.reset({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || '',
      company: contact.company || '',
      contact_type: contact.contact_type,
    });
    setIsEditDialogOpen(true);
  };

  // Handle selecting a contact
  const handleContactSelect = (contact: Contact) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Address Book {USE_MOCK_DATA ? '(Mock Mode)' : ''}</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search contacts..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contacts found</p>
          {searchTerm && (
            <Button 
              variant="link" 
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </Button>
          )}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleContactSelect(contact)}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone_number}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.company || '-'}</TableCell>
                  <TableCell>
                    <span className="capitalize">{contact.contact_type}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactSelect(contact)}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="sr-only">Call</span>
                      </Button>
                      {contact.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `mailto:${contact.email}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="sr-only">Email</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
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
                name="contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact type" />
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
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
                name="contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 