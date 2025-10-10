import { Button } from '@/components/ui/button';
import { Send, QrCode } from 'lucide-react';

interface ActionButtonsProps {
  onSend: () => void;
  onReceive: () => void;
}

const ActionButtons = ({ onSend, onReceive }: ActionButtonsProps) => {
  return (
    <div className="flex gap-4 px-6 mb-6">
      <Button 
        onClick={onSend}
        className="flex-1 h-12 text-base font-semibold"
        size="lg"
      >
        <Send className="w-5 h-5 mr-2" />
        Send
      </Button>
      <Button 
        onClick={onReceive}
        variant="outline"
        className="flex-1 h-12 text-base font-semibold"
        size="lg"
      >
        <QrCode className="w-5 h-5 mr-2" />
        Receive
      </Button>
    </div>
  );
};

export default ActionButtons;
