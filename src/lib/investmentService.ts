import { supabase } from "@/integrations/supabase/client";

export interface Investment {
  id: string;
  user_id: string;
  tier_id: number;
  investment_amount_usd: number;
  seats: number;
  daily_yield_percentage: number;
  purchase_date: string;
  next_reward_date: string;
  status: 'active' | 'paused' | 'cancelled';
  tier?: {
    name: string;
    hashpower: string;
  };
}

export interface DailyReward {
  id: string;
  reward_date: string;
  sbc_price_usd: number;
  usd_amount: number;
  sbc_amount: number;
  status: 'pending' | 'processed' | 'failed';
  processed_at: string | null;
}

export const investmentService = {
  async getActiveInvestment(userId: string): Promise<Investment | null> {
    const { data, error } = await supabase
      .from('user_investments')
      .select(`
        *,
        tier:investment_tiers(name, hashpower)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching investment:', error);
      return null;
    }

    return data as Investment;
  },

  async getRewardHistory(userId: string, limit: number = 30): Promise<DailyReward[]> {
    const { data, error } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'processed')
      .order('reward_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reward history:', error);
      return [];
    }
    
    return data || [];
  },

  async getTotalEarned(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('daily_rewards')
      .select('sbc_amount')
      .eq('user_id', userId)
      .eq('status', 'processed');

    if (error) {
      console.error('Error calculating total earned:', error);
      return 0;
    }

    return data?.reduce((sum, reward) => sum + Number(reward.sbc_amount), 0) || 0;
  },

  async getProjectedDaily(investment: Investment): Promise<{ usd: number; sbc: number } | null> {
    const { data: priceData, error } = await supabase
      .from('sbc_price_history')
      .select('price_usd')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !priceData) return null;

    const dailyUSD = investment.investment_amount_usd * investment.daily_yield_percentage;
    const dailySBC = dailyUSD / Number(priceData.price_usd);

    return {
      usd: dailyUSD,
      sbc: dailySBC,
    };
  },

  async getCurrentPrice(): Promise<number | null> {
    const { data, error } = await supabase
      .from('sbc_price_history')
      .select('price_usd')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data?.price_usd ? Number(data.price_usd) : null;
  },
};
