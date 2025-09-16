import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Gift, Sparkles, AlertCircle } from "lucide-react";

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const categories: CategoryCard[] = [
  {
    id: "decoracao",
    title: "Decoração",
    description: "Transforme seu evento com decorações únicas e personalizadas",
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    route: "/orcamento/decoracao"
  },
  {
    id: "lembrancinhas", 
    title: "Lembrancinhas",
    description: "Lembrancinhas especiais para marcar momentos inesquecíveis",
    icon: <Heart className="h-8 w-8 text-primary" />,
    route: "/orcamento/lembrancinhas"
  },
  {
    id: "presentes",
    title: "Presentes Especiais", 
    description: "Presentes únicos e personalizados para todas as ocasiões",
    icon: <Gift className="h-8 w-8 text-primary" />,
    route: "/orcamento/presentes"
  }
];

const ClientDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile?.user_id) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', profile.user_id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfileError('Erro ao carregar perfil');
        } else {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileError('Erro ao carregar perfil');
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [profile?.user_id, authLoading]);

  const handleCategoryClick = (route: string) => {
    navigate(route);
  };

  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || 'Cliente';
  };

  const isLoading = authLoading || profileLoading;

  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Greeting Section */}
          <div className="mb-8">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Olá, {profileData ? getFirstName(profileData.full_name) : getFirstName(profile?.full_name || '')}!
                </h1>
                <p className="text-muted-foreground">
                  Escolha uma categoria para iniciar seu orçamento personalizado
                </p>
              </div>
            )}
          </div>

          <Separator className="mb-8" />

          {/* Error Alert */}
          {profileError && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {profileError}. Você ainda pode continuar e iniciar um orçamento.
              </AlertDescription>
            </Alert>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="hover:shadow-lg transition-shadow duration-200 border-border bg-card"
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handleCategoryClick(category.route)}
                    className="w-full"
                    size="lg"
                  >
                    Iniciar Orçamento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda? Entre em contato pelo WhatsApp!
            </p>
          </footer>
        </div>

        {/* WhatsApp Floating Button */}
        <WhatsAppButton />
      </div>
    </AuthGuard>
  );
};

export default ClientDashboard;