import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddWalletDialog from './AddWalletDialog';
import SettingsSheet from './SettingsSheet';

interface WalletHeaderProps {
  smcPrice: number;
  change24h: number;
}

const WalletHeader = ({ smcPrice, change24h }: WalletHeaderProps) => {
  const isPositive = change24h >= 0;
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="py-6 px-6 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddWallet(true)}
            className="rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <img 
            src="https://api.dicebear.com/7.x/shapes/svg?seed=simba&backgroundColor=fbbf24" 
            alt="Simba Logo" 
            className="w-10 h-10 rounded-full"
          />
          <h1 className="text-2xl font-bold">Simba Wallet</h1>
        </div>
      
        <div className="bg-muted/30 rounded-lg p-4 border">
          <p className="text-xs text-muted-foreground mb-1">Simba Coin Price</p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">
                ${smcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-sm text-muted-foreground">SMC</span>
            </div>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(change24h).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <AddWalletDialog open={showAddWallet} onOpenChange={setShowAddWallet} />
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};

export default WalletHeader;
