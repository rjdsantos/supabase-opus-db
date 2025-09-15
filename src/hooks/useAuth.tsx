import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  role: 'client' | 'admin';
  full_name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  const createProfileFromUser = (user: User): UserProfile => {
    // Create a default profile from user data until profiles table is implemented
    return {
      id: user.id,
      user_id: user.id,
      role: 'client', // Default to client, admin would be manually set in DB later
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      phone: user.user_metadata?.phone,
    };
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const profile = createProfileFromUser(session.user);
          setAuthState({
            user: session.user,
            session,
            profile,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return;
      }

      if (session?.user) {
        const profile = createProfileFromUser(session.user);
        setAuthState({
          user: session.user,
          session,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao sair' 
      }));
    }
  };

  return {
    ...authState,
    signOut,
  };
};