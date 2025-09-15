import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { budgetId, campo, context } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify budget ownership
    const { data: budget, error: budgetError } = await supabase
      .from('orcamentos')
      .select('id_orcamento, categoria')
      .eq('id_orcamento', budgetId)
      .single();

    if (budgetError || !budget) {
      throw new Error('Budget not found');
    }

    // Create context-aware prompt
    let prompt = '';
    
    if (campo === 'descricao_evento' && context.categoria === 'decoracao') {
      prompt = `Você é uma especialista em decoração de eventos e precisa ajudar um cliente a descrever melhor seu evento de ${context.tipo_evento}.

Contexto do evento:
- Tipo: ${context.tipo_evento}
- Número de convidados: ${context.n_convidados || 'não informado'}
- Data: ${context.data_evento || 'não informada'}

Gere 3 sugestões criativas e detalhadas de como o cliente pode descrever seu evento, incluindo:
- Atmosfera desejada
- Paleta de cores
- Estilo de decoração
- Elementos especiais
- Sensações que quer transmitir

Cada sugestão deve ter entre 50-100 palavras e ser inspiradora mas prática.`;
    } else {
      prompt = `Ajude o cliente a preencher o campo "${campo}" do seu orçamento de ${context.categoria}. Gere 3 sugestões úteis e criativas baseadas no contexto fornecido.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é uma consultora especialista em eventos e decoração. Forneça sugestões práticas, criativas e profissionais em português brasileiro.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the response to extract individual suggestions
    const suggestions = aiResponse
      .split('\n')
      .filter((line: string) => line.trim().length > 30)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    console.log('Generated suggestions:', suggestions);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-suggestions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});