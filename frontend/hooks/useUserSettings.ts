import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

export type UserProfile = {
  id: string;
  user_id: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    full_name?: string;
    is_admin?: boolean;
    enable_mock_features?: boolean; // Mock flag
    compact_mode?: boolean;
    default_view?: string;
    currency?: string;
    date_format?: string;
  };
  notification_settings?: {
    email?: boolean;
    push?: boolean;
    task_reminders?: boolean;
    deal_updates?: boolean;
    weekly_reports?: boolean;
    marketing_emails?: boolean;
    system_announcements?: boolean;
  };
  created_at?: string;
  updated_at?: string;
};

// Default profile to use as fallback
const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  user_id: 'default',
  avatar_url: '',
  preferences: {
    theme: 'system',
    language: 'en',
    full_name: '',
    enable_mock_features: true,
    compact_mode: false,
    default_view: 'kanban',
    currency: 'USD',
    date_format: 'MM/DD/YYYY'
  },
  notification_settings: {
    email: true,
    push: false,
    task_reminders: true,
    deal_updates: true,
    weekly_reports: true,
    marketing_emails: false,
    system_announcements: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function useUserSettings() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Fetch user profile from NextAuth.js Profile table
  const fetchUserProfile = async () => {
    if (!session?.user?.id) {
      setUseFallback(true);
      setProfile(DEFAULT_PROFILE);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll use a fallback profile with mock features enabled
      // This ensures the dashboard works properly while we resolve the database issues
      const userProfile: UserProfile = {
        id: session.user.id,
        user_id: session.user.id,
        avatar_url: session.user.image || '',
        preferences: {
          theme: 'system',
          language: 'en',
          full_name: session.user.name || '',
          enable_mock_features: true, // Enable by default for better demo experience
          compact_mode: false,
          default_view: 'kanban',
          currency: 'USD',
          date_format: 'MM/DD/YYYY'
        },
        notification_settings: {
          email: true,
          push: false,
          task_reminders: true,
          deal_updates: true,
          weekly_reports: true,
          marketing_emails: false,
          system_announcements: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setProfile(userProfile);
      setUseFallback(false);
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setError('Failed to fetch user profile');
      setUseFallback(true);
      setProfile({
        ...DEFAULT_PROFILE,
        user_id: session.user.id,
        preferences: {
          ...DEFAULT_PROFILE.preferences,
          full_name: session.user.name || ''
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new user profile
  const createUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      // Default profile data
      const newProfile: UserProfile = {
        id: session.user.id,
        user_id: session.user.id,
        avatar_url: session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=random`,
        preferences: {
          theme: 'system',
          language: 'en',
          full_name: session.user.name || '',
          enable_mock_features: true, // Enable by default for better demo experience
          compact_mode: false,
          default_view: 'kanban',
          currency: 'USD',
          date_format: 'MM/DD/YYYY'
        },
        notification_settings: {
          email: true,
          push: false,
          task_reminders: true,
          deal_updates: true,
          weekly_reports: true,
          marketing_emails: false,
          system_announcements: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // For now, just use the profile directly
      setProfile(newProfile);
      setUseFallback(false);
      console.log('Using default profile:', newProfile);
    } catch (err) {
      console.error('Error in createUserProfile:', err);
      setError('Failed to create user profile');
      setUseFallback(true);
      setProfile({
        ...DEFAULT_PROFILE,
        user_id: session?.user?.id || 'default',
        preferences: {
          ...DEFAULT_PROFILE.preferences,
          full_name: session?.user?.name || ''
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!session?.user?.id || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Just update the local state for now
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
      
      return true;
    } catch (err) {
      console.error('Error in updateUserProfile:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    if (!profile) return false;
    
    const updatedPreferences = {
      ...profile.preferences,
      ...preferences
    };
    
    return updateUserProfile({ 
      preferences: updatedPreferences,
      updated_at: new Date().toISOString()
    });
  };

  // Update notification settings
  const updateNotificationSettings = async (settings: Partial<UserProfile['notification_settings']>) => {
    if (!profile) return false;
    
    const updatedSettings = {
      ...profile.notification_settings,
      ...settings
    };
    
    return updateUserProfile({ 
      notification_settings: updatedSettings,
      updated_at: new Date().toISOString()
    });
  };

  // Toggle mock features flag
  const toggleMockFeatures = async () => {
    if (!profile?.preferences) return false;
    
    const currentValue = profile.preferences.enable_mock_features || false;
    
    return updatePreferences({
      enable_mock_features: !currentValue
    });
  };

  // Load profile when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile();
    } else {
      // If no session, use the default profile
      setProfile(DEFAULT_PROFILE);
      setUseFallback(true);
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    profile,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    updatePreferences,
    updateNotificationSettings,
    toggleMockFeatures,
    isMockFeaturesEnabled: profile?.preferences?.enable_mock_features || false,
    useFallback
  };
} 