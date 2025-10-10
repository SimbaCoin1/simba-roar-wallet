import { useState, useEffect } from 'react';
import WalletHeader from '@/components/WalletHeader';
import WalletCard from '@/components/WalletCard';
import BalanceChart from '@/components/BalanceChart';
import ActionButtons from '@/components/ActionButtons';
import TransactionsList from '@/components/TransactionsList';
import { mockWallets } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const Index = () => {
  const { toast } = useToast();
  const [api, setApi] = useState<CarouselApi>();
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);

  const currentWallet = mockWallets[currentWalletIndex];
  const hasMultipleWallets = mockWallets.length > 1;

  // Update current wallet index when carousel changes
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentWalletIndex(api.selectedScrollSnap());
    });
  }, [api]);

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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-[414px] min-h-screen bg-background">
        <WalletHeader 
          smcPrice={currentWallet.usdValue / currentWallet.balance}
          change24h={currentWallet.change24h}
        />

        <div className="px-6 mb-6">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {mockWallets.map((wallet, index) => (
                <CarouselItem key={index} className="pl-4 basis-[85%]">
                  <WalletCard wallet={wallet} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        
        <BalanceChart data={currentWallet.chartData} />
        
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
