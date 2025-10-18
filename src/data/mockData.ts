import { WalletData, Transaction, ChartDataPoint } from '@/types/wallet';

// Mock transaction data - No longer needed as we fetch real blockchain data
export const mockTransactions: Transaction[] = [];

// Mock chart data for wallet 1
export const mockChartData1: ChartDataPoint[] = [
  { time: '00:00', value: 2400 },
  { time: '04:00', value: 2420 },
  { time: '08:00', value: 2385 },
  { time: '12:00', value: 2450 },
  { time: '16:00', value: 2480 },
  { time: '20:00', value: 2530.35 },
];

// Mock chart data for wallet 2
export const mockChartData2: ChartDataPoint[] = [
  { time: '00:00', value: 1200 },
  { time: '04:00', value: 1180 },
  { time: '08:00', value: 1220 },
  { time: '12:00', value: 1210 },
  { time: '16:00', value: 1235 },
  { time: '20:00', value: 1245.80 },
];

// Mock wallet data - No longer used, real data is fetched from blockchain
export const mockWallets: WalletData[] = [];

// Mock chart data - PLACEHOLDER DATA
export const mockChartData: ChartDataPoint[] = [
  { time: '00:00', value: 2400 },
  { time: '04:00', value: 2420 },
  { time: '08:00', value: 2385 },
  { time: '12:00', value: 2450 },
  { time: '16:00', value: 2480 },
  { time: '20:00', value: 2530.35 },
];
