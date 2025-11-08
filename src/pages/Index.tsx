import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletHeader from '@/components/WalletHeader';
import WalletCard from '@/components/WalletCard';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import ReceiveDialog from '@/components/ReceiveDialog';
import SendDialog from '@/components/SendDialog';
import { InvestmentCard } from '@/components/InvestmentCard';
import { RewardsHistory } from '@/components/RewardsHistory';
import { RewardNotification } from '@/components/RewardNotification';
import { supabase } from '@/integrations/supabase/client';
import { custodialService } from '@/lib/custodialService';
import { balanceTracker } from '@/lib/balanceTracker';
import { investmentService } from '@/lib/investmentService';
import { WalletData, Transaction } from '@/types/wallet';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [investment, setInvestment] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [projectedDaily, setProjectedDaily] = useState<{ usd: number; sbc: number } | null>(null);
  const [sbcPrice, setSbcPrice] = useState(0.10);
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [latestReward, setLatestReward] = useState<{ sbc: number; usd: number } | null>(null);
  const depositAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"; // Mock deposit address

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          initializeUserBalance(session.user.id);
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        initializeUserBalance(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadWalletData();

      // Set up realtime subscription for new rewards
      const channel = supabase
        .channel('daily_rewards_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'daily_rewards',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New reward received!', payload);
            const newReward = payload.new as any;
            if (newReward.status === 'processed') {
              setLatestReward({
                sbc: Number(newReward.sbc_amount),
                usd: Number(newReward.usd_amount),
              });
              setShowRewardNotification(true);
              // Reload wallet data to update balance
              setTimeout(() => loadWalletData(), 1000);
            }
          }
        )
        .subscribe();

      // Refresh data periodically (every 30 seconds)
      const dataInterval = setInterval(() => {
        loadWalletData();
      }, 30000);

      return () => {
        clearInterval(dataInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const initializeUserBalance = async (userId: string) => {
    try {
      await custodialService.initializeBalance(userId);
    } catch (error) {
      console.error('Error initializing balance:', error);
    }
  };

  const loadWalletData = async () => {
    if (!user) return;

    try {
      const [balance, txData, activeInvestment, rewardHistory, totalEarnedAmount, currentPrice] = await Promise.all([
        custodialService.getBalance(user.id),
        custodialService.getTransactions(user.id),
        investmentService.getActiveInvestment(user.id),
        investmentService.getRewardHistory(user.id),
        investmentService.getTotalEarned(user.id),
        investmentService.getCurrentPrice(),
      ]);

      const transactions: Transaction[] = txData.map((tx) => ({
        id: tx.id,
        hash: tx.blockchain_hash || tx.id,
        date: new Date(tx.created_at),
        amount: parseFloat(tx.amount),
        type: tx.type === 'deposit' || tx.type === 'credit' 
          ? 'received' 
          : tx.type === 'daily_reward' 
          ? 'reward' 
          : 'sent',
        address: depositAddress,
        status: tx.status as 'pending' | 'confirmed' | 'failed',
      }));

      // Record balance snapshot and get chart data
      balanceTracker.addBalanceSnapshot(depositAddress, balance.sbc);
      balanceTracker.cleanOldSnapshots(depositAddress);
      const chartData = balanceTracker.getChartData(depositAddress);

      // Update investment data
      setInvestment(activeInvestment);
      setRewards(rewardHistory);
      setTotalEarned(totalEarnedAmount);
      
      if (currentPrice) {
        setSbcPrice(currentPrice);
      }

      // Calculate projected daily earnings
      if (activeInvestment) {
        const projected = await investmentService.getProjectedDaily(activeInvestment);
        setProjectedDaily(projected);
      }

      setWalletData({
        address: depositAddress,
        balance: balance.sbc,
        ethBalance: 0,
        usdValue: balance.sbc * (currentPrice || sbcPrice),
        change24h: 0,
        transactions,
        chartData,
      });
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSend = () => {
    setSendOpen(true);
  };

  const handleReceive = () => {
    setReceiveOpen(true);
  };

  const handleTransactionComplete = () => {
    loadWalletData();
  };

  const handleTestReward = async () => {
    if (!user) return;

    try {
      toast.info('Test reward triggered', {
        description: 'Processing reward... Check for notification!',
      });

      // First, get the active investment
      const { data: investmentData, error: fetchError } = await supabase
        .from('user_investments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError || !investmentData) {
        toast.error('No active investment found. Please purchase an investment tier first.');
        return;
      }

      // Update the next_reward_date to today
      const today = new Date().toISOString().split('T')[0];
      const { error: updateError } = await supabase
        .from('user_investments')
        .update({ next_reward_date: today })
        .eq('id', investmentData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Failed to prepare investment for reward processing.');
        return;
      }

      // Wait a bit to ensure database update propagates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call the edge function to process rewards
      const { data, error } = await supabase.functions.invoke('process-daily-rewards', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to process reward. Check console for details.');
        return;
      }

      console.log('Reward processing result:', data);
      
      if (data.successful > 0) {
        toast.success(`Successfully processed ${data.successful} reward(s)!`);
      } else {
        toast.warning('No rewards were processed. Check the console for details.');
      }
    } catch (error) {
      console.error('Error testing reward:', error);
      toast.error('An error occurred while processing the reward.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!walletData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="w-full lg:max-w-2xl lg:mx-auto">
        <WalletHeader
          smcPrice={sbcPrice}
          onLock={handleLogout}
          onAddWallet={() => {}}
          onImportWallet={() => {}}
          userEmail={user.email}
          onTestReward={handleTestReward}
        />

        <div className="mb-6 px-4 lg:px-6">
          <WalletCard 
            wallet={walletData}
            onAddWallet={() => {}}
          />
        </div>

        {investment && (
          <div className="mb-6 px-4 lg:px-6">
            <InvestmentCard investment={investment} projectedDaily={projectedDaily} />
          </div>
        )}

        <BalanceChart data={walletData.chartData} />

        <ActionButtons onReceive={handleReceive} />

        {investment && rewards.length > 0 && (
          <div className="mb-6 px-4 lg:px-6">
            <RewardsHistory rewards={rewards} totalEarned={totalEarned} />
          </div>
        )}

        <TransactionsList transactions={walletData.transactions} />

        <ReceiveDialog
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          address={depositAddress}
        />

        <SendDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          privateKey=""
          balance={walletData.balance}
          ethBalance={0}
          onTransactionComplete={handleTransactionComplete}
          userId={user.id}
        />

        {latestReward && (
          <RewardNotification
            sbcAmount={latestReward.sbc}
            usdAmount={latestReward.usd}
            show={showRewardNotification}
            onClose={() => setShowRewardNotification(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
