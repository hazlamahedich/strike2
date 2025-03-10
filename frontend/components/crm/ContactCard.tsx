import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Star, 
  MoreHorizontal, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar?: string;
  relationshipHealth: 'excellent' | 'good' | 'average' | 'poor';
  lastContact: string;
  lastContactType: 'email' | 'call' | 'meeting';
  nextFollowUp?: string;
  tags: string[];
  notes?: string;
  isStarred?: boolean;
}

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  isSelected?: boolean;
}

export function ContactCard({ contact, onSelect, isSelected = false }: ContactCardProps) {
  const healthColors = {
    excellent: 'bg-green-500',
    good: 'bg-emerald-400',
    average: 'bg-amber-400',
    poor: 'bg-red-500',
  };

  const contactTypeIcons = {
    email: <Mail className="h-3 w-3" />,
    call: <Phone className="h-3 w-3" />,
    meeting: <Calendar className="h-3 w-3" />,
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card 
        className={`overflow-hidden transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        }`}
        onClick={() => onSelect(contact)}
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-background">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={contact.name} />
                ) : (
                  <div className="bg-primary/10 text-primary font-medium flex items-center justify-center h-full w-full">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </Avatar>
              <div 
                className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${healthColors[contact.relationshipHealth]}`}
                title={`Relationship: ${contact.relationshipHealth.charAt(0).toUpperCase() + contact.relationshipHealth.slice(1)}`}
              />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <h3 className="font-medium text-sm">{contact.name}</h3>
                {contact.isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
              </div>
              <p className="text-xs text-muted-foreground">{contact.position} at {contact.company}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" /> Call
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" /> Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" /> {contact.isStarred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Remove Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{contact.email}</span>
            </div>
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>Last Contact:</span>
              </div>
              <div className="flex items-center space-x-1">
                {contactTypeIcons[contact.lastContactType]}
                <span>{contact.lastContact}</span>
              </div>
            </div>
            
            {contact.nextFollowUp && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Next Follow-up:</span>
                </div>
                <span>{contact.nextFollowUp}</span>
              </div>
            )}
          </div>
          
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {contact.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-2 bg-muted/30 flex justify-between">
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Mail className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Calendar className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View Details <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 