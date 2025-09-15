import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, MessageCircle } from 'lucide-react';

import { AuthGuard } from '@/components/AuthGuard';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import WhatsAppButton from '@/components/WhatsAppButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BudgetInfo {
  id_orcamento: string;
  categoria: string;
  status: string;
  data_envio: string;
  is_draft: boolean;
}

export const OrcamentoConfirmacao = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const budgetId = searchParams.get('id_orcamento');
  
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBudget = async () => {
      if (!budgetId || !user) {
        setError('Orçamento não encontrado');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select('id_orcamento, categoria, status, data_envio, is_draft')
          .eq('id_orcamento', budgetId)
          .eq('id_cliente', user.id)
          .single();

        if (error) throw error;

        if (!data || data.is_draft) {
          setError('Orçamento não finalizado');
          setLoading(false);
          return;
        }

        setBudget(data);
      } catch (error: any) {
        console.error('Error loading budget:', error);
        setError('Erro ao carregar informações do orçamento');
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [budgetId, user]);

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      decoracao: 'Decoração',
      lembrancinhas: 'Lembrancinhas',
      presentes: 'Presentes Especiais'
    };
    return labels[categoria] || categoria;
  };

  const handleScheduleEvent = () => {
    // Placeholder for calendar integration
    // TODO: Implement calendar scheduling integration
    alert('Funcionalidade de agendamento em desenvolvimento');
  };

  const handlePreBudget = () => {
    // Placeholder for pre-budget functionality
    // TODO: Implement pre-budget sending functionality
    alert('Funcionalidade de pré-orçamento em desenvolvimento');
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
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando informações...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !budget) {
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
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-green-900">
                      Orçamento Enviado com Sucesso!
                    </h1>
                    <p className="text-green-700 mt-1">
                      Seu pedido de orçamento foi recebido e será analisado em breve.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Orçamento</CardTitle>
                <CardDescription>
                  Detalhes do seu pedido de orçamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Categoria
                    </Label>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {getCategoryLabel(budget.categoria)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {budget.status === 'novo' ? 'Novo' : budget.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Data de Envio
                    </Label>
                    <p className="mt-1 text-sm">
                      {new Date(budget.data_envio).toLocaleDateString('pt-BR', {
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
                      Número do Orçamento
                    </Label>
                    <p className="mt-1 text-sm font-mono">
                      {budget.id_orcamento.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
                <CardDescription>
                  Escolha como deseja prosseguir com seu orçamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <Calendar className="h-12 w-12 text-primary mx-auto" />
                        <div>
                          <h3 className="font-semibold">Agendar Reunião</h3>
                          <p className="text-sm text-muted-foreground">
                            Marque uma conversa para discutir detalhes
                          </p>
                        </div>
                        <Button onClick={handleScheduleEvent} className="w-full">
                          Agendar Reunião
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <MessageCircle className="h-12 w-12 text-primary mx-auto" />
                        <div>
                          <h3 className="font-semibold">Pré-orçamento Inicial</h3>
                          <p className="text-sm text-muted-foreground">
                            Receba uma estimativa rápida por WhatsApp
                          </p>
                        </div>
                        <Button onClick={handlePreBudget} variant="outline" className="w-full">
                          Solicitar Pré-orçamento
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Jaqueline entrará em contato em breve!</strong><br />
                Você receberá uma resposta por e-mail ou WhatsApp dentro de 24 horas.
                Fique à vontade para entrar em contato conosco a qualquer momento.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button onClick={handleBackToDashboard} variant="outline">
                Ver Meus Orçamentos
              </Button>
              <Button onClick={() => navigate('/orcamento/decoracao')} variant="ghost">
                Fazer Novo Orçamento
              </Button>
            </div>
          </div>
        </div>

        {/* Floating WhatsApp Button */}
        <WhatsAppButton />
      </div>
    </AuthGuard>
  );
};

export default OrcamentoConfirmacao;