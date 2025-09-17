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

async function savePreferencia(idOrcamento: string) {
  await supabase
    .from('orcamento_detalhes')
    .upsert({
      id_orcamento: idOrcamento,
      chave: 'pos_envio_preferencia',
      valor: 'pre_orcamento'
    }, {
      onConflict: 'id_orcamento,chave'
    });
}

function generateAdminEmailContent(orcamento: any): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .highlight { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💡 Pré-orçamento Solicitado</h1>
            <p>Orçamento #${orcamento.id_orcamento}</p>
          </div>
          <div class="content">
            <div class="highlight">
              <h3>⚡ Cliente optou por PRÉ-ORÇAMENTO INICIAL</h3>
            </div>
            <div class="info">
              <h3>📋 Dados do Cliente:</h3>
              <ul>
                <li><strong>Nome:</strong> ${orcamento.profiles?.full_name || 'Cliente'}</li>
                <li><strong>Email:</strong> ${orcamento.profiles?.email || 'N/A'}</li>
                <li><strong>Telefone:</strong> ${orcamento.profiles?.phone || 'N/A'}</li>
                <li><strong>Categoria:</strong> ${orcamento.categoria}</li>
                <li><strong>Data do Pedido:</strong> ${new Date(orcamento.data_envio).toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>
            <p><strong>Ação necessária:</strong> Prepare um pré-orçamento inicial para enviar ao cliente.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateClientEmailContent(orcamento: any): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pré-orçamento Solicitado</h1>
            <p>Orçamento #${orcamento.id_orcamento}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${orcamento.profiles?.full_name || 'Cliente'}</strong>!</p>
            <div class="highlight">
              <h3>🎯 Sua solicitação foi recebida!</h3>
              <p>Você optou por receber um <strong>pré-orçamento inicial</strong> para ${orcamento.categoria}.</p>
            </div>
            <p>Estamos preparando uma estimativa inicial baseada nas informações fornecidas e enviaremos em breve.</p>
            <p>Atenciosamente,<br><strong>Equipe JaqueeNatal</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendWhatsAppToAdmin(orcamento: any): Promise<void> {
  const message = `💡 Cliente ${orcamento.profiles?.full_name || 'Sem nome'} optou por PRÉ-ORÇAMENTO (#${orcamento.id_orcamento}).`;
  
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

    console.log(`[notify-pre-orcamento] Processando orçamento: ${id_orcamento}`);

    // Buscar dados do orçamento
    const orcamento = await getOrcamentoData(id_orcamento);
    if (!orcamento) {
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar preferência
    await savePreferencia(id_orcamento);

    const results = {
      email_cliente: false,
      email_admin: false,
      whatsapp_admin: false
    };

    // 1. Email para o Admin
    if (!await checkIfAlreadySent(id_orcamento, 'email_admin_pre_orcamento')) {
      try {
        await resend.emails.send({
          from: emailSender,
          to: [adminEmail],
          subject: `Pré-orçamento solicitado - ${orcamento.profiles?.full_name || 'Cliente'} (#${id_orcamento})`,
          html: generateAdminEmailContent(orcamento),
        });
        
        await logNotification(id_orcamento, 'email_admin_pre_orcamento');
        results.email_admin = true;
        console.log('✅ Email admin enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar email admin:', error);
        await logNotification(id_orcamento, 'email_admin_pre_orcamento', 'falhou');
      }
    }

    // 2. Email de confirmação para o Cliente
    if (!await checkIfAlreadySent(id_orcamento, 'email_cliente_pre_orcamento')) {
      try {
        await resend.emails.send({
          from: emailSender,
          to: [orcamento.profiles?.email],
          subject: `Pré-orçamento solicitado - Orçamento #${id_orcamento}`,
          html: generateClientEmailContent(orcamento),
        });
        
        await logNotification(id_orcamento, 'email_cliente_pre_orcamento');
        results.email_cliente = true;
        console.log('✅ Email cliente enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar email cliente:', error);
        await logNotification(id_orcamento, 'email_cliente_pre_orcamento', 'falhou');
      }
    }

    // 3. WhatsApp para o Admin
    if (!await checkIfAlreadySent(id_orcamento, 'whatsapp_admin_pre_orcamento')) {
      try {
        await sendWhatsAppToAdmin(orcamento);
        await logNotification(id_orcamento, 'whatsapp_admin_pre_orcamento');
        results.whatsapp_admin = true;
        console.log('✅ WhatsApp admin enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp admin:', error);
        await logNotification(id_orcamento, 'whatsapp_admin_pre_orcamento', 'falhou');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Notificações de pré-orçamento processadas com sucesso'
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