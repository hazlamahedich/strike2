export interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  team_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: number;
  user_id: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
} 