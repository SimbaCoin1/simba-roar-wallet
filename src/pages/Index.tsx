import { useState, useEffect } from 'react';
import WalletHeader from '@/components/WalletHeader';
import WalletCard from '@/components/WalletCard';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import WalletOnboarding from '@/components/WalletOnboarding';
import CreateWalletFlow from '@/components/CreateWalletFlow';
import ImportWalletFlow from '@/components/ImportWalletFlow';
import UnlockWallet from '@/components/UnlockWallet';
import ReceiveDialog from '@/components/ReceiveDialog';
import SendDialog from '@/components/SendDialog';
import AddWalletDialog from '@/components/AddWalletDialog';
import { walletManager } from '@/lib/walletManager';
import { blockchainService } from '@/lib/blockchainService';
import { WalletData, Transaction } from '@/types/wallet';
import { mockChartData1 } from '@/data/mockData';
import { Loader2 } from 'lucide-react';

type AppState = 'onboarding' | 'create' | 'import' | 'locked' | 'unlocked';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [unlockedWallet, setUnlockedWallet] = useState<{ address: string; privateKey: string; mnemonic: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const sbcPrice = 1.50; // Mock price for now

  useEffect(() => {
    // Check if wallet exists
    if (walletManager.hasWallet()) {
      setAppState('locked');
    } else {
      setAppState('onboarding');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (unlockedWallet) {
      loadWalletData();
      
      // Start auto-lock timer
      walletManager.startAutoLock(() => {
        handleLock();
      });

      // Refresh data periodically
      const interval = setInterval(() => {
        loadWalletData();
      }, 30000); // Every 30 seconds

      return () => {
        clearInterval(interval);
        walletManager.clearAutoLock();
      };
    }
  }, [unlockedWallet]);

  const loadWalletData = async () => {
    if (!unlockedWallet) return;

    try {
      const [balance, ethBalance, txHistory] = await Promise.all([
        blockchainService.getBalance(unlockedWallet.address).catch(() => 0),
        blockchainService.getEthBalance(unlockedWallet.address).catch(() => 0),
        blockchainService.getTransactionHistory(unlockedWallet.address).catch(() => []),
      ]);

      const transactions: Transaction[] = txHistory.map((tx) => ({
        id: tx.hash,
        hash: tx.hash,
        date: new Date(tx.timestamp),
        amount: parseFloat(tx.value),
        type: (tx.to.toLowerCase() === unlockedWallet.address.toLowerCase() ? 'received' : 'sent') as 'received' | 'sent',
        address: tx.to.toLowerCase() === unlockedWallet.address.toLowerCase() ? tx.from : tx.to,
        status: tx.status,
        blockNumber: tx.blockNumber,
      }));

      setWalletData({
        address: unlockedWallet.address,
        balance,
        ethBalance,
        usdValue: balance * sbcPrice,
        change24h: 0,
        transactions,
        chartData: mockChartData1,
      });
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Set wallet data with zeros if blockchain fails
      setWalletData({
        address: unlockedWallet.address,
        balance: 0,
        ethBalance: 0,
        usdValue: 0,
        change24h: 0,
        transactions: [],
        chartData: mockChartData1,
      });
    }
  };

  const handleUnlock = (wallet: { address: string; privateKey: string; mnemonic: string }) => {
    setUnlockedWallet(wallet);
    setAppState('unlocked');
  };

  const handleLock = () => {
    setUnlockedWallet(null);
    setWalletData(null);
    setAppState('locked');
    walletManager.clearAutoLock();
  };

  const handleWalletCreated = () => {
    setAppState('locked');
  };

  const handleSend = () => {
    setSendOpen(true);
    walletManager.resetAutoLock(() => handleLock());
  };

  const handleReceive = () => {
    setReceiveOpen(true);
    walletManager.resetAutoLock(() => handleLock());
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

  if (appState === 'onboarding') {
    return (
      <WalletOnboarding
        onCreateNew={() => setAppState('create')}
        onImport={() => setAppState('import')}
      />
    );
  }

  if (appState === 'create') {
    return (
      <CreateWalletFlow
        onComplete={handleWalletCreated}
        onBack={() => setAppState('onboarding')}
      />
    );
  }

  if (appState === 'import') {
    return (
      <ImportWalletFlow
        onComplete={handleWalletCreated}
        onBack={() => setAppState('onboarding')}
      />
    );
  }

  if (appState === 'locked') {
    return <UnlockWallet onUnlock={handleUnlock} />;
  }

  if (!walletData) {
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
          onLock={handleLock}
          onWalletDeleted={() => {
            setUnlockedWallet(null);
            setWalletData(null);
            setAppState('onboarding');
          }}
          onAddWallet={() => {
            handleLock();
            setTimeout(() => setAppState('create'), 100);
          }}
          onImportWallet={() => {
            handleLock();
            setTimeout(() => setAppState('import'), 100);
          }}
        />

        <div className="mb-6 px-6">
          <WalletCard 
            wallet={walletData}
            onAddWallet={() => setShowAddWallet(true)}
          />
        </div>

        <BalanceChart data={walletData.chartData} />

        <ActionButtons onSend={handleSend} onReceive={handleReceive} />

        <TransactionsList transactions={walletData.transactions} />

        {unlockedWallet && (
          <>
            <ReceiveDialog
              open={receiveOpen}
              onOpenChange={setReceiveOpen}
              address={unlockedWallet.address}
            />

            <SendDialog
              open={sendOpen}
              onOpenChange={setSendOpen}
              privateKey={unlockedWallet.privateKey}
              balance={walletData.balance}
              ethBalance={walletData.ethBalance}
              onTransactionComplete={handleTransactionComplete}
            />
          </>
        )}

        <AddWalletDialog
          open={showAddWallet}
          onOpenChange={setShowAddWallet}
          onCreateNew={() => {
            setShowAddWallet(false);
            handleLock();
            setTimeout(() => setAppState('create'), 100);
          }}
          onImport={() => {
            setShowAddWallet(false);
            handleLock();
            setTimeout(() => setAppState('import'), 100);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
