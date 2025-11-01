import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WalletHeader from '@/components/WalletHeader';
import WalletCard from '@/components/WalletCard';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import ReceiveDialog from '@/components/ReceiveDialog';
import SendDialog from '@/components/SendDialog';
import { supabase } from '@/integrations/supabase/client';
import { custodialService } from '@/lib/custodialService';
import { balanceTracker } from '@/lib/balanceTracker';
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
  const sbcPrice = 1.50; // Mock price for now
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

      // Refresh data periodically (every 30 seconds)
      const dataInterval = setInterval(() => {
        loadWalletData();
      }, 30000);

      return () => {
        clearInterval(dataInterval);
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
      const [balance, txData] = await Promise.all([
        custodialService.getBalance(user.id),
        custodialService.getTransactions(user.id),
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
      balanceTracker.addBalanceSnapshot(depositAddress, balance);
      balanceTracker.cleanOldSnapshots(depositAddress);
      const chartData = balanceTracker.getChartData(depositAddress);

      setWalletData({
        address: depositAddress,
        balance,
        ethBalance: 0,
        usdValue: balance * sbcPrice,
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
      <div className="max-w-2xl mx-auto">
        <WalletHeader
          smcPrice={sbcPrice}
          onLock={handleLogout}
          onWalletDeleted={handleLogout}
          onAddWallet={() => {}}
          onImportWallet={() => {}}
          activeWalletId=""
          walletName={user.email || 'Wallet'}
        />

        <div className="mb-6 px-6">
          <WalletCard 
            wallet={walletData}
            onAddWallet={() => {}}
          />
        </div>

        <BalanceChart data={walletData.chartData} />

        <ActionButtons onReceive={handleReceive} />

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
      </div>
    </div>
  );
};

export default Index;
