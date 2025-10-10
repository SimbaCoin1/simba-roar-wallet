import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { format } from 'date-fns';

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

  return (
    <div className="px-6 pb-6">
      <h3 className="text-lg font-semibold mb-4">Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.id} className="p-4">
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
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatAddress(tx.address)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${
                  tx.type === 'received' ? 'text-success' : 'text-foreground'
                }`}>
                  {tx.type === 'received' ? '+' : ''}{tx.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">SMC</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
