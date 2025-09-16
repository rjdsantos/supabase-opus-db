import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Gift, Sparkles, AlertCircle, Clock, CheckCircle2, FileText } from "lucide-react";

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

interface OrcamentoDraft {
  id_orcamento: string;
  categoria: string;
  status: string;
  created_at: string;
  is_draft: boolean;
}

const ClientDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<OrcamentoDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id) {
        setProfileLoading(false);
        setDraftsLoading(false);
        return;
      }

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', profile.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setProfileError('Erro ao carregar perfil');
        } else {
          setProfileData(profileData);
        }

        // Fetch drafts and recent budgets
        const { data: draftsData, error: draftsError } = await supabase
          .from('orcamentos')
          .select('id_orcamento, categoria, status, created_at, is_draft')
          .eq('id_cliente', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (draftsError) {
          console.error('Error fetching drafts:', draftsError);
        } else {
          setDrafts(draftsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProfileError('Erro ao carregar dados');
      } finally {
        setProfileLoading(false);
        setDraftsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [profile?.user_id, authLoading]);

  const handleCategoryClick = (route: string) => {
    navigate(route);
  };

  const handleContinueDraft = (draft: OrcamentoDraft) => {
    navigate(`/orcamento/${draft.categoria}`);
  };

  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || 'Cliente';
  };

  const getCategoryDisplayName = (categoria: string) => {
    const categoryMap: Record<string, string> = {
      decoracao: 'Decoração',
      lembrancinhas: 'Lembrancinhas', 
      presentes: 'Presentes Especiais'
    };
    return categoryMap[categoria] || categoria;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

          {/* Existing Drafts and Budgets */}
          {!draftsLoading && drafts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Seus Orçamentos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {drafts.map((draft) => (
                  <Card 
                    key={draft.id_orcamento}
                    className="hover:shadow-lg transition-shadow duration-200 border-border bg-card"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-card-foreground">
                          {getCategoryDisplayName(draft.categoria)}
                        </CardTitle>
                        <Badge variant={draft.is_draft ? "secondary" : "default"}>
                          {draft.is_draft ? (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Rascunho
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {draft.status === 'pendente' ? 'Enviado' : draft.status}
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-muted-foreground">
                        Criado em {formatDate(draft.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        onClick={() => handleContinueDraft(draft)}
                        className="w-full"
                        variant={draft.is_draft ? "default" : "outline"}
                      >
                        {draft.is_draft ? 'Continuar Editando' : 'Ver Detalhes'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="mb-8" />
            </div>
          )}

          {draftsLoading && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Seus Orçamentos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="mb-8" />
            </div>
          )}

          {/* New Budget Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Criar Novo Orçamento
            </h2>
            <p className="text-muted-foreground mb-6">
              Escolha uma categoria para iniciar um novo orçamento personalizado
            </p>
          </div>

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