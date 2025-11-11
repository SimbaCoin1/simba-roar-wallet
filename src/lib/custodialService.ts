import { supabase } from "@/integrations/supabase/client";

export const custodialService = {
  async getBalance(userId: string): Promise<{ sbc: number; usd: number }> {
    const { data, error } = await supabase
      .from('custodial_balances')
      .select('sbc_balance, usd_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { 
      sbc: data?.sbc_balance ? Number(data.sbc_balance) : 0,
      usd: data?.usd_balance ? Number(data.usd_balance) : 0
    };
  },

  async initializeBalance(userId: string): Promise<void> {
    // Call the secure edge function to initialize balance
    // This ensures balance creation only happens server-side with proper authorization
    const { error } = await supabase.functions.invoke('initialize-balance');

    if (error && !error.message.includes('already initialized')) {
      throw error;
    }
  },

  async creditBalance(
    userId: string, 
    amount: number, 
    currency: 'SBC' | 'USD' = 'SBC',
    type: 'deposit' | 'credit' | 'reward' | 'commission' = 'credit',
    description?: string
  ): Promise<void> {
    // Call the secure edge function to credit balance
    const { data, error } = await supabase.functions.invoke('credit-balance', {
      body: { amount, currency, type, description }
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Failed to credit balance');
  },

  async debitBalance(
    userId: string, 
    amount: number, 
    toAddress: string,
    currency: 'SBC' | 'USD' = 'SBC',
    description?: string
  ): Promise<void> {
    // Call the secure edge function to debit balance
    const { data, error } = await supabase.functions.invoke('debit-balance', {
      body: { amount, toAddress, currency, description }
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Failed to debit balance');
  },

  async getTransactions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('custodial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
