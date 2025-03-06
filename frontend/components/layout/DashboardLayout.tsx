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
  Sun
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

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
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
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutGrid className="h-5 w-5" /> },
  { title: 'Leads', href: '/dashboard/leads', icon: <Users className="h-5 w-5" /> },
  { title: 'Campaigns', href: '/dashboard/campaigns', icon: <Megaphone className="h-5 w-5" /> },
  { title: 'Tasks', href: '/dashboard/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { title: 'Communications', href: '/dashboard/communications', icon: <MessageSquare className="h-5 w-5" /> },
  { title: 'Meetings', href: '/dashboard/meetings', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Analytics', href: '/dashboard/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { title: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('U');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
        const user = await apiClient.get<User>('auth/me');
        if (user && user.email) {
          setUserName(user.full_name || user.email.split('@')[0]);
          setUserInitials(
            (user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : user.email[0]).toUpperCase()
          );
        }
      } catch (error) {
        console.error('Failed to fetch user info', error);
        // No need to redirect - we'll just use default values
      }
    };

    const fetchNotifications = async () => {
      try {
        const data = await apiClient.get<Notification[]>('notifications/unread');
        setNotifications(data || []);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
        // Just use empty notifications array
      }
    };

    fetchUserInfo();
    // Only try to fetch notifications if we're not in development mode with temporary auth
    if (process.env.NODE_ENV !== 'development' || !localStorage.getItem('strike_app_user')) {
      fetchNotifications();
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Check if we're using local storage auth
      if (typeof window !== 'undefined' && localStorage.getItem('strike_app_user')) {
        localStorage.removeItem('strike_app_user');
        window.location.href = '/auth/login';
        return;
      }

      // Otherwise use API logout
      await apiClient.post('auth/logout', {});
      apiClient.clearAuthToken();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed', error);
      // Fallback: just clear local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('strike_app_user');
        window.location.href = '/auth/login';
      }
    }
  };

  return (
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
      <div 
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 border-r bg-card transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 border-b flex items-center px-6 sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">AI</span>
            </div>
            <span className="font-semibold text-xl">AI CRM</span>
          </Link>
        </div>
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  pathname === item.href || pathname?.startsWith(`${item.href}/`) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">Logged in</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <header className="hidden lg:flex h-16 border-b items-center gap-4 px-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
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
        </header>
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
} 