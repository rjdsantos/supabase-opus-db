import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Orcamento {
  id_orcamento: string;
  categoria: 'decoracao' | 'lembrancinhas' | 'presentes';
  status: 'novo' | 'respondido' | 'concluido';
  data_envio: string;
  cliente_nome: string;
}

export const useOrcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrcamentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id_orcamento,
          categoria,  
          status,
          data_envio,
          id_cliente,
          profiles:id_cliente(full_name, email, phone)
        `)
        .eq('is_draft', false)
        .order('data_envio', { ascending: false });

      if (error) throw error;

      const mappedData: Orcamento[] = data.map((item: any) => ({
        id_orcamento: item.id_orcamento,
        categoria: item.categoria,
        status: item.status,
        data_envio: item.data_envio,
        cliente_nome: item.profiles?.full_name || 'Nome não informado',
      }));

      setOrcamentos(mappedData);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching orçamentos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id_orcamento: string, newStatus: 'novo' | 'respondido' | 'concluido') => {
    try {
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({ status: newStatus })
        .eq('id_orcamento', id_orcamento);

      if (updateError) throw updateError;

      // Log status change
      const { error: logError } = await supabase
        .from('admin_status')
        .insert({
          id_orcamento,
          status: newStatus,
          admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (logError) throw logError;

      // Se status mudou para concluído, disparar notificação de avaliação
      if (newStatus === 'concluido') {
        try {
          await supabase.functions.invoke('notify-convite-avaliacao', {
            body: { id_orcamento, send_whatsapp: false }
          });
          console.log('Convite de avaliação enviado para:', id_orcamento);
        } catch (notificationError) {
          console.error('Erro ao enviar convite de avaliação:', notificationError);
        }
      }

      // Update local state
      setOrcamentos(prev => 
        prev.map(orc => 
          orc.id_orcamento === id_orcamento 
            ? { ...orc, status: newStatus }
            : orc
        )
      );

      const statusMessage = newStatus === 'concluido' 
        ? "Status atualizado e convite de avaliação enviado ao cliente."
        : "Status do orçamento alterado com sucesso.";

      toast({
        title: "Status atualizado",
        description: statusMessage,
      });

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Falha ao alterar o status do orçamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrcamentos();

    // Real-time subscriptions
    const channel = supabase
      .channel('orcamentos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orcamentos'
        },
        () => {
          fetchOrcamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrcamentos]);

  return {
    orcamentos,
    loading,
    error,
    fetchOrcamentos,
    updateStatus
  };
};