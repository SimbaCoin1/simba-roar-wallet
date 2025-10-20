import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { format } from 'date-fns';
import { blockchainService } from '@/lib/blockchainService';

interface TransactionsListProps {
  transactions: Transaction[];
}

const TransactionsList = ({ transactions }: TransactionsListProps) => {
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy • HH:mm');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold mb-4">Transactions</h3>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No transactions yet</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <h3 className="text-lg font-semibold mb-4">Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card 
            key={tx.id} 
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => window.open(blockchainService.getEtherscanLink(tx.hash), '_blank')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  tx.type === 'received' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {tx.type === 'received' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">{tx.type}</p>
                    {tx.status === 'pending' && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                    {tx.status === 'failed' && (
                      <span className="text-xs text-destructive">Failed</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {formatAddress(tx.address)}
                    <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  tx.type === 'received' ? 'text-success' : 'text-foreground'
                }`}>
                  {tx.type === 'received' ? '+' : '-'}{tx.amount.toFixed(6)}
                </p>
                <p className="text-sm text-muted-foreground">SBC</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
