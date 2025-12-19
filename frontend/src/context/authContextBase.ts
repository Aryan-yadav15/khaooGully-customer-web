import { createContext } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';

export interface Campus {
  id: string;
  name: string;
  code: string;
  hotspot_location: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  needsPhone: boolean;
  needsCampus: boolean;
  defaultCampus: Campus | null;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  markPhoneCompleted: () => void;
  setDefaultCampus: (campusId: string) => Promise<void>;
  markCampusCompleted: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
