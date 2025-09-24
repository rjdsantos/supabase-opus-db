import React, { useEffect, useState } from 'react';
import { useOrcamentoRelated } from '@/hooks/useOrcamentoRelated';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface RelatedBudget {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  status: 'novo' | 'respondido' | 'concluido' | 'em_andamento' | 'cancelado';
  data_envio: string | null;
  created_at: string;
}

interface LinkedBudgetsProps {
  currentBudgetId: string;
  currentCategory: string;
}

const getCategoryLabel = (categoria: string) => {
  switch (categoria) {
    case 'decoracao': return 'Decoração';
    case 'lembrancinhas': return 'Lembrancinhas';
    case 'presentes': return 'Presentes Especiais';
    default: return categoria;
  }
};

const getStatusIcon = (budget: RelatedBudget) => {
  switch (budget.status) {
    case 'novo':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'respondido':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'em_andamento':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'concluido':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelado':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusLabel = (budget: RelatedBudget) => {
  switch (budget.status) {
    case 'novo': return 'Novo';
    case 'respondido': return 'Respondido';
    case 'em_andamento': return 'Em andamento';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return budget.status;
  }
};

export const LinkedBudgets: React.FC<LinkedBudgetsProps> = ({ 
  currentBudgetId, 
  currentCategory 
}) => {
  const [relatedBudgets, setRelatedBudgets] = useState<RelatedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const { getLinkedBudgets } = useOrcamentoRelated();

  useEffect(() => {
    const loadLinkedBudgets = async () => {
      try {
        setLoading(true);
        const linked = await getLinkedBudgets(currentBudgetId);
        setRelatedBudgets(linked);
      } catch (error) {
        console.error('Error loading linked budgets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentBudgetId) {
      loadLinkedBudgets();
    }
  }, [currentBudgetId]);

  if (loading || relatedBudgets.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-5 w-5 text-primary" />
          Orçamentos Relacionados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relatedBudgets.map((budget) => (
            <div
              key={budget.id_orcamento}
              className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(budget)}
                <div>
                  <div className="font-medium">
                    {getCategoryLabel(budget.categoria)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {budget.data_envio 
                      ? new Date(budget.data_envio).toLocaleDateString('pt-BR')
                      : new Date(budget.created_at).toLocaleDateString('pt-BR')
                    }
                  </div>
                </div>
              </div>
              <Badge 
                variant={budget.status === 'concluido' ? "default" : "outline"}
              >
                {getStatusLabel(budget)}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Estes orçamentos estão conectados ao orçamento atual de {getCategoryLabel(currentCategory)}.
        </div>
      </CardContent>
    </Card>
  );
};