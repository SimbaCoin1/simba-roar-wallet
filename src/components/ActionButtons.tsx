import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface ActionButtonsProps {
  onReceive: () => void;
}

const ActionButtons = ({ onReceive }: ActionButtonsProps) => {
  return (
    <div className="px-6 mb-6">
      <Button 
        onClick={onReceive}
        variant="outline"
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        <QrCode className="w-5 h-5 mr-2" />
        Receive
      </Button>
    </div>
  );
};

export default ActionButtons;
