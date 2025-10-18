import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { walletManager } from '@/lib/walletManager';
import { toast } from '@/hooks/use-toast';
import simbaCoinLogo from '@/assets/simba-coin-logo.png';

interface UnlockWalletProps {
  onUnlock: (wallet: { address: string; privateKey: string; mnemonic: string }) => void;
}

const UnlockWallet = ({ onUnlock }: UnlockWalletProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const walletAddress = walletManager.getWalletAddress();

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const wallet = walletManager.unlockWallet(password);
      toast({
        title: 'Wallet unlocked',
        description: 'Welcome back!',
      });
      onUnlock(wallet);
    } catch (error: any) {
      toast({
        title: 'Failed to unlock wallet',
        description: error.message || 'Invalid password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleUnlock();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img 
            src={simbaCoinLogo} 
            alt="Simba Coin Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
          />
          <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Unlock Wallet</h2>
          {walletAddress && (
            <p className="text-sm text-muted-foreground font-mono">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleUnlock}
            className="w-full"
            disabled={!password || loading}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UnlockWallet;
