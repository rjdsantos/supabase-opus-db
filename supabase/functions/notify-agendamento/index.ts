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

async function logNotification(idOrcamento: string, tipo: string, statusEnvio: string = 'enviado') {
  await supabase
    .from('notificacoes')
    .insert({
      id_orcamento: idOrcamento,
      tipo,
      status_envio: statusEnvio,
      data_envio: new Date().toISOString()
    });
}

async function getOrcamentoData(idOrcamento: string) {
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

  return orcamento;
}

function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateClientEmailContent(orcamento: any, dateTime: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .meeting-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #007bff; }
          .highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Reunião Solicitada</h1>
            <p>Orçamento #${orcamento.id_orcamento}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${orcamento.profiles?.full_name || 'Cliente'}</strong>!</p>
            <div class="highlight">
              <h3>✅ Sua solicitação de reunião foi recebida!</h3>
            </div>
            <div class="meeting-details">
              <h3>📋 Detalhes da Reunião:</h3>
              <ul>
                <li><strong>📅 Data e Horário:</strong> ${formatDateTime(dateTime)}</li>
                <li><strong>📦 Assunto:</strong> Orçamento ${orcamento.categoria}</li>
                <li><strong>📍 Local:</strong> A confirmar</li>
              </ul>
            </div>
            <p>Entraremos em contato em breve para confirmar a reunião e definir os demais detalhes.</p>
            <p><strong>Próximos passos:</strong></p>
            <ul>
              <li>Aguarde nossa confirmação</li>
              <li>Prepare suas dúvidas e preferências</li>
              <li>Tenha em mãos informações adicionais sobre o evento</li>
            </ul>
            <p>Atenciosamente,<br><strong>Equipe JaqueeNatal</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAdminEmailContent(orcamento: any, dateTime: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .client-info, .meeting-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .cta { text-align: center; margin: 20px 0; }
          .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Agendamento Solicitado</h1>
            <p>Orçamento #${orcamento.id_orcamento}</p>
          </div>
          <div class="content">
            <div class="urgent">
              <h3>⏰ AÇÃO NECESSÁRIA: Confirmar reunião</h3>
            </div>
            <div class="client-info">
              <h3>👤 Dados do Cliente:</h3>
              <ul>
                <li><strong>Nome:</strong> ${orcamento.profiles?.full_name || 'Cliente'}</li>
                <li><strong>Email:</strong> ${orcamento.profiles?.email || 'N/A'}</li>
                <li><strong>Telefone:</strong> ${orcamento.profiles?.phone || 'N/A'}</li>
                <li><strong>Categoria:</strong> ${orcamento.categoria}</li>
              </ul>
            </div>
            <div class="meeting-details">
              <h3>📅 Detalhes da Reunião Solicitada:</h3>
              <ul>
                <li><strong>Data e Horário:</strong> ${formatDateTime(dateTime)}</li>
                <li><strong>Tipo:</strong> Reunião para discutir orçamento</li>
                <li><strong>Status:</strong> Pendente confirmação</li>
              </ul>
            </div>
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Verificar disponibilidade na agenda</li>
              <li>Confirmar ou propor nova data</li>
              <li>Entrar em contato com o cliente</li>
            </ol>
            <div class="cta">
              <a href="${supabaseUrl.replace('https://', 'https://app.')}/admin/orcamentos/${orcamento.id_orcamento}" class="btn">
                🔗 Ver no Painel Admin
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendWhatsAppToAdmin(orcamento: any, dateTime: string): Promise<void> {
  const formattedDate = formatDateTime(dateTime);
  const message = `📅 Reunião solicitada p/ orçamento #${orcamento.id_orcamento} em ${formattedDate}.`;
  
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
    const { id_orcamento, datetime } = await req.json();

    if (!id_orcamento || !datetime) {
      return new Response(
        JSON.stringify({ error: 'id_orcamento e datetime são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[notify-agendamento] Processando agendamento: ${id_orcamento} para ${datetime}`);

    // Buscar dados do orçamento
    const orcamento = await getOrcamentoData(id_orcamento);
    if (!orcamento) {
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
    if (!await checkIfAlreadySent(id_orcamento, 'email_cliente_agendamento')) {
      try {
        await resend.emails.send({
          from: emailSender,
          to: [orcamento.profiles?.email],
          subject: `Sua reunião foi solicitada - Orçamento #${id_orcamento}`,
          html: generateClientEmailContent(orcamento, datetime),
        });
        
        await logNotification(id_orcamento, 'email_cliente_agendamento');
        results.email_cliente = true;
        console.log('✅ Email cliente enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar email cliente:', error);
        await logNotification(id_orcamento, 'email_cliente_agendamento', 'falhou');
      }
    }

    // 2. Email para o Admin
    if (!await checkIfAlreadySent(id_orcamento, 'email_admin_agendamento')) {
      try {
        await resend.emails.send({
          from: emailSender,
          to: [adminEmail],
          subject: `Agendamento solicitado - Orçamento #${id_orcamento}`,
          html: generateAdminEmailContent(orcamento, datetime),
        });
        
        await logNotification(id_orcamento, 'email_admin_agendamento');
        results.email_admin = true;
        console.log('✅ Email admin enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar email admin:', error);
        await logNotification(id_orcamento, 'email_admin_agendamento', 'falhou');
      }
    }

    // 3. WhatsApp para o Admin (opcional)
    if (!await checkIfAlreadySent(id_orcamento, 'whatsapp_admin_agendamento')) {
      try {
        await sendWhatsAppToAdmin(orcamento, datetime);
        await logNotification(id_orcamento, 'whatsapp_admin_agendamento');
        results.whatsapp_admin = true;
        console.log('✅ WhatsApp admin enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp admin:', error);
        await logNotification(id_orcamento, 'whatsapp_admin_agendamento', 'falhou');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Notificações de agendamento processadas com sucesso'
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