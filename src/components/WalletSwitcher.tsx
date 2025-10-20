import { StoredWallet } from '@/types/wallet';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Check } from 'lucide-react';

interface WalletSwitcherProps {
  wallets: StoredWallet[];
  activeWalletId: string;
  onSwitchWallet: (walletId: string) => void;
  walletBalances?: Map<string, number>;
}

const WalletSwitcher = ({ 
  wallets, 
  activeWalletId, 
  onSwitchWallet,
  walletBalances 
}: WalletSwitcherProps) => {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (wallets.length <= 1) return null;

  return (
    <div className="mb-6 px-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {wallets.map((wallet) => {
            const isActive = wallet.id === activeWalletId;
            const balance = walletBalances?.get(wallet.id) || 0;
            
            return (
              <CarouselItem key={wallet.id} className="pl-2 md:pl-4 basis-[280px]">
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    isActive 
                      ? 'border-primary border-2 bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSwitchWallet(wallet.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{wallet.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(wallet.address)}
                      </p>
                    </div>
                    {isActive && (
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold">
                      {balance.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })} SBC
                    </p>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {wallets.length > 1 && (
          <>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default WalletSwitcher;
