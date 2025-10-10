import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WalletHeaderProps {
  balance: number;
  usdValue: number;
  change24h: number;
}

const WalletHeader = ({ balance, usdValue, change24h }: WalletHeaderProps) => {
  const isPositive = change24h >= 0;

  return (
    <div className="text-center py-8 px-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <img 
          src="https://api.dicebear.com/7.x/shapes/svg?seed=simba&backgroundColor=fbbf24" 
          alt="Simba Logo" 
          className="w-10 h-10 rounded-full"
        />
        <h1 className="text-2xl font-bold">Simba Wallet</h1>
      </div>
      
      <div className="mt-6">
        <p className="text-muted-foreground text-sm mb-2">Total Balance</p>
        <h2 className="text-5xl font-bold mb-1">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <p className="text-muted-foreground text-lg">SMC</p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">
          ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="text-sm font-medium">{Math.abs(change24h).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
