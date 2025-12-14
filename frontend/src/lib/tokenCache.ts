import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

let accessToken: string | null = null;

// Single-flight guards to prevent a thundering herd.
let ensurePromise: Promise<string | null> | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessTokenFromSession = (session: Session | null) => {
  accessToken = session?.access_token ?? null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const getAccessToken = () => accessToken;

export const ensureAccessToken = async (): Promise<string | null> => {
  if (accessToken) return accessToken;

  if (!ensurePromise) {
    ensurePromise = supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        accessToken = session?.access_token ?? null;
        return accessToken;
      })
      .finally(() => {
        ensurePromise = null;
      });
  }

  return ensurePromise;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // Prefer a real refresh when possible.
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        accessToken = data.session.access_token;
        return accessToken;
      }
    } catch {
      // Fall through to getSession()
    }

    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token ?? null;
    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};
