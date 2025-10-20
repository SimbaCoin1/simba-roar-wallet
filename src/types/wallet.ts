export interface Transaction {
  id: string;
  hash: string;
  date: Date;
  amount: number;
  type: 'sent' | 'received';
  address: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

export interface WalletData {
  address: string;
  balance: number;
  ethBalance: number;
  usdValue: number;
  change24h: number;
  transactions: Transaction[];
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface UnlockedWalletState {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export interface StoredWallet {
  id: string;
  name: string;
  encryptedMnemonic: string;
  address: string;
  createdAt: number;
  isActive: boolean;
}

export interface MultiWalletStorage {
  wallets: StoredWallet[];
  version: number;
}

export interface BalanceSnapshot {
  timestamp: number;
  balance: number;
}
