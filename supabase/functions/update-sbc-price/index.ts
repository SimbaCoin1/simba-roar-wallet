import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdatePricePayload {
  price_usd: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { price_usd, notes }: UpdatePricePayload = await req.json();

    if (!price_usd || price_usd <= 0) {
      throw new Error('Invalid price_usd. Must be greater than 0.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('sbc_price_history')
      .update({ is_active: false })
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('sbc_price_history')
      .insert({
        price_usd,
        source: 'manual',
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ SBC price updated to $${price_usd}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        price: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Price update error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
