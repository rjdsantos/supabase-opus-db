import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDashboardNavigation = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/orcamentos');
    } else {
      navigate('/orcamentos');
    }
  };

  if (loading) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">
            Jaque Natal Orçamentos
          </h1>
          <div className="flex items-center gap-2">
            {/* Loading skeleton */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 
          className="text-xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          Jaque Natal Orçamentos
        </h1>
        
        <div className="flex items-center gap-4">
          {profile ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>
                  Olá, <span className="font-medium">{profile.full_name}</span>
                  {profile.role === 'admin' && (
                    <span className="text-primary ml-1">(Admin)</span>
                  )}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDashboardNavigation}
              >
                {profile.role === 'admin' ? 'Painel Admin' : 'Meus Orçamentos'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login?tab=signin')}
              >
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/login?tab=signup')}
              >
                Cadastrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;