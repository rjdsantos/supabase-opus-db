import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RelatedOrcamento {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  status: 'novo' | 'respondido' | 'concluido' | 'em_andamento' | 'cancelado';
  data_envio: string | null;
  created_at: string;
}

export const useOrcamentoRelated = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const finalizeAndCreateLinked = async (
    currentBudgetId: string,
    formData: Record<string, string>,
    nextCategory: 'lembrancinhas' | 'presentes'
  ) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      setLoading(true);

      // First, save all form data for current budget
      const detailsPromises = Object.entries(formData).map(([key, value]) =>
        supabase
          .from('orcamento_detalhes')
          .upsert({
            id_orcamento: currentBudgetId,
            chave: key,
            valor: value
          }, {
            onConflict: 'id_orcamento,chave'
          })
      );
      await Promise.all(detailsPromises);

      // Update current budget data_envio if needed
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          data_envio: new Date().toISOString()
        })
        .eq('id_orcamento', currentBudgetId)
        .eq('id_cliente', user.id);

      if (updateError) throw updateError;

      // Trigger notifications via edge function (secure way)
      try {
        await supabase.functions.invoke('notify-orcamento-finalizado', {
          body: { id_orcamento: currentBudgetId }
        });
        console.log('Notificações disparadas para orçamento:', currentBudgetId);
      } catch (notificationError) {
        console.error('Erro ao enviar notificações:', notificationError);
        // Não bloqueia o fluxo principal se notificações falharem
      }

      // Create new linked budget 
      const { data: newBudget, error: createError } = await supabase
        .from('orcamentos')
        .insert({
          id_cliente: user.id,
          categoria: nextCategory,
          status: 'novo',
          data_envio: new Date().toISOString(),
          id_orcamento_vinculado: currentBudgetId
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Orçamento finalizado",
        description: "Orçamento anterior finalizado e novo orçamento criado com sucesso!",
      });

      return newBudget.id_orcamento;
    } catch (error: any) {
      console.error('Error finalizing and creating linked budget:', error);
      toast({
        title: "Erro ao processar",
        description: error.message || "Falha ao finalizar e criar novo orçamento.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getLinkedBudgets = async (budgetId: string): Promise<RelatedOrcamento[]> => {
    try {
      // Get budgets linked to this one (this budget as parent)
      const { data: childBudgets, error: childError } = await supabase
        .from('orcamentos')
        .select('id_orcamento, categoria, status, data_envio, created_at')
        .eq('id_orcamento_vinculado', budgetId)
        .eq('id_cliente', user?.id);

      if (childError) throw childError;

      // Get budget this one is linked to (parent budget)
      const { data: currentBudget } = await supabase
        .from('orcamentos')
        .select('id_orcamento_vinculado')
        .eq('id_orcamento', budgetId)
        .single();

      let parentBudget = null;
      if (currentBudget?.id_orcamento_vinculado) {
        const { data: parent, error: parentError } = await supabase
          .from('orcamentos')
          .select('id_orcamento, categoria, status, data_envio, created_at')
          .eq('id_orcamento', currentBudget.id_orcamento_vinculado)
          .eq('id_cliente', user?.id)
          .single();

        if (!parentError && parent) {
          parentBudget = parent;
        }
      }

      const relatedBudgets = [...(childBudgets || [])];
      if (parentBudget) {
        relatedBudgets.unshift(parentBudget);
      }

      return relatedBudgets;
    } catch (error: any) {
      console.error('Error getting linked budgets:', error);
      return [];
    }
  };

  return {
    finalizeAndCreateLinked,
    getLinkedBudgets,
    loading
  };
};