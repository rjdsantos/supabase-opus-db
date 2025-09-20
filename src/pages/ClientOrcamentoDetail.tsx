import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Calendar, MessageCircle } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { KeyValueList } from "@/components/KeyValueList";
import DecoracaoDetails from "@/components/DecoracaoDetails";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrcamentoDetailData {
  id_orcamento: string;
  categoria: string;
  status: string;
  data_envio: string;
  is_draft: boolean;
  detalhes: Array<{ chave: string; valor: string }>;
}

const ClientOrcamentoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orcamento, setOrcamento] = useState<OrcamentoDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrcamentoDetail = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orçamento info
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('id_orcamento, categoria, status, data_envio, is_draft')
          .eq('id_orcamento', id)
          .eq('id_cliente', user.id)
          .single();

        if (orcamentoError) throw orcamentoError;
        if (!orcamentoData) throw new Error('Orçamento não encontrado');
        
        console.log('Orcamento data fetched:', orcamentoData);

        // Fetch orçamento details
        const { data: detalhesData, error: detalhesError } = await supabase
          .from('orcamento_detalhes')
          .select('chave, valor')
          .eq('id_orcamento', id)
          .order('chave');

        if (detalhesError) throw detalhesError;
        
        console.log('Detalhes data fetched:', detalhesData);

        const orcamentoDetail: OrcamentoDetailData = {
          id_orcamento: orcamentoData.id_orcamento,
          categoria: orcamentoData.categoria,
          status: orcamentoData.status,
          data_envio: orcamentoData.data_envio,
          is_draft: orcamentoData.is_draft,
          detalhes: detalhesData || [],
        };

        setOrcamento(orcamentoDetail);
      } catch (error: any) {
        setError(error.message);
        console.error('Error fetching orçamento detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrcamentoDetail();
  }, [id, user]);

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      decoracao: 'Decoração',
      lembrancinhas: 'Lembrancinhas',
      presentes: 'Presentes Especiais'
    };
    return labels[categoria] || categoria;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      novo: 'Novo',
      respondido: 'Respondido',
      concluido: 'Concluído'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'novo':
        return 'secondary' as const;
      case 'respondido':
        return 'default' as const;
      case 'concluido':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/orcamentos');
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !orcamento) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Orçamento não encontrado'}
              </AlertDescription>
            </Alert>
            <Button onClick={handleBackToDashboard} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Orçamentos
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button 
                onClick={handleBackToDashboard}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos Orçamentos
              </Button>
            </div>

            {/* Budget Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Orçamento de {getCategoryLabel(orcamento.categoria)}
                    </CardTitle>
                    <CardDescription>
                      Número: {orcamento.id_orcamento.substring(0, 8).toUpperCase()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(orcamento.status)}>
                    {getStatusLabel(orcamento.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Categoria
                    </Label>
                    <p className="mt-1 text-sm font-medium">
                      {getCategoryLabel(orcamento.categoria)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <p className="mt-1 text-sm font-medium">
                      {getStatusLabel(orcamento.status)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Data de Envio
                    </Label>
                    <p className="mt-1 text-sm font-medium">
                      {new Date(orcamento.data_envio).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Tipo
                    </Label>
                    <p className="mt-1 text-sm font-medium">
                      {orcamento.is_draft ? 'Rascunho' : 'Finalizado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Details */}
            {orcamento.categoria === 'decoracao' ? (
              <DecoracaoDetails detalhes={orcamento.detalhes} />
            ) : (
              <KeyValueList 
                title="Detalhes do Orçamento" 
                items={orcamento.detalhes}
              />
            )}

            {/* Actions */}
            {!orcamento.is_draft && (
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Passos</CardTitle>
                  <CardDescription>
                    Entre em contato para mais informações ou atualizações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="flex-1 gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Entrar em Contato
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Calendar className="h-4 w-4" />
                      Agendar Reunião
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Draft notice */}
            {orcamento.is_draft && (
              <Alert>
                <AlertDescription>
                  Este é um rascunho. Você pode continuar editando clicando em "Continuar Editando" no painel de orçamentos.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* WhatsApp Floating Button */}
        <WhatsAppButton />
      </div>
    </AuthGuard>
  );
};

export default ClientOrcamentoDetail;