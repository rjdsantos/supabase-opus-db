import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { orcamentos, loading, error, fetchOrcamentos, updateStatus } = useOrcamentos();
  const navigate = useNavigate();

  const getCategoryLabel = (categoria: string) => {
    const labels = {
      decoracao: "Decoração",
      lembrancinhas: "Lembrancinhas", 
      presentes: "Presentes Especiais"
    };
    return labels[categoria as keyof typeof labels] || categoria;
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

  const handleStatusChange = (id_orcamento: string, newStatus: string) => {
    updateStatus(id_orcamento, newStatus as 'novo' | 'respondido' | 'concluido');
  };

  const handleViewDetails = (id_orcamento: string) => {
    navigate(`/admin/orcamentos/${id_orcamento}`);
  };

  // Real-time subscriptions for live updates
  useEffect(() => {
    fetchOrcamentos();

    const channel = supabase
      .channel('admin-orcamentos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orcamentos'
        },
        () => {
          console.log('Orçamento updated, refreshing data...');
          fetchOrcamentos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'admin_status'
        },
        () => {
          console.log('Status updated, refreshing data...');
          fetchOrcamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrcamentos]);

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto max-w-7xl p-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Orçamentos Recebidos</h1>
              <p className="text-muted-foreground">Gerencie todos os orçamentos dos clientes</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-28" />
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-32" />
                  </CardFooter>
                </Card>
              ))}
            </div>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Orçamentos Recebidos</h1>
              <p className="text-muted-foreground">
                Gerencie todos os orçamentos dos clientes • {orcamentos.length} orçamentos
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={fetchOrcamentos}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>
                Erro ao carregar orçamentos: {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={fetchOrcamentos}
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {orcamentos.length === 0 && !error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium mb-2">Nenhum orçamento recebido ainda</h3>
              <p className="text-muted-foreground">
                Os orçamentos enviados pelos clientes aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orcamentos.map((orcamento) => (
                <Card 
                  key={orcamento.id_orcamento} 
                  className="rounded-2xl hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground truncate">
                        {orcamento.cliente_nome}
                      </CardTitle>
                      <Badge variant={getStatusColor(orcamento.status)}>
                        {getStatusLabel(orcamento.status)}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {getCategoryLabel(orcamento.categoria)}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Data de envio:</strong><br />
                      {format(new Date(orcamento.data_envio), "dd/MM/yyyy 'às' HH:mm", { 
                        locale: ptBR 
                      })}
                    </div>
                    
                    <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                      ID: {orcamento.id_orcamento.split('-')[0]}...
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-4">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(orcamento.id_orcamento)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                    
                    <Select 
                      value={orcamento.status} 
                      onValueChange={(value) => handleStatusChange(orcamento.id_orcamento, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="respondido">Respondido</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard;