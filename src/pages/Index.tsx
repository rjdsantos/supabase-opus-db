import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Gift, Calendar, Star } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect authenticated users after a brief delay
    if (!loading && user && profile) {
      const timer = setTimeout(() => {
        if (profile.role === 'admin') {
          navigate('/admin/orcamentos');
        } else if (profile.role === 'client') {
          navigate('/orcamentos');
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [loading, user, profile, navigate]);

  const handleLoginClick = () => {
    navigate('/login?tab=signin');
  };

  const handleSignupClick = () => {
    navigate('/login?tab=signup');
  };

  const handleAdminClick = () => {
    navigate('/admin/login');
  };

  const handleDashboardClick = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/orcamentos');
    } else if (profile?.role === 'client') {
      navigate('/orcamentos');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Jaque Natal</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Decorações & Presentes
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              {user && profile ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Olá, {profile.full_name.split(' ')[0]}!
                  </span>
                  <Button
                    onClick={handleDashboardClick}
                    variant="default"
                    size="sm"
                  >
                    {profile.role === 'admin' ? 'Painel Admin' : 'Meus Orçamentos'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleLoginClick}
                    variant="ghost"
                    size="sm"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={handleSignupClick}
                    variant="default"
                    size="sm"
                  >
                    Cadastrar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {error && (
            <Alert className="mb-8">
              <AlertDescription>
                Houve um problema ao carregar suas informações. Tente novamente.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Transforme momentos especiais em{" "}
              <span className="text-primary">memórias únicas</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Decorações personalizadas, lembrancinhas exclusivas e presentes únicos 
              para tornar suas celebrações inesquecíveis.
            </p>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Decorações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Árvores de Natal, mesas temáticas e ambientações completas
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Lembrancinhas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Peças personalizadas e únicas para seus convidados
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Presentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cestas, boxes e kits criativos feitos com carinho
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="p-8 bg-gradient-to-br from-card to-muted/50">
            <CardContent className="space-y-6">
              {!user ? (
                <>
                  <h3 className="text-2xl font-semibold text-foreground">
                    Comece seu orçamento personalizado
                  </h3>
                  <p className="text-muted-foreground">
                    Crie sua conta e receba propostas exclusivas em minutos
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleSignupClick}
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      Criar Conta Grátis
                    </Button>
                    <Button
                      onClick={handleLoginClick}
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      Já tenho conta
                    </Button>
                  </div>
                  <Separator className="my-4" />
                  <Button
                    onClick={handleAdminClick}
                    variant="link"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Acesso Administrativo
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-semibold text-foreground">
                    Bem-vinda de volta, {profile?.full_name.split(' ')[0]}!
                  </h3>
                  <p className="text-muted-foreground">
                    {profile?.role === 'admin' 
                      ? 'Gerencie orçamentos e clientes no seu painel'
                      : 'Continue criando seus orçamentos personalizados'
                    }
                  </p>
                  <Button
                    onClick={handleDashboardClick}
                    size="lg"
                  >
                    {profile?.role === 'admin' ? 'Ir para Painel Admin' : 'Ver Meus Orçamentos'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Jaque Natal - Criando momentos únicos e inesquecíveis
          </p>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default Index;
