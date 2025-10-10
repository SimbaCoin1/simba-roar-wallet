import { useState } from 'react';
import WalletHeader from '@/components/WalletHeader';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import { mockWallets, mockChartData } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const currentWallet = mockWallets[currentWalletIndex];
  const hasMultipleWallets = mockWallets.length > 1;

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

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!hasMultipleWallets) return;
    
    if (direction === 'left' && currentWalletIndex < mockWallets.length - 1) {
      setCurrentWalletIndex(prev => prev + 1);
    } else if (direction === 'right' && currentWalletIndex > 0) {
      setCurrentWalletIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div 
        className="w-full max-w-[414px] min-h-screen bg-background relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicators */}
        {hasMultipleWallets && (
          <>
            {currentWalletIndex > 0 && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 animate-pulse">
                <ChevronLeft className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
            {currentWalletIndex < mockWallets.length - 1 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 animate-pulse">
                <ChevronRight className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
          </>
        )}

        <WalletHeader 
          balance={currentWallet.balance}
          usdValue={currentWallet.usdValue}
          change24h={currentWallet.change24h}
        />
        
        <BalanceChart data={mockChartData} />
        
        <ActionButtons onSend={handleSend} onReceive={handleReceive} />
        
        <TransactionsList transactions={currentWallet.transactions} />

        {/* Wallet indicator dots */}
        {hasMultipleWallets && (
          <div className="flex justify-center gap-2 py-4">
            {mockWallets.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentWalletIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
