import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StatusChange {
  status: string;
  data_alteracao: string;
  admin_id?: string;
}

interface StatusTimelineProps {
  statusHistory: StatusChange[];
}

export const StatusTimeline = ({ statusHistory }: StatusTimelineProps) => {
  const getStatusLabel = (status: string) => {
    const labels = {
      novo: "Novo",
      respondido: "Respondido", 
      concluido: "Concluído",
      em_andamento: "Em andamento",
      cancelado: "Cancelado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      novo: "default" as const,
      em_andamento: "secondary" as const,
      respondido: "destructive" as const,
      concluido: "default" as const,
      cancelado: "outline" as const
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "novo":
        return <Circle className="w-4 h-4" />;
      case "respondido": 
        return <AlertCircle className="w-4 h-4" />;
      case "concluido":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (statusHistory.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Linha do Tempo de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Nenhum histórico de status disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Linha do Tempo de Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusHistory.map((change, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border">
                {getStatusIcon(change.status)}
              </div>
              {index < statusHistory.length - 1 && (
                <div className="w-px h-8 bg-border mt-2" />
              )}
            </div>
            
            <div className="flex-1 space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(change.status)}>
                  {getStatusLabel(change.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(change.data_alteracao), "dd/MM/yyyy 'às' HH:mm", { 
                    locale: ptBR 
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};