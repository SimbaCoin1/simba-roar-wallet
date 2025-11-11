import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    // Create client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Verify the request is authenticated (service role or admin user only)
    let isAuthorized = false;
    
    if (authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)) {
      // Service role key provided (e.g., from cron job)
      isAuthorized = true;
    } else if (authHeader) {
      // Check if it's a valid admin user token
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
      );
      
      const { data: { user } } = await supabaseUser.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (user) {
        // Verify the user has admin role
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        
        if (isAdmin) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = supabaseAdmin;

    const today = new Date().toISOString().split('T')[0];
    console.log(`🚀 Processing daily rewards for ${today}`);

    const { data: priceData } = await supabase.rpc('get_current_sbc_price');
    const currentPrice = priceData as number;

    if (!currentPrice || currentPrice <= 0) {
      throw new Error('No active SBC price set. Please update price first.');
    }

    console.log(`💰 Current SBC price: $${currentPrice}`);

    const { data: investments, error: investError } = await supabase
      .from('user_investments')
      .select('*')
      .eq('status', 'active')
      .lte('next_reward_date', today);

    if (investError) throw investError;

    if (!investments || investments.length === 0) {
      console.log('✅ No investments due for rewards today');
      return new Response(
        JSON.stringify({ message: 'No rewards to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Processing ${investments.length} investments`);

    let successCount = 0;
    let failCount = 0;

    for (const investment of investments) {
      try {
        const dailyUSD = investment.investment_amount_usd * investment.daily_yield_percentage;
        const dailySBC = dailyUSD / currentPrice;

        const { error: rewardError } = await supabase
          .from('daily_rewards')
          .insert({
            user_id: investment.user_id,
            investment_id: investment.id,
            reward_date: today,
            investment_usd: investment.investment_amount_usd,
            daily_yield_percentage: investment.daily_yield_percentage,
            sbc_price_usd: currentPrice,
            usd_amount: dailyUSD,
            sbc_amount: dailySBC,
            status: 'processed',
            processed_at: new Date().toISOString(),
          });

        if (rewardError) {
          if (rewardError.code === '23505') {
            console.log(`⚠️ Reward already processed for user ${investment.user_id}`);
            continue;
          }
          throw rewardError;
        }

        const { data: currentBalance } = await supabase
          .from('custodial_balances')
          .select('balance')
          .eq('user_id', investment.user_id)
          .single();

        const newBalance = (currentBalance?.balance || 0) + dailySBC;

        const { error: balanceError } = await supabase
          .from('custodial_balances')
          .upsert({
            user_id: investment.user_id,
            balance: newBalance,
          }, { onConflict: 'user_id' });

        if (balanceError) throw balanceError;

        const { error: txError } = await supabase
          .from('custodial_transactions')
          .insert({
            user_id: investment.user_id,
            type: 'daily_reward',
            amount: dailySBC,
            status: 'confirmed',
          });

        if (txError) throw txError;

        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const nextRewardDate = tomorrow.toISOString().split('T')[0];

        const { error: updateError } = await supabase
          .from('user_investments')
          .update({ next_reward_date: nextRewardDate })
          .eq('id', investment.id);

        if (updateError) throw updateError;

        console.log(`✅ Rewarded user ${investment.user_id}: ${dailySBC.toFixed(2)} SBC ($${dailyUSD.toFixed(2)})`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to process investment ${investment.id}:`, error);
        
        await supabase
          .from('daily_rewards')
          .insert({
            user_id: investment.user_id,
            investment_id: investment.id,
            reward_date: today,
            investment_usd: investment.investment_amount_usd,
            daily_yield_percentage: investment.daily_yield_percentage,
            sbc_price_usd: currentPrice,
            usd_amount: 0,
            sbc_amount: 0,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });

        failCount++;
      }
    }

    const summary = {
      date: today,
      sbc_price: currentPrice,
      total_investments: investments.length,
      successful: successCount,
      failed: failCount,
    };

    console.log('📈 Daily rewards summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Daily rewards processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
