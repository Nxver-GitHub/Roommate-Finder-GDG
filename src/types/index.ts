export interface Profile {
  id: string;
  full_name: string;
  email: string;
  pronouns: string;
  bio: string;
  major: string;
  year: string;
  profile_image_url: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  target_user_id: string;
  status: 'liked' | 'matched' | 'rejected';
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Profile | null;
  loading: boolean;
}