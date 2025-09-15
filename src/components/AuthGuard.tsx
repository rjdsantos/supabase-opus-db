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
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        // Not authenticated
        navigate(fallbackRoute);
        return;
      }

      if (requiredRole && profile.role !== requiredRole) {
        // Wrong role - redirect based on actual role
        if (profile.role === 'admin') {
          navigate('/admin/orcamentos');
        } else {
          navigate('/orcamentos');
        }
        return;
      }
    }
  }, [profile, loading, navigate, requiredRole, fallbackRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect in useEffect
  }

  if (requiredRole && profile.role !== requiredRole) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AuthGuard;