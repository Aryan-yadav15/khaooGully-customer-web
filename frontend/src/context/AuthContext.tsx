import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearAccessToken, setAccessTokenFromSession } from '../lib/tokenCache';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  needsPhone: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  markPhoneCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);

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
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, is_admin, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
        setNeedsPhone(!hasValidPhone(data.phone));
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
    } catch {
      setIsAdmin(false);
      setNeedsPhone(false);
    }
  };

  const markPhoneCompleted = () => setNeedsPhone(false);

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

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, needsPhone, signUp, signIn, signInWithGoogle, signOut, markPhoneCompleted }}>
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
