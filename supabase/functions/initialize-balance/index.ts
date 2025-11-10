import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for the insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if balance already exists
    const { data: existing } = await supabaseAdmin
      .from('custodial_balances')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Balance already initialized',
          balance_id: existing.id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize balance with 0 SBC and USD
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('custodial_balances')
      .insert({
        user_id: user.id,
        sbc_balance: 0,
        usd_balance: 0,
      })
      .select()
      .single();

    if (balanceError) {
      // If it's a duplicate key error, that's okay (race condition)
      if (balanceError.code === '23505') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Balance already initialized' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      throw balanceError;
    }

    console.log(`✅ Balance initialized for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        balance_id: balance.id,
        message: 'Balance initialized successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Balance initialization error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
