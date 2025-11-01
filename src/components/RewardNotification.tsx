import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Card } from './ui/card';

interface RewardNotificationProps {
  sbcAmount: number;
  usdAmount: number;
  show: boolean;
  onClose: () => void;
}

export const RewardNotification = ({ sbcAmount, usdAmount, show, onClose }: RewardNotificationProps) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">Daily Reward Received!</h4>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-primary mb-1">
                  +{sbcAmount.toFixed(2)} SBC
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ ${usdAmount.toFixed(2)} USD
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
