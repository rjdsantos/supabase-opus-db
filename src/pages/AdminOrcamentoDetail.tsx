import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, User, Calendar, Package, Clock, Sparkles, Heart, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import { StatusTimeline } from '@/components/StatusTimeline';
import { KeyValueList } from '@/components/KeyValueList';
import { supabase } from '@/integrations/supabase/client';

interface OrcamentoDetail {
  id_orcamento: string;
  categoria: string;
  status: string;
  data_envio: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  detalhes: Array<{ chave: string; valor: string }>;
}

interface StatusHistory {
  status: string;
  data_alteracao: string;
  admin_id?: string;
}

const AdminOrcamentoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<OrcamentoDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const fetchOrcamentoDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch orçamento with client info
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          id_orcamento,
          categoria,
          status,
          data_envio,
          id_cliente,
          profiles:id_cliente(full_name, email, phone)
        `)
        .eq('id_orcamento', id)
        .single();

      if (orcamentoError) throw orcamentoError;
      if (!orcamentoData) throw new Error('Orçamento não encontrado');

      // Fetch orçamento details
      const { data: detalhesData, error: detalhesError } = await supabase
        .from('orcamento_detalhes')
        .select('chave, valor')
        .eq('id_orcamento', id)
        .order('chave');

      if (detalhesError) throw detalhesError;

      // Fetch status history
      const { data: statusData, error: statusError } = await supabase
        .from('admin_status')
        .select('status, data_alteracao, admin_id')
        .eq('id_orcamento', id)
        .order('data_alteracao', { ascending: false });

      if (statusError) throw statusError;

      // Transform data
      const orcamentoDetail: OrcamentoDetail = {
        id_orcamento: orcamentoData.id_orcamento,
        categoria: orcamentoData.categoria,
        status: orcamentoData.status,
        data_envio: orcamentoData.data_envio,
        cliente_nome: orcamentoData.profiles?.full_name || 'Nome não informado',
        cliente_email: orcamentoData.profiles?.email || '',
        cliente_telefone: orcamentoData.profiles?.phone || '',
        detalhes: detalhesData || [],
      };

      setOrcamento(orcamentoDetail);
      setStatusHistory(statusData || []);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching orçamento detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!orcamento) return;

    try {
      setUpdatingStatus(true);

      // Update status in orcamentos table
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({ status: newStatus as 'novo' | 'respondido' | 'concluido' })
        .eq('id_orcamento', orcamento.id_orcamento);

      if (updateError) throw updateError;

      // Log status change in admin_status table
      const { error: logError } = await supabase
        .from('admin_status')
        .insert({
          id_orcamento: orcamento.id_orcamento,
          status: newStatus as 'novo' | 'respondido' | 'concluido',
          admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (logError) throw logError;

      // If status changed to 'concluido', trigger evaluation invite
      if (newStatus === 'concluido') {
        try {
          await supabase.functions.invoke('notify-convite-avaliacao', {
            body: { id_orcamento: orcamento.id_orcamento, send_whatsapp: false }
          });
          toast({
            title: "Status atualizado",
            description: "Orçamento marcado como concluído e convite de avaliação enviado ao cliente.",
          });
        } catch (notificationError) {
          console.error('Erro ao enviar convite de avaliação:', notificationError);
          toast({
            title: "Status atualizado",
            description: "Status alterado com sucesso, mas houve erro no envio do convite de avaliação.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Status atualizado",
          description: "Status do orçamento alterado com sucesso.",
        });
      }

      // Update local state
      setOrcamento(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Refresh status history
      fetchOrcamentoDetail();

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Falha ao alterar o status do orçamento.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrcamentoDetail();
  }, [id]);

  const getCategoryLabel = (categoria: string) => {
    const labels = {
      decoracao: "Decoração",
      lembrancinhas: "Lembrancinhas", 
      presentes: "Presentes Especiais"
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  const getCategoryIcon = (categoria: string) => {
    const icons = {
      decoracao: <Sparkles className="w-5 h-5" />,
      lembrancinhas: <Heart className="w-5 h-5" />,
      presentes: <Gift className="w-5 h-5" />
    };
    return icons[categoria as keyof typeof icons] || <Package className="w-5 h-5" />;
  };

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    const colors = {
      novo: "default" as const,
      respondido: "secondary" as const, 
      concluido: "outline" as const
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      novo: "Novo",
      respondido: "Respondido",
      concluido: "Concluído"
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto max-w-7xl p-6 py-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  {[1, 2].map((i) => (
                    <Card key={i} className="rounded-2xl">
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="lg:col-span-2 space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-2xl">
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !orcamento) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto max-w-7xl p-6 py-8">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Orçamento não encontrado'}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={() => navigate('/admin/orcamentos')}
                >
                  Voltar
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl p-6 py-8">
          {/* Header with back button */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/orcamentos')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Orçamentos
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Detalhes do Orçamento
                </h1>
                <p className="text-muted-foreground">
                  {getCategoryLabel(orcamento.categoria)} - {orcamento.cliente_nome}
                </p>
              </div>
              <Badge variant={getStatusColor(orcamento.status)} className="text-sm px-3 py-1">
                {getStatusLabel(orcamento.status)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info & Status Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Client Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Nome</div>
                    <div className="font-semibold">{orcamento.cliente_nome}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground">E-mail</div>
                    <a 
                      href={`mailto:${orcamento.cliente_email}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {orcamento.cliente_email}
                    </a>
                  </div>
                  
                  {orcamento.cliente_telefone && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm text-muted-foreground">Telefone</div>
                        <a 
                          href={`tel:${orcamento.cliente_telefone}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {orcamento.cliente_telefone}
                        </a>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status Management Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Status do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Status Atual</div>
                    <Badge variant={getStatusColor(orcamento.status)}>
                      {getStatusLabel(orcamento.status)}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Alterar Status</div>
                    <Select 
                      value={orcamento.status} 
                      onValueChange={updateStatus}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="respondido">Respondido</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Atualizando status...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Categoria</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryIcon(orcamento.categoria)}
                      <span className="font-semibold">{getCategoryLabel(orcamento.categoria)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={getStatusColor(orcamento.status)} className="mt-1">
                      {getStatusLabel(orcamento.status)}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Data de Envio</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {format(new Date(orcamento.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">ID do Orçamento</div>
                    <div className="font-mono text-xs mt-1 p-2 bg-muted rounded">
                      {orcamento.id_orcamento}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Card */}
              <KeyValueList 
                title="Detalhes do Orçamento"
                items={orcamento.detalhes}
              />

              {/* Status Timeline Card */}
              <StatusTimeline statusHistory={statusHistory} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminOrcamentoDetail;