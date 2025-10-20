import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/hooks/use-toast';

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
}

const ReceiveDialog = ({ open, onOpenChange, address }: ReceiveDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: 'Address copied',
      description: 'Wallet address has been copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Simbacoin</DialogTitle>
          <DialogDescription>
            Share this address to receive SBC tokens
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={address} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Input
                value={address}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Only send Simbacoin (SBC) to this address
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveDialog;
