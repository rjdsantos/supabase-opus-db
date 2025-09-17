import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface OrcamentoBudget {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  is_draft: boolean;
  status: 'novo' | 'respondido' | 'concluido';
  data_envio: string | null;
  created_at: string;
}

export interface OrcamentoDetail {
  chave: string;
  valor: string;
}

export const useOrcamentoBudget = (categoria: 'decoracao' | 'lembrancinhas' | 'presentes', idOrcamento?: string) => {
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
      } else {
        // Try to find existing draft (idempotent and safe with StrictMode)
        const { data: existingBudget, error: findError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id_cliente', user.id)
          .eq('categoria', categoria)
          .eq('is_draft', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        currentBudget = existingBudget;

        if (!currentBudget && findError) {
          throw findError;
        }
      }

      if (!currentBudget) {
        // Attempt to create a new draft
        const { data: newBudget, error: createError } = await supabase
          .from('orcamentos')
          .insert({
            id_cliente: user.id,
            categoria,
            status: 'novo',
            is_draft: true
          })
          .select()
          .single();

        if (createError) {
          // Handle race condition: if a duplicate was created concurrently, fetch it
          if (createError.code === '23505' || createError.code === '409') {
            const { data: retryBudget, error: retryError } = await supabase
              .from('orcamentos')
              .select('*')
              .eq('id_cliente', user.id)
              .eq('categoria', categoria)
              .eq('is_draft', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (retryError) throw retryError;
            currentBudget = retryBudget;
          } else {
            throw createError;
          }
        } else {
          currentBudget = newBudget;
        }
      }

      setBudget(currentBudget);

      // Load existing details
      if (currentBudget) {
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

  const saveDraft = async (formData: Record<string, string>) => {
    if (!budget) return;

    try {
      setSaving(true);

      // Save all current form data
      const promises = Object.entries(formData).map(([key, value]) =>
        saveDetail(key, value)
      );

      await Promise.all(promises);

      toast({
        title: "Rascunho salvo",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Falha ao salvar o rascunho.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const finalizeBudget = async (formData: Record<string, string>) => {
    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    try {
      setSaving(true);

      // Save all form data first
      const promises = Object.entries(formData).map(([key, value]) =>
        saveDetail(key, value)
      );
      await Promise.all(promises);

      // Finalize the budget
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          is_draft: false,
          data_envio: new Date().toISOString()
        })
        .eq('id_orcamento', budget.id_orcamento);

      if (updateError) throw updateError;

      // Create notifications
      const notificationPromises = [
        supabase.from('notificacoes').insert({
          id_orcamento: budget.id_orcamento,
          tipo: 'email_cliente',
          status_envio: 'pendente'
        }),
        supabase.from('notificacoes').insert({
          id_orcamento: budget.id_orcamento,
          tipo: 'email_admin',
          status_envio: 'pendente'
        })
      ];

      await Promise.all(notificationPromises);

      setBudget(prev => prev ? {
        ...prev,
        is_draft: false,
        data_envio: new Date().toISOString()
      } : null);

      toast({
        title: "Orçamento finalizado",
        description: "Seu orçamento foi enviado com sucesso!",
      });

      return budget.id_orcamento;
    } catch (error: any) {
      console.error('Error finalizing budget:', error);
      toast({
        title: "Erro ao finalizar",
        description: error.message || "Falha ao finalizar o orçamento.",
        variant: "destructive",
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
    saveDraft,
    finalizeBudget,
    saveDetail,
    deleteDetails,
    reload: loadOrCreateBudget
  };
};