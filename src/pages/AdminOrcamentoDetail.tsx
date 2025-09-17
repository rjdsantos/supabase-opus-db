import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, User, Package, Gift, Heart, Sparkles, MessageSquare, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

interface OrcamentoDetail {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  status: 'novo' | 'respondido' | 'concluido';
  data_envio: string;
  created_at: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  detalhes: Record<string, string>;
}

const AdminOrcamentoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<OrcamentoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrcamentoDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch orcamento with client details
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select(`
            id_orcamento,
            categoria,
            status,
            data_envio,
            created_at,
            profiles!fk_orcamentos_cliente(full_name, email, phone)
          `)
          .eq('id_orcamento', id)
          .single();

        if (orcamentoError) throw orcamentoError;

        // Fetch orcamento details
        const { data: detailsData, error: detailsError } = await supabase
          .from('orcamento_detalhes')
          .select('chave, valor')
          .eq('id_orcamento', id);

        if (detailsError) throw detailsError;

        const detalhes: Record<string, string> = {};
        detailsData?.forEach(detail => {
          if (detail.valor) {
            detalhes[detail.chave] = detail.valor;
          }
        });

        const mappedOrcamento: OrcamentoDetail = {
          id_orcamento: orcamentoData.id_orcamento,
          categoria: orcamentoData.categoria,
          status: orcamentoData.status,
          data_envio: orcamentoData.data_envio,
          created_at: orcamentoData.created_at,
          cliente_nome: orcamentoData.profiles?.full_name || 'Nome não informado',
          cliente_email: orcamentoData.profiles?.email || '',
          cliente_telefone: orcamentoData.profiles?.phone || '',
          detalhes
        };

        setOrcamento(mappedOrcamento);
      } catch (error: any) {
        console.error('Error fetching orcamento details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

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

  const getFieldLabel = (key: string) => {
    const labels: Record<string, string> = {
      // Decoração
      tipo_evento: "Tipo de Evento",
      data_evento: "Data do Evento",
      horario_evento: "Horário do Evento",
      local_evento: "Local do Evento",
      n_convidados: "Número de Convidados",
      tamanho_espaco: "Tamanho do Espaço",
      estilo_preferido: "Estilo Preferido",
      cores_preferidas: "Cores Preferidas",
      descricao_evento: "Descrição do Evento",
      
      // Lembrancinhas
      faixa_etaria: "Faixa Etária",
      quantidade: "Quantidade",
      tipo_lembrancinha: "Tipo de Lembrancinha",
      tipo_lembrancinha_outra_opcao_texto: "Outro Tipo (Descrição)",
      tema: "Tema",
      cores: "Cores",
      personalizacao: "Personalização",
      
      // Presentes
      data_entrega: "Data de Entrega",
      tipo_presente: "Tipo de Presente",
      tipo_presente_outra_opcao_texto: "Outro Tipo (Descrição)",
      orientacoes_adicionais: "Orientações Adicionais"
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFieldValue = (key: string, value: string) => {
    // Format dates
    if (key.includes('data') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
    }
    
    // Format time
    if (key.includes('horario') && value.match(/^\d{2}:\d{2}/)) {
      return value;
    }
    
    return value;
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto max-w-4xl p-4 py-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              {[1, 2, 3].map((i) => (
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
          <div className="container mx-auto max-w-4xl p-4 py-8">
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
        <div className="container mx-auto max-w-4xl p-4 py-8">
          {/* Header com botão voltar */}
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
              <Badge variant={getStatusColor(orcamento.status)} className="text-sm">
                {orcamento.status === 'novo' ? 'Novo' : 
                 orcamento.status === 'respondido' ? 'Respondido' : 'Concluído'}
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            {/* Informações Gerais */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(orcamento.categoria)}
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Data de Envio:</span>
                    <span className="font-medium">
                      {format(new Date(orcamento.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Categoria:</span>
                    <span className="font-medium">{getCategoryLabel(orcamento.categoria)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Cliente */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="font-medium">{orcamento.cliente_nome}</span>
                  </div>
                  {orcamento.cliente_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="font-medium">{orcamento.cliente_email}</span>
                    </div>
                  )}
                  {orcamento.cliente_telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{orcamento.cliente_telefone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detalhes do Orçamento */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Detalhes do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(orcamento.detalhes).length === 0 ? (
                  <p className="text-muted-foreground italic">
                    Nenhum detalhe específico fornecido.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(orcamento.detalhes).map(([key, value]) => (
                      <div key={key} className="border-b pb-3 last:border-b-0">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {getFieldLabel(key)}
                          </span>
                          <span className="text-sm">
                            {formatFieldValue(key, value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminOrcamentoDetail;