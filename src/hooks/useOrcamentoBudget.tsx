import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface OrcamentoBudget {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  status: 'novo' | 'respondido' | 'concluido' | 'em_andamento' | 'cancelado';
  data_envio: string | null;
  created_at: string;
}

export interface OrcamentoDetail {
  chave: string;
  valor: string;
}

export const useOrcamentoBudget = (categoria: 'decoracao' | 'lembrancinhas' | 'presentes', idOrcamento?: string | null) => {
  const [budget, setBudget] = useState<OrcamentoBudget | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadOrCreateBudget = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let currentBudget = null;

      // If specific ID provided, load that budget
      if (idOrcamento) {
        const { data: specificBudget, error: specificError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id_orcamento', idOrcamento)
          .eq('id_cliente', user.id)
          .single();

        if (specificError) throw specificError;
        currentBudget = specificBudget;

        setBudget(currentBudget);

        // Load existing details
        const { data: detailsData, error: detailsError } = await supabase
          .from('orcamento_detalhes')
          .select('chave, valor')
          .eq('id_orcamento', currentBudget.id_orcamento);

        if (detailsError) throw detailsError;

        const detailsMap: Record<string, string> = {};
        detailsData?.forEach(detail => {
          if (detail.valor) {
            detailsMap[detail.chave] = detail.valor;
          }
        });
        setDetails(detailsMap);
      } else {
        // No specific ID provided - we're starting a new budget
        // Don't load anything, just reset state
        setBudget(null);
        setDetails({});
      }
    } catch (error: any) {
      console.error('Error loading budget:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveDetail = async (key: string, value: string) => {
    if (!budget || !user) return;

    try {
      const { error } = await supabase
        .from('orcamento_detalhes')
        .upsert({
          id_orcamento: budget.id_orcamento,
          chave: key,
          valor: value
        }, {
          onConflict: 'id_orcamento,chave'
        });

      if (error) throw error;

      setDetails(prev => ({ ...prev, [key]: value }));
    } catch (error: any) {
      console.error('Error saving detail:', error);
      throw error;
    }
  };

  const deleteDetails = async (keys: string[]) => {
    if (!budget) return;

    try {
      const { error } = await supabase
        .from('orcamento_detalhes')
        .delete()
        .eq('id_orcamento', budget.id_orcamento)
        .in('chave', keys);

      if (error) throw error;

      setDetails(prev => {
        const newDetails = { ...prev };
        keys.forEach(key => delete newDetails[key]);
        return newDetails;
      });
    } catch (error: any) {
      console.error('Error deleting details:', error);
      throw error;
    }
  };


  const finalizeBudget = async (formData: Record<string, string>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setSaving(true);
      const now = new Date().toISOString();

      let current = budget;

      // If there is no budget yet, create a finalized one immediately
      if (!current) {
        // Check if there's a linked budget from another category
        let linkedBudgetId = null;
        
        // Look for any existing budget for this user that could be linked
        const { data: existingBudgets } = await supabase
          .from('orcamentos')
          .select('id_orcamento, categoria')
          .eq('id_cliente', user.id)
          .neq('categoria', categoria)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (existingBudgets && existingBudgets.length > 0) {
          linkedBudgetId = existingBudgets[0].id_orcamento;
        }

        const { data: newBudget, error: createError } = await supabase
          .from('orcamentos')
          .insert({
            id_cliente: user.id,
            categoria,
            status: 'novo',
            data_envio: now,
            id_orcamento_vinculado: linkedBudgetId
          })
          .select()
          .single();

        if (createError) throw createError;
        current = newBudget;
        setBudget(newBudget);
      }

      // Save all form data for the current budget id
      const detailEntries = Object.entries(formData || {});
      if (detailEntries.length > 0) {
        const promises = detailEntries.map(([key, value]) =>
          supabase
            .from('orcamento_detalhes')
            .upsert(
              {
                id_orcamento: current!.id_orcamento,
                chave: key,
                valor: value,
              },
              { onConflict: 'id_orcamento,chave' }
            )
        );
        await Promise.all(promises);
      }

      // Trigger notifications asynchronously
      try {
        await supabase.functions.invoke('notify-orcamento-finalizado', {
          body: { id_orcamento: current.id_orcamento }
        });
        console.log('Notificações disparadas para orçamento:', current.id_orcamento);
      } catch (notificationError) {
        console.error('Erro ao enviar notificações:', notificationError);
        // Não bloqueia o fluxo principal se notificações falharem
      }

      toast({
        title: 'Orçamento finalizado',
        description: 'Seu orçamento foi enviado com sucesso!',
      });

      return current.id_orcamento;
    } catch (error: any) {
      console.error('Error finalizing budget:', error);
      toast({
        title: 'Erro ao finalizar',
        description: error.message || 'Falha ao finalizar o orçamento.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrCreateBudget();
    }
  }, [user, categoria, idOrcamento]);

  return {
    budget,
    details,
    loading,
    saving,
    error,
    finalizeBudget,
    saveDetail,
    deleteDetails,
    reload: loadOrCreateBudget
  };
};