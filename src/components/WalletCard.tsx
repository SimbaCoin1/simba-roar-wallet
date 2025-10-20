import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletData } from '@/types/wallet';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';

interface WalletCardProps {
  wallet: WalletData;
  onAddWallet?: () => void;
}

const WalletCard = ({ wallet, onAddWallet }: WalletCardProps) => {
  const isPositive = wallet.change24h >= 0;

  return (
    <Card className="p-8 border-2 min-h-[280px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">Wallet</p>
          {onAddWallet && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddWallet}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Wallet
            </Button>
          )}
        </div>
        <h2 className="text-6xl font-bold mb-2">
          {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-4xl">SBC</span>
        </h2>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Latest Transaction</p>
          <p className="text-sm font-medium">
            {wallet.transactions.length > 0 
              ? new Date(wallet.transactions[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Never'
            }
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xl">
            ${wallet.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-medium">{Math.abs(wallet.change24h).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WalletCard;
