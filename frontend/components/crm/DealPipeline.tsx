import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp,
  Users,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Avatar } from '../ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface Deal {
  id: string;
  title: string;
  company: string;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate: string;
  contacts: string[];
  owner: string;
  ownerAvatar?: string;
  createdAt: string;
  isPriority?: boolean;
  hasIssues?: boolean;
  notes?: string;
  lastActivity?: string;
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed';

interface DealPipelineProps {
  deals: Deal[];
  onDealMove: (dealId: string, newStage: DealStage) => void;
  onDealSelect: (deal: Deal) => void;
}

export function DealPipeline({ deals, onDealMove, onDealSelect }: DealPipelineProps) {
  const [expandedStage, setExpandedStage] = useState<DealStage | null>(null);
  
  const stages: { id: DealStage; label: string; color: string }[] = [
    { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
    { id: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
    { id: 'proposal', label: 'Proposal', color: 'bg-violet-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
    { id: 'closed', label: 'Closed Won', color: 'bg-green-500' },
  ];
  
  const toggleStage = (stage: DealStage) => {
    setExpandedStage(expandedStage === stage ? null : stage);
  };
  
  const getDealsForStage = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage);
  };
  
  const getTotalValueForStage = (stage: DealStage) => {
    return getDealsForStage(stage).reduce((sum, deal) => sum + deal.value, 0);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const handleDragEnd = (dealId: string, newStage: DealStage) => {
    onDealMove(dealId, newStage);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-col h-full">
          <div 
            className="flex items-center justify-between p-3 bg-card rounded-t-lg border border-border cursor-pointer"
            onClick={() => toggleStage(stage.id)}
          >
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${stage.color}`} />
              <h3 className="font-medium text-sm">{stage.label}</h3>
              <Badge variant="outline" className="text-xs">
                {getDealsForStage(stage.id).length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium">
                {formatCurrency(getTotalValueForStage(stage.id))}
              </span>
              {expandedStage === stage.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          <div 
            className={`flex-1 bg-muted/30 p-2 rounded-b-lg border-x border-b border-border overflow-y-auto transition-all ${
              expandedStage === stage.id ? 'max-h-[600px]' : 'max-h-[calc(100vh-200px)]'
            }`}
          >
            <AnimatePresence>
              <Reorder.Group 
                axis="y" 
                values={getDealsForStage(stage.id)} 
                onReorder={(items) => {
                  // Handle reordering within the same stage if needed
                }}
                className="space-y-2"
              >
                {getDealsForStage(stage.id).map((deal) => (
                  <Reorder.Item
                    key={deal.id}
                    value={deal}
                    dragListener={false} // We'll handle custom drag between columns
                  >
                    <DealCard 
                      deal={deal} 
                      onSelect={() => onDealSelect(deal)}
                      onDragToStage={(newStage) => handleDragEnd(deal.id, newStage)}
                      stages={stages}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </AnimatePresence>
            
            {getDealsForStage(stage.id).length === 0 && (
              <div className="h-20 flex items-center justify-center border border-dashed border-border rounded-md">
                <p className="text-xs text-muted-foreground">No deals in this stage</p>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 text-xs h-8 border border-dashed border-border"
            >
              + Add Deal
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  onSelect: () => void;
  onDragToStage: (newStage: DealStage) => void;
  stages: { id: DealStage; label: string; color: string }[];
}

function DealCard({ deal, onSelect, onDragToStage, stages }: DealCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        
        // Determine which stage to move to based on horizontal position
        const stageWidth = window.innerWidth / stages.length;
        const stageIndex = Math.floor((info.point.x + window.innerWidth / 2) / stageWidth);
        const clampedIndex = Math.max(0, Math.min(stages.length - 1, stageIndex));
        const newStage = stages[clampedIndex].id;
        
        if (newStage !== deal.stage) {
          onDragToStage(newStage);
        }
      }}
      className={`${isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab'}`}
    >
      <Card 
        className={`overflow-hidden border ${
          deal.isPriority ? 'border-amber-400/50' : ''
        } ${
          deal.hasIssues ? 'border-red-400/50' : ''
        }`}
        onClick={onSelect}
      >
        <CardHeader className="p-3 pb-2 space-y-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-sm line-clamp-1">{deal.title}</h4>
              <p className="text-xs text-muted-foreground">{deal.company}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Deal Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Move to Lead</DropdownMenuItem>
                <DropdownMenuItem>Move to Qualified</DropdownMenuItem>
                <DropdownMenuItem>Move to Proposal</DropdownMenuItem>
                <DropdownMenuItem>Move to Negotiation</DropdownMenuItem>
                <DropdownMenuItem>Move to Closed Won</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Mark as Lost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0 pb-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-sm">{formatCurrency(deal.value)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">{deal.expectedCloseDate}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Probability</span>
              <span>{deal.probability}%</span>
            </div>
            <Progress value={deal.probability} className="h-1.5" />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs">{deal.contacts.length} contacts</span>
            </div>
            {deal.hasIssues && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                <AlertCircle className="h-2.5 w-2.5 mr-1" /> Issues
              </Badge>
            )}
            {deal.isPriority && (
              <Badge variant="secondary" className="bg-amber-400/20 text-amber-700 text-[10px] px-1 py-0 h-4">
                Priority
              </Badge>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-2 bg-muted/30 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <Avatar className="h-5 w-5">
              {deal.ownerAvatar ? (
                <img src={deal.ownerAvatar} alt={deal.owner} />
              ) : (
                <div className="bg-primary/10 text-primary font-medium flex items-center justify-center h-full w-full text-[10px]">
                  {deal.owner.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </Avatar>
            <span className="text-xs">{deal.owner.split(' ')[0]}</span>
          </div>
          <span className="text-xs text-muted-foreground">{deal.lastActivity || deal.createdAt}</span>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 