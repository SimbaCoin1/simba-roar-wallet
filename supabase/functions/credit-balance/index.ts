import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const creditBalanceSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite'),
  currency: z.enum(['SBC', 'USD']).default('SBC'),
  type: z.enum(['deposit', 'credit', 'reward', 'commission']).default('credit'),
  description: z.string().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authenticated user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const requestBody = await req.json();
    const validationResult = creditBalanceSchema.safeParse(requestBody);
    
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

    const { amount, currency, type, description } = validationResult.data;

    // Use service role for balance operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get current balance
    const { data: currentBalance } = await supabaseAdmin
      .from('custodial_balances')
      .select('sbc_balance, usd_balance')
      .eq('user_id', user.id)
      .single();

    if (!currentBalance) {
      return new Response(JSON.stringify({ error: 'Balance not initialized' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate new balance
    const newSbcBalance = currency === 'SBC' 
      ? currentBalance.sbc_balance + amount 
      : currentBalance.sbc_balance;
    const newUsdBalance = currency === 'USD' 
      ? (currentBalance.usd_balance || 0) + amount 
      : (currentBalance.usd_balance || 0);

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('custodial_balances')
      .update({ 
        sbc_balance: newSbcBalance, 
        usd_balance: newUsdBalance 
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabaseAdmin
      .from('custodial_transactions')
      .insert({
        user_id: user.id,
        type,
        amount,
        currency,
        description,
        status: 'confirmed',
      });

    if (txError) throw txError;

    console.log(`✅ Credited ${amount} ${currency} to user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        new_balance: { 
          sbc: newSbcBalance, 
          usd: newUsdBalance 
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Credit balance error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
