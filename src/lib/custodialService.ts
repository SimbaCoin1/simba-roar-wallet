import { supabase } from "@/integrations/supabase/client";

export const custodialService = {
  async getBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('custodial_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.balance || 0;
  },

  async initializeBalance(userId: string): Promise<void> {
    const { error } = await supabase
      .from('custodial_balances')
      .insert({ user_id: userId, balance: 0 });

    if (error && !error.message.includes('duplicate key')) {
      throw error;
    }
  },

  async creditBalance(userId: string, amount: number, type: 'deposit' | 'credit' = 'credit'): Promise<void> {
    // Get current balance
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('custodial_balances')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabase
      .from('custodial_transactions')
      .insert({
        user_id: userId,
        type,
        amount,
        status: 'confirmed',
      });

    if (txError) throw txError;
  },

  async debitBalance(userId: string, amount: number, toAddress: string): Promise<void> {
    // Get current balance
    const currentBalance = await this.getBalance(userId);
    
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('custodial_balances')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record transaction (blockchain_hash can be added later when withdrawal is processed)
    const { error: txError } = await supabase
      .from('custodial_transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        status: 'pending',
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
