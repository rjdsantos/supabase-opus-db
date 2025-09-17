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
      profiles!fk_orcamentos_cliente(full_name, email, phone, whatsapp_opt_in)
    `)
    .eq('id_orcamento', idOrcamento)
    .single();

  return orcamento;
}

function generateEmailContent(orcamento: any): string {
  const avaliacaoUrl = `${supabaseUrl.replace('https://', 'https://app.')}/avaliacao?orcamento=${orcamento.id_orcamento}`;
  
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .cta-section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .btn { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; }
          .btn:hover { background: #218838; }
          .stars { font-size: 24px; margin: 10px 0; }
          .highlight { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ Como foi seu serviço?</h1>
            <p>Avalie a JaqueeNatal</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${orcamento.profiles?.full_name || 'Cliente'}</strong>!</p>
            <div class="highlight">
              <h3>🎉 Seu projeto foi concluído!</h3>
              <p>Esperamos que você tenha ficado satisfeito(a) com nosso serviço de <strong>${orcamento.categoria}</strong>.</p>
            </div>
            <p>Sua opinião é muito importante para nós! Gostaria de avaliar nosso trabalho?</p>
            <div class="cta-section">
              <div class="stars">⭐⭐⭐⭐⭐</div>
              <h3>Avalie nossa prestação de serviço</h3>
              <p>Sua avaliação nos ajuda a melhorar continuamente e ajuda outros clientes a nos conhecer melhor.</p>
              <a href="${avaliacaoUrl}" class="btn">
                ✍️ AVALIAR AGORA
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: #666;">
                <em>Leva apenas 2 minutos!</em>
              </p>
            </div>
            <p><strong>O que você pode avaliar:</strong></p>
            <ul>
              <li>Qualidade do atendimento</li>
              <li>Pontualidade e organização</li>
              <li>Criatividade e resultado final</li>
              <li>Custo-benefício</li>
              <li>Recomendaria nossos serviços?</li>
            </ul>
            <p>Muito obrigada pela confiança!</p>
            <p>Com carinho,<br><strong>Jaqueline - JaqueeNatal</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendWhatsAppToClient(orcamento: any): Promise<void> {
  const avaliacaoUrl = `${supabaseUrl.replace('https://', 'https://app.')}/avaliacao?orcamento=${orcamento.id_orcamento}`;
  const message = `Olá ${orcamento.profiles?.full_name || 'Cliente'}, tudo bem? Poderia avaliar nosso serviço? ${avaliacaoUrl}`;
  
  const response = await fetch(`https://graph.facebook.com/v17.0/${waPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: orcamento.profiles?.phone?.replace(/\D/g, ''), // Remove formatting
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
    const { id_orcamento, send_whatsapp = false } = await req.json();

    if (!id_orcamento) {
      return new Response(
        JSON.stringify({ error: 'id_orcamento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[notify-convite-avaliacao] Processando convite para orçamento: ${id_orcamento}`);

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
      whatsapp_cliente: false
    };

    // 1. Email para o Cliente (obrigatório)
    if (!await checkIfAlreadySent(id_orcamento, 'email_cliente_avaliacao')) {
      try {
        await resend.emails.send({
          from: emailSender,
          to: [orcamento.profiles?.email],
          subject: `Como foi seu serviço? Avalie a JaqueeNatal`,
          html: generateEmailContent(orcamento),
        });
        
        await logNotification(id_orcamento, 'email_cliente_avaliacao');
        results.email_cliente = true;
        console.log('✅ Email cliente enviado');
      } catch (error) {
        console.error('❌ Erro ao enviar email cliente:', error);
        await logNotification(id_orcamento, 'email_cliente_avaliacao', 'falhou');
      }
    } else {
      console.log('ℹ️ Email de avaliação já enviado anteriormente');
    }

    // 2. WhatsApp para o Cliente (opcional, se solicitado e se cliente tem opt-in)
    if (send_whatsapp && orcamento.profiles?.whatsapp_opt_in && orcamento.profiles?.phone) {
      if (!await checkIfAlreadySent(id_orcamento, 'whatsapp_cliente_avaliacao')) {
        try {
          await sendWhatsAppToClient(orcamento);
          await logNotification(id_orcamento, 'whatsapp_cliente_avaliacao');
          results.whatsapp_cliente = true;
          console.log('✅ WhatsApp cliente enviado');
        } catch (error) {
          console.error('❌ Erro ao enviar WhatsApp cliente:', error);
          await logNotification(id_orcamento, 'whatsapp_cliente_avaliacao', 'falhou');
        }
      } else {
        console.log('ℹ️ WhatsApp de avaliação já enviado anteriormente');
      }
    } else if (send_whatsapp) {
      console.log('ℹ️ WhatsApp não enviado: cliente não tem opt-in ou telefone não informado');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Convite de avaliação processado com sucesso'
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