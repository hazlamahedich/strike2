'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutGrid, 
  Users, 
  Megaphone, 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  BellRing,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Search,
  PanelLeft,
  Home,
  Layers,
  Activity
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Toaster } from 'sonner';
import apiClient from '@/lib/api/client';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type User = {
  email: string;
  full_name?: string;
  [key: string]: any;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  [key: string]: any;
};

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
  { title: 'Leads', href: '/dashboard/leads', icon: <Users className="h-5 w-5" />, badge: 5 },
  { title: 'Campaigns', href: '/dashboard/campaigns', icon: <Megaphone className="h-5 w-5" /> },
  { title: 'Tasks', href: '/dashboard/tasks', icon: <CheckSquare className="h-5 w-5" />, badge: 3 },
  { title: 'Communications', href: '/communications', icon: <MessageSquare className="h-5 w-5" /> },
  { title: 'Meetings', href: '/dashboard/meetings', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Analytics', href: '/dashboard/analytics', icon: <Activity className="h-5 w-5" /> },
  { title: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('U');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get user info from API
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // First try to get user from local storage (for temporary auth solution)
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('strike_app_user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(user.name || user.email.split('@')[0]);
            setUserInitials(
              (user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : user.email[0]).toUpperCase()
            );
            return; // Exit early if we found a user in local storage
          }
        }

        // If no local user, try API
        const response = await apiClient.get<User>('/auth/me');
        if (response && response.data) {
          const user = response.data;
          setUserName(user.full_name || user.email.split('@')[0]);
          setUserInitials(
            (user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : user.email[0]).toUpperCase()
          );
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // Get notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get<Notification[]>('/notifications/unread');
        if (response && response.data) {
          setNotifications(response.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // For demo purposes, set some mock notifications
        setNotifications([
          { id: '1', title: 'New lead assigned', content: 'A new lead has been assigned to you.', created_at: new Date().toISOString(), is_read: false },
          { id: '2', title: 'Meeting reminder', content: 'You have a meeting in 30 minutes.', created_at: new Date().toISOString(), is_read: true },
        ]);
      }
    };

    fetchNotifications();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('strike_app_user');
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error logging out:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('strike_app_user');
        window.location.href = '/auth/login';
      }
    }
  };

  return (
    <AnalyticsProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile navigation toggle */}
        <div className="fixed top-0 left-0 right-0 h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center lg:hidden z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1 flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <BellRing className="h-[1.2rem] w-[1.2rem]" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 px-4">No new notifications</div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.content}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="cursor-pointer w-full text-center">
                    View all
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Sidebar for desktop */}
        <AnimatePresence>
          <motion.div 
            className={`fixed top-0 left-0 bottom-0 z-40 border-r bg-card ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
            initial={{ width: sidebarCollapsed ? 80 : 240 }}
            animate={{ width: sidebarCollapsed ? 80 : 240 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="h-16 border-b flex items-center px-6 sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-10">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-semibold">AI</span>
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span 
                      className="font-semibold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      STRIKE CRM
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
            
            <div className="p-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                  >
                    <motion.div
                      className={cn(
                        "flex items-center rounded-md transition-all duration-200 relative group",
                        sidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                        pathname === item.href || pathname?.startsWith(`${item.href}/`) 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      title={sidebarCollapsed ? item.title : undefined}
                    >
                      <span className="relative">
                        {item.icon}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </span>
                      
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span 
                            className="text-sm font-medium"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      
                      {/* Active indicator */}
                      {(pathname === item.href || pathname?.startsWith(`${item.href}/`)) && (
                        <motion.div 
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-full"
                          layoutId="activeNavIndicator"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 border-t p-4">
              <AnimatePresence mode="wait">
                {!sidebarCollapsed ? (
                  <motion.div 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="expanded"
                  >
                    <Avatar className="border-2 border-primary/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">Logged in</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="collapsed"
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Sidebar collapse toggle button */}
            <motion.button
              onClick={toggleSidebar}
              className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-1 shadow-md hover:shadow-lg transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? 
                <ChevronRight className="h-4 w-4" /> : 
                <ChevronLeft className="h-4 w-4" />
              }
            </motion.button>
          </motion.div>
        </AnimatePresence>
        
        {/* Backdrop for mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              className="fixed inset-0 z-30 bg-background/80 backdrop-blur lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        
        {/* Main content */}
        <motion.div 
          className="min-h-screen transition-all duration-300"
          initial={{ paddingLeft: sidebarCollapsed ? 80 : 240 }}
          animate={{ paddingLeft: sidebarCollapsed ? 80 : 240 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ paddingLeft: 0 }} // Mobile default
        >
          <header className="hidden lg:flex h-16 border-b items-center gap-4 px-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search..." 
                className="pl-10 bg-background/50 focus:bg-background transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1" />
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
              {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <BellRing className="h-[1.2rem] w-[1.2rem]" />
                  {notifications.length > 0 && (
                    <motion.span 
                      className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 px-4">No new notifications</div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.content}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="cursor-pointer w-full text-center">
                    View all
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2" size="sm">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm hidden md:inline-block">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          
          {/* Main content with children */}
          <main className="max-w-full px-4 sm:px-6 lg:px-8 py-6 overflow-x-auto pt-16 lg:pt-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </motion.div>
        
        {/* Toast notifications */}
        <Toaster position="top-right" />
      </div>
    </AnalyticsProvider>
  );
} 