import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'admin';
  fallbackRoute?: string;
}

export const AuthGuard = ({ 
  children, 
  requiredRole, 
  fallbackRoute = '/login' 
}: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated
        navigate(fallbackRoute);
        return;
      }

      // If a specific role is required, wait until profile is available
      if (requiredRole) {
        if (!profile) return; // wait for profile load instead of redirecting
        if (profile.role !== requiredRole) {
          // Wrong role - redirect based on actual role
          if (profile.role === 'admin') {
            navigate('/admin/orcamentos');
          } else {
            navigate('/orcamentos');
          }
          return;
        }
      }
    }
  }, [user, profile, loading, navigate, requiredRole, fallbackRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // While authenticated but waiting for profile (for role checks), show loader
  if (user && requiredRole && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AuthGuard;