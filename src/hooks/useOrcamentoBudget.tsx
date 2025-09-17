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
        // Check if there's a linked budget from another category that we should connect to
        let linkedBudgetId = null;
        
        if (idOrcamento) {
          // If we have an ID from URL, try to find if it's a different category
          const { data: existingBudget } = await supabase
            .from('orcamentos')
            .select('id_orcamento, categoria')
            .eq('id_orcamento', idOrcamento)
            .eq('id_cliente', user.id)
            .single();
            
          if (existingBudget && existingBudget.categoria !== categoria) {
            linkedBudgetId = existingBudget.id_orcamento;
          }
        }

        // Attempt to create a new draft
        const { data: newBudget, error: createError } = await supabase
          .from('orcamentos')
          .insert({
            id_cliente: user.id,
            categoria,
            status: 'novo',
            is_draft: true,
            id_orcamento_vinculado: linkedBudgetId
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
            is_draft: false,
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

      // If existing budget was draft, finalize it now
      if (budget && budget.id_orcamento === current.id_orcamento && budget.is_draft) {
        const { error: updateError } = await supabase
          .from('orcamentos')
          .update({
            is_draft: false,
            data_envio: now,
          })
          .eq('id_orcamento', current.id_orcamento)
          .eq('id_cliente', user.id);

        if (updateError) throw updateError;

        setBudget((prev) =>
          prev
            ? {
                ...prev,
                is_draft: false,
                data_envio: now,
              }
            : prev
        );
      }

      // Create notifications
      const notificationPromises = [
        supabase.from('notificacoes').insert({
          id_orcamento: current.id_orcamento,
          tipo: 'email_cliente',
          status_envio: 'pendente',
        }),
        supabase.from('notificacoes').insert({
          id_orcamento: current.id_orcamento,
          tipo: 'email_admin',
          status_envio: 'pendente',
        }),
      ];

      await Promise.all(notificationPromises);

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
    saveDraft,
    finalizeBudget,
    saveDetail,
    deleteDetails,
    reload: loadOrCreateBudget
  };
};