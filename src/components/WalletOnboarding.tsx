import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Download, Shield } from 'lucide-react';
import simbaCoinLogo from '@/assets/simba-coin-logo.png';

interface WalletOnboardingProps {
  onCreateNew: () => void;
  onImport: () => void;
}

const WalletOnboarding = ({ onCreateNew, onImport }: WalletOnboardingProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img 
            src={simbaCoinLogo} 
            alt="Simba Coin Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
          />
          <h1 className="text-3xl font-bold mb-2">Welcome to Simba Wallet</h1>
          <p className="text-muted-foreground">
            Your secure gateway to Simbacoin
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Button 
            onClick={onCreateNew}
            className="w-full h-14 text-base"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Wallet
          </Button>

          <Button 
            onClick={onImport}
            variant="outline"
            className="w-full h-14 text-base"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Import Existing Wallet
          </Button>
        </div>

        <Card className="p-4 bg-muted/50 border-primary/20">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Security Notice</p>
              <p>Your seed phrase is the only way to recover your wallet. Keep it safe and never share it with anyone.</p>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default WalletOnboarding;
