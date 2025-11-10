import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2, ExternalLink } from 'lucide-react';
import { blockchainService } from '@/lib/blockchainService';
import { custodialService } from '@/lib/custodialService';
import { toast } from '@/hooks/use-toast';
import { transactionSchema } from '@/lib/validation';

interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  privateKey: string;
  balance: number;
  ethBalance: number;
  onTransactionComplete: () => void;
  userId?: string;
}

const SendDialog = ({ 
  open, 
  onOpenChange, 
  privateKey, 
  balance, 
  ethBalance,
  onTransactionComplete,
  userId
}: SendDialogProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  useEffect(() => {
    if (recipient && amount && blockchainService.isValidAddress(recipient)) {
      estimateGas();
    }
  }, [recipient, amount]);

  const estimateGas = async () => {
    try {
      setLoading(true);
      const address = ''; // We don't need the from address for estimation
      const gas = await blockchainService.estimateGas(address, recipient, amount);
      setGasEstimate(gas.gasCost);
    } catch (error) {
      setGasEstimate('');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Validate transaction data with zod
    const validation = transactionSchema.safeParse({ recipient, amount });
    
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const amountNum = parseFloat(amount);

    if (amountNum > balance) {
      toast({
        title: 'Insufficient balance',
        description: `You only have ${balance.toFixed(6)} SBC`,
        variant: 'destructive',
      });
      return;
    }

    if (!userId && ethBalance < 0.001) {
      toast({
        title: 'Insufficient ETH for gas',
        description: 'You need ETH to pay for transaction fees',
        variant: 'destructive',
      });
      return;
    }

    setStep('confirm');
  };

  const handleSend = async () => {
    setSending(true);
    try {
      if (userId) {
        // Custodial withdrawal
        await custodialService.debitBalance(userId, parseFloat(amount), recipient);
        setTxHash('pending_withdrawal');
        setStep('success');

        toast({
          title: 'Withdrawal requested',
          description: 'Your withdrawal has been submitted for processing',
        });

        onTransactionComplete();
      } else {
        // Blockchain transaction
        const result = await blockchainService.sendTransaction(
          privateKey,
          recipient,
          amount
        );

        setTxHash(result.hash);
        setStep('success');

        toast({
          title: 'Transaction sent',
          description: 'Your transaction has been broadcast to the network',
        });

        // Wait for confirmation in background
        blockchainService.waitForTransaction(result.hash).then((success) => {
          if (success) {
            onTransactionComplete();
          }
        });
      }
    } catch (error: any) {
      toast({
        title: 'Transaction failed',
        description: error.message || 'Failed to send transaction',
        variant: 'destructive',
      });
      setStep('input');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setGasEstimate('');
    setTxHash('');
    setStep('input');
    onOpenChange(false);
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Sent</DialogTitle>
            <DialogDescription>
              Your transaction has been broadcast to the network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
              <p className="font-mono text-xs break-all">{txHash}</p>
            </div>

            {!userId && txHash !== 'pending_withdrawal' && (
              <Button
                onClick={() => window.open(blockchainService.getEtherscanLink(txHash), '_blank')}
                variant="outline"
                className="w-full"
              >
                View on Etherscan
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'confirm') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              Please review the transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-mono">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{amount} SBC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gas Fee (estimated)</span>
                <span>{gasEstimate || '...'} ETH</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('input')}
                variant="outline"
                className="flex-1"
                disabled={sending}
              >
                Back
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Confirm & Send'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Simbacoin</DialogTitle>
          <DialogDescription>
            Send SBC to another wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (SBC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available: {balance.toFixed(6)} SBC
            </p>
          </div>

          {gasEstimate && (
            <div className="text-sm text-muted-foreground">
              Estimated gas: ~{gasEstimate} ETH
            </div>
          )}

          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!recipient || !amount || loading}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendDialog;
