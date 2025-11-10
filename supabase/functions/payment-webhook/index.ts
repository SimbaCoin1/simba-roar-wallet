import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface PaymentWebhookPayload {
  email: string;
  tier_id: number;
  payment_amount_usd: number;
  transaction_id: string;
  timestamp: number;
}

// Helper to verify HMAC signature
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(payload)
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get signature from header
    const signature = req.headers.get('X-Webhook-Signature');
    if (!signature) {
      console.error('❌ Missing signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const payload: PaymentWebhookPayload = JSON.parse(rawBody);

    // Verify HMAC signature
    const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET')!;
    const isValid = await verifySignature(rawBody, signature, secret);
    
    if (!isValid) {
      console.error('❌ Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate timestamp (reject requests older than 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = payload.timestamp || now;
    const timeDiff = Math.abs(now - requestTime);
    
    if (timeDiff > 300) {
      console.error('❌ Request timestamp too old', { timeDiff });
      return new Response(JSON.stringify({ error: 'Request expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate payload structure
    const { email, tier_id, payment_amount_usd, transaction_id } = payload;
    
    if (!email || !tier_id || !payment_amount_usd || !transaction_id) {
      throw new Error('Missing required fields');
    }

    if (typeof tier_id !== 'number' || tier_id <= 0) {
      throw new Error('Invalid tier_id');
    }

    if (typeof payment_amount_usd !== 'number' || payment_amount_usd <= 0) {
      throw new Error('Invalid payment_amount_usd');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate transaction_id to prevent replay attacks
    const { data: existingInvestment } = await supabase
      .from('user_investments')
      .select('id')
      .eq('payment_transaction_id', transaction_id)
      .maybeSingle();

    if (existingInvestment) {
      console.warn('⚠️ Duplicate transaction detected', { transaction_id });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Transaction already processed',
          investment_id: existingInvestment.id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
      first_reward: nextRewardDate,
      transaction_id
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
