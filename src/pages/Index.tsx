import { useState, useEffect } from 'react';
import WalletHeader from '@/components/WalletHeader';
import WalletCard from '@/components/WalletCard';
import WalletSwitcher from '@/components/WalletSwitcher';
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
import { WalletData, Transaction, StoredWallet } from '@/types/wallet';
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
  const [allWallets, setAllWallets] = useState<StoredWallet[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>('');
  const [walletBalances, setWalletBalances] = useState<Map<string, number>>(new Map());
  const sbcPrice = 1.50; // Mock price for now

  useEffect(() => {
    // Check if wallet exists and load all wallets
    if (walletManager.hasWallet()) {
      const wallets = walletManager.getAllWallets();
      setAllWallets(wallets);
      const activeWallet = walletManager.getActiveWallet();
      if (activeWallet) {
        setActiveWalletId(activeWallet.id);
      }
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
  }, [unlockedWallet, activeWalletId]);

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

      // Update balance in the map for the switcher
      setWalletBalances(prev => {
        const newMap = new Map(prev);
        newMap.set(activeWalletId, balance);
        return newMap;
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
    // Reload wallet list in case of changes
    const wallets = walletManager.getAllWallets();
    setAllWallets(wallets);
    const activeWallet = walletManager.getActiveWallet();
    if (activeWallet) {
      setActiveWalletId(activeWallet.id);
    }
  };

  const handleLock = () => {
    setUnlockedWallet(null);
    setWalletData(null);
    setAppState('locked');
    walletManager.clearAutoLock();
  };

  const handleWalletCreated = () => {
    // Reload wallets list
    const wallets = walletManager.getAllWallets();
    setAllWallets(wallets);
    const activeWallet = walletManager.getActiveWallet();
    if (activeWallet) {
      setActiveWalletId(activeWallet.id);
    }
    setAppState('locked');
  };

  const handleWalletDeleted = async () => {
    // Reload all wallets after deletion
    const wallets = walletManager.getAllWallets();
    setAllWallets(wallets);
    
    if (wallets.length === 0) {
      // No wallets left, go to onboarding
      setAppState('onboarding');
      setUnlockedWallet(null);
      setWalletData(null);
      setActiveWalletId('');
    } else {
      // Switch to first available wallet
      const nextWallet = wallets[0];
      walletManager.switchWallet(nextWallet.id);
      setActiveWalletId(nextWallet.id);
      
      // Reload wallet data for the new active wallet
      if (unlockedWallet) {
        await loadWalletData();
      }
    }
  };

  const handleSwitchWallet = async (walletId: string) => {
    walletManager.switchWallet(walletId);
    setActiveWalletId(walletId);
    
    // Reload wallet data for the newly selected wallet
    const activeWallet = walletManager.getActiveWallet();
    if (activeWallet && unlockedWallet) {
      // Need to unlock the new wallet (password already verified)
      try {
        const password = sessionStorage.getItem('temp_password');
        if (password) {
          const newUnlockedWallet = walletManager.unlockWallet(password, walletId);
          setUnlockedWallet(newUnlockedWallet);
        }
      } catch (error) {
        console.error('Error switching wallet:', error);
      }
    }
    
    walletManager.resetAutoLock(() => handleLock());
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
    const existingPassword = sessionStorage.getItem('temp_password') || undefined;
    return (
      <CreateWalletFlow
        onComplete={handleWalletCreated}
        onBack={() => setAppState('onboarding')}
        existingPassword={existingPassword}
      />
    );
  }

  if (appState === 'import') {
    const existingPassword = sessionStorage.getItem('temp_password') || undefined;
    return (
      <ImportWalletFlow
        onComplete={handleWalletCreated}
        onBack={() => setAppState('onboarding')}
        existingPassword={existingPassword}
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
          onWalletDeleted={handleWalletDeleted}
          onAddWallet={() => setShowAddWallet(true)}
          onImportWallet={() => setShowAddWallet(true)}
          activeWalletId={activeWalletId}
          walletName={allWallets.find(w => w.id === activeWalletId)?.name}
        />

        <WalletSwitcher
          wallets={allWallets}
          activeWalletId={activeWalletId}
          onSwitchWallet={handleSwitchWallet}
          walletBalances={walletBalances}
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
