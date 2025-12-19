import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAccessToken, setAccessTokenFromSession } from '../lib/tokenCache';

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  defaultCampusId: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  needsPhone: boolean;
  customerProfile: CustomerProfile | null;
  needsCampusSelection: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  markPhoneCompleted: () => void;
  setDefaultCampus: (campusId: string) => Promise<{ success: boolean; error?: string }>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [needsCampusSelection, setNeedsCampusSelection] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAccessTokenFromSession(session);
      setSession(session);
      setUser(session?.user ?? null);
      ensureCustomerProfile(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessTokenFromSession(session);
      setSession(session);
      setUser(session?.user ?? null);
      ensureCustomerProfile(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasValidPhone = (value: unknown) => {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const ensureCustomerProfile = async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      setNeedsPhone(false);
      setCustomerProfile(null);
      setNeedsCampusSelection(false);
      return;
    }

    // Validate email domain
    if (user.email) {
      const allowedDomains = ['kiit.ac.in', 'kims.ac.in'];
      // Whitelisted emails that bypass domain check (for testing/special access)
      const whitelistedEmails = [
        'test@example.com',
        'harshitmetha2004@gmail.com',
        'a2003yadav@gmail.com'
        // Add more whitelisted emails here
      ];
      
      const emailLower = user.email.toLowerCase();
      const domain = emailLower.split('@')[1];
      const isWhitelisted = whitelistedEmails.includes(emailLower);
      const isAllowedDomain = domain && allowedDomains.includes(domain);
      
      if (!isWhitelisted && !isAllowedDomain) {
        await supabase.auth.signOut();
        setAuthError(`Only emails from @kiit.ac.in and @kims.ac.in are allowed. Please use your university email.`);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, is_admin, phone, full_name, email, default_campus_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
        setNeedsPhone(!hasValidPhone(data.phone));
        setCustomerProfile({
          id: data.id,
          fullName: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone,
          defaultCampusId: data.default_campus_id,
          isAdmin: data.is_admin || false,
        });
        setNeedsCampusSelection(!data.default_campus_id);
        return;
      }

      const metadata: any = user.user_metadata || {};
      const inferredName = metadata.full_name || metadata.name || metadata.fullName || (user.email ? user.email.split('@')[0] : '');
      const inferredPhone = metadata.phone || '';

      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          id: user.id,
          full_name: inferredName,
          email: user.email,
          phone: inferredPhone,
        });

      if (insertError) {
        console.error('Error creating customer profile:', insertError);
      }

      setIsAdmin(false);
      setNeedsPhone(!hasValidPhone(inferredPhone));
      setCustomerProfile({
        id: user.id,
        fullName: inferredName,
        email: user.email || '',
        phone: inferredPhone || null,
        defaultCampusId: null,
        isAdmin: false,
      });
      setNeedsCampusSelection(true);
    } catch {
      setIsAdmin(false);
      setNeedsPhone(false);
      setCustomerProfile(null);
      setNeedsCampusSelection(false);
    }
  };

  const markPhoneCompleted = () => setNeedsPhone(false);

  const setDefaultCampus = useCallback(async (campusId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ default_campus_id: campusId })
        .eq('id', user.id);

      if (error) {
        console.error('Error setting default campus:', error);
        return { success: false, error: error.message };
      }

      // Update local state
      setCustomerProfile(prev => prev ? { ...prev, defaultCampusId: campusId } : null);
      setNeedsCampusSelection(false);
      
      return { success: true };
    } catch (err) {
      console.error('Error setting default campus:', err);
      return { success: false, error: 'Failed to update campus' };
    }
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (data.user && !error) {
      // Create customer profile in the database
      const { error: profileError } = await supabase
        .from('customers')
        .insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
        });

      if (profileError) {
        console.error('Error creating customer profile:', profileError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    clearAccessToken();
    await supabase.auth.signOut();
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      needsPhone, 
      customerProfile,
      needsCampusSelection,
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut, 
      markPhoneCompleted, 
      setDefaultCampus,
      authError, 
      clearAuthError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
