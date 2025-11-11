import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

interface UpdatePricePayload {
  price_usd: number;
  notes?: string;
}

const updatePriceSchema = z.object({
  price_usd: z.number()
    .positive('Price must be positive')
    .min(0.0001, 'Price too low - minimum $0.0001')
    .max(1000, 'Price unreasonably high - maximum $1000')
    .finite('Price must be a finite number'),
  notes: z.string()
    .max(500, 'Notes too long - maximum 500 characters')
    .optional()
});

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

    const requestBody = await req.json();
    
    // Validate input with zod schema
    const validationResult = updatePriceSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { price_usd, notes } = validationResult.data;

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
