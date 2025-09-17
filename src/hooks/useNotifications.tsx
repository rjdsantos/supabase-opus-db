import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const notifyOrcamentoFinalizado = async (idOrcamento: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-orcamento-finalizado', {
        body: { id_orcamento: idOrcamento }
      });

      if (error) throw error;

      const results = data?.results || {};
      const sentCount = Object.values(results).filter(Boolean).length;
      
      if (sentCount > 0) {
        toast({
          title: "Notificações enviadas",
          description: `${sentCount} notificação(ões) enviada(s) com sucesso.`,
        });
        return true;
      } else {
        toast({
          title: "Notificações não enviadas",
          description: "Todas as notificações já foram enviadas anteriormente.",
          variant: "default",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao enviar notificações:', error);
      toast({
        title: "Erro ao enviar notificações",
        description: error.message || "Falha ao processar notificações.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const notifyPreOrcamento = async (idOrcamento: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-pre-orcamento', {
        body: { id_orcamento: idOrcamento }
      });

      if (error) throw error;

      const results = data?.results || {};
      const sentCount = Object.values(results).filter(Boolean).length;
      
      if (sentCount > 0) {
        toast({
          title: "Pré-orçamento solicitado",
          description: "Notificações enviadas com sucesso!",
        });
        return true;
      } else {
        toast({
          title: "Solicitação já enviada",
          description: "Esta preferência já foi comunicada anteriormente.",
          variant: "default",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao enviar notificação de pré-orçamento:', error);
      toast({
        title: "Erro ao solicitar pré-orçamento",
        description: error.message || "Falha ao processar solicitação.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const notifyAgendamento = async (idOrcamento: string, datetime: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-agendamento', {
        body: { id_orcamento: idOrcamento, datetime }
      });

      if (error) throw error;

      const results = data?.results || {};
      const sentCount = Object.values(results).filter(Boolean).length;
      
      if (sentCount > 0) {
        toast({
          title: "Reunião solicitada",
          description: "Notificações de agendamento enviadas com sucesso!",
        });
        return true;
      } else {
        toast({
          title: "Solicitação já enviada",
          description: "Este agendamento já foi comunicado anteriormente.",
          variant: "default",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao enviar notificação de agendamento:', error);
      toast({
        title: "Erro ao solicitar reunião",
        description: error.message || "Falha ao processar agendamento.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const notifyConviteAvaliacao = async (idOrcamento: string, sendWhatsapp: boolean = false): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-convite-avaliacao', {
        body: { id_orcamento: idOrcamento, send_whatsapp: sendWhatsapp }
      });

      if (error) throw error;

      const results = data?.results || {};
      const sentCount = Object.values(results).filter(Boolean).length;
      
      if (sentCount > 0) {
        toast({
          title: "Convite de avaliação enviado",
          description: "Cliente receberá o convite para avaliar o serviço.",
        });
        return true;
      } else {
        toast({
          title: "Convite já enviado",
          description: "O convite de avaliação já foi enviado anteriormente.",
          variant: "default",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao enviar convite de avaliação:', error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Falha ao processar convite de avaliação.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    notifyOrcamentoFinalizado,
    notifyPreOrcamento,
    notifyAgendamento,
    notifyConviteAvaliacao
  };
};