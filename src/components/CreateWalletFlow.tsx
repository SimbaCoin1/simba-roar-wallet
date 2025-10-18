import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { walletManager } from '@/lib/walletManager';
import { toast } from '@/hooks/use-toast';

interface CreateWalletFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const CreateWalletFlow = ({ onComplete, onBack }: CreateWalletFlowProps) => {
  const [step, setStep] = useState<'password' | 'reveal' | 'confirm'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [address, setAddress] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmWords, setConfirmWords] = useState<string[]>([]);

  const words = mnemonic.split(' ');

  const handleSetPassword = () => {
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

    const wallet = walletManager.generateWallet();
    setMnemonic(wallet.mnemonic);
    setAddress(wallet.address);
    setStep('reveal');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Seed phrase has been copied',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueToConfirm = () => {
    setStep('confirm');
  };

  const handleConfirmWord = (word: string) => {
    const newConfirm = [...confirmWords, word];
    setConfirmWords(newConfirm);

    if (newConfirm.length === 12) {
      if (newConfirm.join(' ') === mnemonic) {
        walletManager.saveWallet(mnemonic, address, password);
        toast({
          title: 'Wallet created successfully',
          description: `Your wallet address: ${address.slice(0, 10)}...`,
        });
        onComplete();
      } else {
        toast({
          title: 'Incorrect seed phrase',
          description: 'Please try again',
          variant: 'destructive',
        });
        setConfirmWords([]);
      }
    }
  };

  const shuffledWords = [...words].sort(() => Math.random() - 0.5);

  if (step === 'password') {
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

          <h2 className="text-2xl font-bold mb-6">Set Password</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
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

            <Button
              onClick={handleSetPassword}
              className="w-full"
              disabled={!password || !confirmPassword}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'reveal') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full p-8">
          <h2 className="text-2xl font-bold mb-2">Your Seed Phrase</h2>
          <p className="text-muted-foreground mb-6">
            Write down these 12 words in order and store them safely
          </p>

          <Card className="p-4 mb-4 bg-muted/50 border-destructive/50">
            <div className="flex gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Never share your seed phrase</p>
                <p className="text-muted-foreground">Anyone with these words can access your funds</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 mb-4 relative">
            {!showMnemonic && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <Button onClick={() => setShowMnemonic(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Reveal Seed Phrase
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {words.map((word, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
              disabled={!showMnemonic}
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              onClick={handleContinueToConfirm}
              className="flex-1"
              disabled={!showMnemonic}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-2">Confirm Seed Phrase</h2>
        <p className="text-muted-foreground mb-6">
          Select the words in the correct order ({confirmWords.length}/12)
        </p>

        <Card className="p-4 mb-4 bg-muted/20 min-h-[100px]">
          <div className="flex flex-wrap gap-2">
            {confirmWords.map((word, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-mono"
              >
                {word}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {shuffledWords.map((word, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleConfirmWord(word)}
              disabled={confirmWords.includes(word)}
              className="font-mono"
            >
              {word}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={() => setConfirmWords([])}
          className="w-full"
          disabled={confirmWords.length === 0}
        >
          Reset
        </Button>
      </Card>
    </div>
  );
};

export default CreateWalletFlow;
