import { useState } from 'react';
import WalletHeader from '@/components/WalletHeader';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import { mockWalletData, mockChartData } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [walletData] = useState(mockWalletData);

  const handleSend = () => {
    toast({
      title: "Send Feature",
      description: "Send functionality will be integrated with Simba Coin blockchain",
    });
  };

  const handleReceive = () => {
    toast({
      title: "Receive Feature", 
      description: "Receive functionality will be integrated with Simba Coin blockchain",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <WalletHeader 
          balance={walletData.balance}
          usdValue={walletData.usdValue}
          change24h={walletData.change24h}
        />
        
        <BalanceChart data={mockChartData} />
        
        <ActionButtons onSend={handleSend} onReceive={handleReceive} />
        
        <TransactionsList transactions={walletData.transactions} />
      </div>
    </div>
  );
};

export default Index;
