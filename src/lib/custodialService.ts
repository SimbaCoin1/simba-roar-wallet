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
    const { error } = await supabase
      .from('custodial_balances')
      .insert({ user_id: userId, sbc_balance: 0, usd_balance: 0 });

    if (error && !error.message.includes('duplicate key')) {
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
    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('custodial_balances')
      .select('sbc_balance, usd_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balanceColumn = currency === 'SBC' ? 'sbc_balance' : 'usd_balance';
    const currentBalance = balanceData?.[balanceColumn] ? Number(balanceData[balanceColumn]) : 0;
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('custodial_balances')
      .update({ [balanceColumn]: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabase
      .from('custodial_transactions')
      .insert({
        user_id: userId,
        amount,
        currency,
        type,
        description,
        status: 'confirmed'
      });

    if (txError) throw txError;
  },

  async debitBalance(
    userId: string, 
    amount: number, 
    toAddress: string,
    currency: 'SBC' | 'USD' = 'SBC',
    description?: string
  ): Promise<void> {
    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('custodial_balances')
      .select('sbc_balance, usd_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balanceColumn = currency === 'SBC' ? 'sbc_balance' : 'usd_balance';
    const currentBalance = balanceData?.[balanceColumn] ? Number(balanceData[balanceColumn]) : 0;
    
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('custodial_balances')
      .update({ [balanceColumn]: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record withdrawal transaction
    const { error: txError } = await supabase
      .from('custodial_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        currency,
        type: 'withdrawal',
        description: description || `Withdrawal to ${toAddress}`,
        status: 'pending'
      });

    if (txError) throw txError;
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
