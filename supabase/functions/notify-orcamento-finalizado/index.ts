import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const emailSender = Deno.env.get('EMAIL_SENDER')!;
const adminEmail = Deno.env.get('ADMIN_EMAIL')!;
const waPhoneNumberId = Deno.env.get('WA_PHONE_NUMBER_ID')!;
const waAccessToken = Deno.env.get('WA_ACCESS_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface NotificationData {
  id_orcamento: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  categoria: string;
  data_envio: string;
  detalhes: Array<{ chave: string; valor: string }>;
}

async function checkIfAlreadySent(idOrcamento: string, tipo: string): Promise<boolean> {
  const { data } = await supabase
    .from('notificacoes')
    .select('id_notificacao')
    .eq('id_orcamento', idOrcamento)
    .eq('tipo', tipo)
    .eq('status_envio', 'enviado')
    .single();
  
  return !!data;
}

async function logNotification(idOrcamento: string, tipo: string, statusEnvio: string = 'enviado', errorMessage?: string) {
  await supabase
    .from('notificacoes')
    .insert({
      id_orcamento: idOrcamento,
      tipo,
      status_envio: statusEnvio,
      erro_mensagem: errorMessage || null,
      data_envio: new Date().toISOString()
    });
}

async function getOrcamentoData(idOrcamento: string): Promise<NotificationData | null> {
  const { data: orcamento } = await supabase
    .from('orcamentos')
    .select(`
      id_orcamento,
      categoria,
      data_envio,
      profiles!fk_orcamentos_cliente(full_name, email, phone)
    `)
    .eq('id_orcamento', idOrcamento)
    .single();

  if (!orcamento) return null;

  const { data: detalhes } = await supabase
    .from('orcamento_detalhes')
    .select('chave, valor')
    .eq('id_orcamento', idOrcamento);

  return {
    id_orcamento: orcamento.id_orcamento,
    cliente_nome: orcamento.profiles?.full_name || 'Cliente',
    cliente_email: orcamento.profiles?.email || '',
    cliente_telefone: orcamento.profiles?.phone || '',
    categoria: orcamento.categoria,
    data_envio: orcamento.data_envio,
    detalhes: detalhes || []
  };
}

function generateClientEmailContent(data: NotificationData): string {
  const detalhesRelevantes = data.detalhes
    .filter(d => ['data_evento', 'tema', 'local', 'observacoes', 'tipo_presente'].includes(d.chave))
    .slice(0, 10);

  const detalhesHtml = detalhesRelevantes
    .map(d => `<li><strong>${d.chave.replace('_', ' ').toUpperCase()}:</strong> ${d.valor}</li>`)
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          ul { list-style: none; padding: 0; }
          li { margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirmação do seu Orçamento</h1>
            <p>Orçamento #${data.id_orcamento}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${data.cliente_nome}</strong>!</p>
            <p>Recebemos seu pedido de orçamento para <strong>${data.categoria}</strong> e estamos analisando todos os detalhes.</p>
            <div class="details">
              <h3>Resumo do seu pedido:</h3>
              <ul>${detalhesHtml}</ul>
            </div>
            <p>Em breve entraremos em contato com você!</p>
            <p>Atenciosamente,<br><strong>Equipe JaqueeNatal</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAdminEmailContent(data: NotificationData): string {
  const detalhesHtml = data.detalhes
    .map(d => `<li><strong>${d.chave}:</strong> ${d.valor}</li>`)
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .client-info, .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          ul { list-style: none; padding: 0; }
          li { margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px; }
          .cta { text-align: center; margin: 20px 0; }
          .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Novo Orçamento Recebido</h1>
            <p>Orçamento #${data.id_orcamento}</p>
          </div>
          <div class="content">
            <div class="client-info">
              <h3>📋 Dados do Cliente:</h3>
              <ul>
                <li><strong>Nome:</strong> ${data.cliente_nome}</li>
                <li><strong>Email:</strong> ${data.cliente_email}</li>
                <li><strong>Telefone:</strong> ${data.cliente_telefone}</li>
                <li><strong>Categoria:</strong> ${data.categoria}</li>
                <li><strong>Data do Pedido:</strong> ${new Date(data.data_envio).toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>
            <div class="details">
              <h3>📝 Detalhes do Orçamento:</h3>
              <ul>${detalhesHtml}</ul>
            </div>
            <div class="cta">
              <a href="${supabaseUrl.replace('https://', 'https://app.')}/admin/orcamentos/${data.id_orcamento}" class="btn">
                🔗 Ver no Painel Admin
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendWhatsAppToAdmin(data: NotificationData): Promise<void> {
  const message = `🔔 Novo orçamento recebido de ${data.cliente_nome} (#${data.id_orcamento}) - ${data.categoria}.`;
  
  const response = await fetch(`https://graph.facebook.com/v17.0/${waPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: Deno.env.get('JAQ_WHATSAPP_NUMBER'),
      type: 'text',
      text: { body: message }
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id_orcamento } = await req.json();

    if (!id_orcamento) {
      return new Response(
        JSON.stringify({ error: 'id_orcamento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[notify-orcamento-finalizado] Processando orçamento: ${id_orcamento}`);

    // Buscar dados do orçamento
    const data = await getOrcamentoData(id_orcamento);
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      email_cliente: false,
      email_admin: false,
      whatsapp_admin: false
    };

    // 1. Email para o Cliente
    if (!await checkIfAlreadySent(id_orcamento, 'email_cliente')) {
      try {
        console.log('🔄 Enviando email para cliente:', data.cliente_email);
        const emailResponse = await resend.emails.send({
          from: emailSender,
          to: [data.cliente_email],
          subject: `Confirmação do seu orçamento #${id_orcamento}`,
          html: generateClientEmailContent(data),
        });
        
        console.log('📧 Resposta do Resend para cliente:', emailResponse);
        
        if (emailResponse.error) {
          throw new Error(`Resend API Error: ${JSON.stringify(emailResponse.error)}`);
        }
        
        await logNotification(id_orcamento, 'email_cliente');
        results.email_cliente = true;
        console.log('✅ Email cliente enviado com sucesso - ID:', emailResponse.data?.id);
      } catch (error) {
        console.error('❌ Erro detalhado ao enviar email cliente:', error);
        console.error('❌ Stack trace:', error.stack);
        await logNotification(id_orcamento, 'email_cliente', 'falhou', error.message);
      }
    } else {
      console.log('ℹ️ Email cliente já enviado anteriormente');
    }

    // 2. Email para o Admin  
    if (!await checkIfAlreadySent(id_orcamento, 'email_admin')) {
      try {
        console.log('🔄 Enviando email para admin:', adminEmail);
        const emailResponse = await resend.emails.send({
          from: emailSender,
          to: [adminEmail],
          subject: `Novo orçamento de ${data.cliente_nome} (#${id_orcamento})`,
          html: generateAdminEmailContent(data),
        });
        
        console.log('📧 Resposta do Resend para admin:', emailResponse);
        
        if (emailResponse.error) {
          throw new Error(`Resend API Error: ${JSON.stringify(emailResponse.error)}`);
        }
        
        await logNotification(id_orcamento, 'email_admin');
        results.email_admin = true;
        console.log('✅ Email admin enviado com sucesso - ID:', emailResponse.data?.id);
      } catch (error) {
        console.error('❌ Erro detalhado ao enviar email admin:', error);
        console.error('❌ Stack trace:', error.stack);
        await logNotification(id_orcamento, 'email_admin', 'falhou', error.message);
      }
    } else {
      console.log('ℹ️ Email admin já enviado anteriormente');
    }

    // 3. WhatsApp para o Admin
    if (!await checkIfAlreadySent(id_orcamento, 'whatsapp_admin')) {
      try {
        await sendWhatsAppToAdmin(data);
        await logNotification(id_orcamento, 'whatsapp_admin');
        results.whatsapp_admin = true;
        console.log('✅ WhatsApp admin enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp admin:', error);
        await logNotification(id_orcamento, 'whatsapp_admin', 'falhou', error.message);
      }
    } else {
      console.log('ℹ️ WhatsApp admin já enviado anteriormente');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Notificações processadas com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});