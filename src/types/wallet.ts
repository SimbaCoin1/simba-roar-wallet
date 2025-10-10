// Placeholder types for Simba Wallet
// TODO: Replace with actual blockchain integration

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: 'sent' | 'received';
  address: string;
}

export interface WalletData {
  publicKey: string;
  privateKey?: string;
  balance: number;
  usdValue: number;
  change24h: number;
  transactions: Transaction[];
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  time: string;
  value: number;
}
