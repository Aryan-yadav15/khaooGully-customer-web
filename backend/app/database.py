"""
Supabase database client configuration.

This module initializes and provides access to the Supabase client
for database operations throughout the application.
"""

from supabase import create_client, Client
from app.config import settings


def GetSupabaseClientWithAuth(Token: str) -> Client:
    """
    Creates and returns a Supabase client with user JWT authentication.
    This client respects RLS policies based on auth.uid().
    
    Args:
        Token: JWT access token for the authenticated user
        
    Returns:
        Client: Configured Supabase client with user context
    """
    client = create_client(settings.SupabaseUrl, settings.SupabaseKey)
    # Set Authorization header for RLS policies to recognize auth.uid()
    client.postgrest.auth(Token)
    return client


def GetSupabaseAdminClient() -> Client:
    """
    Creates and returns a Supabase admin client with service role key.
    WARNING: This bypasses ALL RLS policies. Use only for admin operations.
    
    Returns:
        Client: Configured Supabase admin client with elevated privileges
    """
    return create_client(settings.SupabaseUrl, settings.SupabaseServiceKey)


# Global admin client instance (use sparingly)
SupabaseAdminClient = GetSupabaseAdminClient()
