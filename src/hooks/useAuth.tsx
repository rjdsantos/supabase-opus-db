import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  role: 'client' | 'admin';
  full_name: string;
  email: string;
  phone?: string;
  whatsapp_opt_in?: boolean;
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
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const createProfile = async (user: User, additionalData?: { full_name?: string; phone?: string }): Promise<UserProfile | null> => {
    try {
      const profileData = {
        user_id: user.id,
        full_name: additionalData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        phone: additionalData?.phone || user.user_metadata?.phone || null,
        role: 'client' as const,
        whatsapp_opt_in: true,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Set session immediately to avoid loading states
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false,
            error: null,
          }));
          
          // Defer profile fetching to avoid deadlocks
          setTimeout(() => {
            const loadProfile = async () => {
              const profile = await fetchProfile(session.user.id) || await createProfile(session.user);
              setAuthState(prev => ({
                ...prev,
                profile,
              }));
            };
            loadProfile();
          }, 0);
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
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return;
      }

      if (session?.user) {
        // Fetch or create profile for the user
        const profile = await fetchProfile(session.user.id) || await createProfile(session.user);
        
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

  const signUp = async (email: string, password: string, full_name: string, phone?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name,
            phone
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error };
      }

      // Success - user needs to confirm email
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: null, needsConfirmation: !data.user?.email_confirmed_at };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: 'E-mail ou senha incorretos' }));
        return { error: 'E-mail ou senha incorretos' };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao entrar';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso"
        });
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
    signUp,
    signIn,
    signOut,
  };
};