import { useState } from 'react';
import { MoreVertical, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsSheet from './SettingsSheet';
import simbaCoinLogo from '@/assets/simba-coin-logo.png';

interface WalletHeaderProps {
  smcPrice: number;
  onLock?: () => void;
  onWalletDeleted?: () => void;
}

const WalletHeader = ({ smcPrice, onLock, onWalletDeleted }: WalletHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="py-6 px-6 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          {onLock && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLock}
              className="rounded-full"
              title="Lock wallet"
            >
              <Lock className="w-5 h-5" />
            </Button>
          )}
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
            src={simbaCoinLogo} 
            alt="Simba Coin Logo" 
            className="w-10 h-10 rounded-full object-cover"
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
          </div>
        </div>
      </div>
      
      <SettingsSheet 
        open={showSettings} 
        onOpenChange={setShowSettings}
        onWalletDeleted={onWalletDeleted}
      />
    </>
  );
};

export default WalletHeader;
