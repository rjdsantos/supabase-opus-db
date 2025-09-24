import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WhatsAppButton from "@/components/WhatsAppButton";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
const Index = () => {
  const navigate = useNavigate();
  const {
    profile,
    loading
  } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (profile && !loading) {
      const timer = setTimeout(() => {
        if (profile.role === 'admin') {
          navigate('/admin/orcamentos');
        } else {
          navigate('/orcamentos');
        }
      }, 300); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [profile, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Transforme momentos especiais em{" "}
              <span className="text-primary">memórias únicas</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Decorações personalizadas, lembrancinhas exclusivas e presentes únicos 
              para tornar suas celebrações inesquecíveis.
            </p>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
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
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-primary" />
                </div>
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
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-primary" />
                </div>
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
          {!profile ? <Card className="p-8">
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Comece seu orçamento personalizado
                  </h3>
                  <p className="text-muted-foreground">
                    Crie sua conta e receba propostas exclusivas em minutos
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/login?tab=signup')} size="lg" className="flex items-center gap-2">
                    Criar Conta Grátis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate('/login?tab=signin')} variant="outline" size="lg">
                    Já tenho conta
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button onClick={() => navigate('/admin/login')} variant="link" size="sm" className="text-muted-foreground">
                    Acesso Administrativo
                  </Button>
                </div>
              </CardContent>
            </Card> : <Card className="p-8">
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    Bem-vinda de volta, {profile.full_name.split(' ')[0]}!
                  </h3>
                  <p className="text-muted-foreground">
                    {profile.role === 'admin' ? 'Gerencie orçamentos e clientes no seu painel' : 'Continue criando seus orçamentos personalizados'}
                  </p>
                </div>
                
                <Button onClick={() => {
              if (profile.role === 'admin') {
                navigate('/admin/orcamentos');
              } else {
                navigate('/orcamentos');
              }
            }} size="lg" className="flex items-center gap-2">
                  {profile.role === 'admin' ? 'Ir para Painel Admin' : 'Ver Meus Orçamentos'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Jaque é  Natal - Criando momentos únicos e inesquecíveis</p>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>;
};
export default Index;