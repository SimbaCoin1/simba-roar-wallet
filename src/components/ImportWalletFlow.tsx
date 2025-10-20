import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { walletManager } from '@/lib/walletManager';
import { toast } from '@/hooks/use-toast';

interface ImportWalletFlowProps {
  onComplete: () => void;
  onBack: () => void;
  existingPassword?: string;
}

const ImportWalletFlow = ({ onComplete, onBack, existingPassword }: ImportWalletFlowProps) => {
  const [importType, setImportType] = useState<'mnemonic' | 'privatekey'>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState(existingPassword || '');
  const [confirmPassword, setConfirmPassword] = useState(existingPassword || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleImport = () => {
    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    try {
      let wallet;
      let mnemonicToSave;

      if (importType === 'mnemonic') {
        const trimmedMnemonic = mnemonic.trim().toLowerCase();
        wallet = walletManager.importFromMnemonic(trimmedMnemonic);
        mnemonicToSave = trimmedMnemonic;
      } else {
        const trimmedKey = privateKey.trim();
        wallet = walletManager.importFromPrivateKey(trimmedKey);
        // For private key imports, we'll store the private key as the "mnemonic"
        // This is a simplification - in production you might want a different approach
        mnemonicToSave = trimmedKey;
      }

      // Add wallet to the multi-wallet array
      walletManager.addWallet(mnemonicToSave, wallet.address, password);
      // Store password temporarily for multi-wallet unlock
      sessionStorage.setItem('temp_password', password);

      toast({
        title: 'Wallet imported successfully',
        description: `Address: ${wallet.address.slice(0, 10)}...`,
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message || 'Invalid mnemonic or private key',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h2 className="text-2xl font-bold mb-6">Import Wallet</h2>

        <Tabs value={importType} onValueChange={(v) => setImportType(v as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mnemonic">Seed Phrase</TabsTrigger>
            <TabsTrigger value="privatekey">Private Key</TabsTrigger>
          </TabsList>

          <TabsContent value="mnemonic" className="space-y-4">
            <div>
              <Label htmlFor="mnemonic">12-word Seed Phrase</Label>
              <Textarea
                id="mnemonic"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12-word seed phrase"
                rows={3}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate words with spaces
              </p>
            </div>
          </TabsContent>

          <TabsContent value="privatekey" className="space-y-4">
            <div>
              <Label htmlFor="privatekey">Private Key</Label>
              <Input
                id="privatekey"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          {!existingPassword && (
            <>
              <div>
                <Label htmlFor="password">Set Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
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

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}

          <Button
            onClick={handleImport}
            className="w-full"
            disabled={
              (!mnemonic && !privateKey) || 
              !password || 
              !confirmPassword
            }
          >
            Import Wallet
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ImportWalletFlow;
