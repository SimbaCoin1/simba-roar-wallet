import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface PaymentWebhookPayload {
  email: string;
  tier_id: number;
  payment_amount_usd: number;
  transaction_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('X-Webhook-Secret');
    if (apiKey !== Deno.env.get('PAYMENT_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: PaymentWebhookPayload = await req.json();
    const { email, tier_id, payment_amount_usd, transaction_id } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    const { data: tier, error: tierError } = await supabase
      .from('investment_tiers')
      .select('*')
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      throw new Error(`Invalid tier_id: ${tier_id}`);
    }

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const nextRewardDate = tomorrow.toISOString().split('T')[0];

    const { data: investment, error: investmentError } = await supabase
      .from('user_investments')
      .upsert({
        user_id: user.id,
        tier_id: tier.id,
        investment_amount_usd: payment_amount_usd,
        seats: tier.seats,
        next_reward_date: nextRewardDate,
        status: 'active',
        payment_transaction_id: transaction_id,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (investmentError) throw investmentError;

    console.log(`✅ Investment created for ${email}:`, {
      tier: tier.name,
      amount: payment_amount_usd,
      seats: tier.seats,
      first_reward: nextRewardDate
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        investment_id: investment.id,
        first_reward_date: nextRewardDate 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Payment webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
