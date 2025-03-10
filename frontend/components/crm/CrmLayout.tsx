import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Search, 
  Bell, 
  User, 
  Menu
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface CrmLayoutProps {
  children: React.ReactNode;
}

export function CrmLayout({ children }: CrmLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <motion.aside 
        className="hidden md:flex flex-col border-r border-border bg-card"
        initial={{ width: 240 }}
        animate={{ width: sidebarCollapsed ? 80 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <motion.div 
            animate={{ opacity: sidebarCollapsed ? 0 : 1, display: sidebarCollapsed ? 'none' : 'block' }}
            transition={{ duration: 0.2 }}
            className="font-bold text-xl text-primary"
          >
            CRM Suite
          </motion.div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <NavItem icon={<BarChart3 size={20} />} label="Dashboard" collapsed={sidebarCollapsed} active />
          <NavItem icon={<Users size={20} />} label="Contacts" collapsed={sidebarCollapsed} />
          <NavItem icon={<Calendar size={20} />} label="Calendar" collapsed={sidebarCollapsed} />
          <NavItem icon={<MessageSquare size={20} />} label="Messages" collapsed={sidebarCollapsed} badge="3" />
          <NavItem icon={<Settings size={20} />} label="Settings" collapsed={sidebarCollapsed} />
        </nav>
        
        <div className="p-4 border-t border-border mt-auto">
          <motion.div 
            className="flex items-center space-x-3"
            animate={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
          >
            <Avatar>
              <User className="h-5 w-5" />
            </Avatar>
            <motion.div 
              animate={{ opacity: sidebarCollapsed ? 0 : 1, display: sidebarCollapsed ? 'none' : 'block' }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Sales Manager</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>
      
      {/* Mobile Menu Button and Overlay */}
      <div className="md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50"
          onClick={toggleMobileMenu}
        >
          <Menu size={24} />
        </Button>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleMobileMenu}
              />
              <motion.div 
                className="fixed left-0 top-0 h-full w-[240px] bg-card z-50 border-r border-border"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className="p-4 border-b border-border">
                  <div className="font-bold text-xl text-primary">CRM Suite</div>
                </div>
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  <NavItem icon={<BarChart3 size={20} />} label="Dashboard" collapsed={false} active />
                  <NavItem icon={<Users size={20} />} label="Contacts" collapsed={false} />
                  <NavItem icon={<Calendar size={20} />} label="Calendar" collapsed={false} />
                  <NavItem icon={<MessageSquare size={20} />} label="Messages" collapsed={false} badge="3" />
                  <NavItem icon={<Settings size={20} />} label="Settings" collapsed={false} />
                </nav>
                <div className="p-4 border-t border-border mt-auto">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <User className="h-5 w-5" />
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-xs text-muted-foreground">Sales Manager</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search contacts, deals, tasks..." 
                className="pl-10 bg-background"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            <div className="hidden md:flex items-center space-x-3">
              <Avatar>
                <User className="h-5 w-5" />
              </Avatar>
              <div>
                <p className="text-sm font-medium">John Doe</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  badge?: string;
}

function NavItem({ icon, label, collapsed, active, badge }: NavItemProps) {
  return (
    <motion.div
      className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      animate={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <div className="relative">
        {icon}
        {badge && !collapsed && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          >
            {badge}
          </Badge>
        )}
        {badge && collapsed && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          >
            {badge}
          </Badge>
        )}
      </div>
      <motion.span 
        className="ml-3 text-sm font-medium"
        animate={{ opacity: collapsed ? 0 : 1, display: collapsed ? 'none' : 'block' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
} 