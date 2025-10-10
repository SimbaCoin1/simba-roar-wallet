import { WalletData, Transaction, ChartDataPoint } from '@/types/wallet';

// Mock transaction data - PLACEHOLDER DATA
// TODO: Replace with actual Simba Coin blockchain API
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date('2025-10-10T14:32:00'),
    amount: 150.50,
    type: 'received',
    address: 'SMC1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0',
  },
  {
    id: '2',
    date: new Date('2025-10-10T10:15:00'),
    amount: -45.25,
    type: 'sent',
    address: 'SMC9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0',
  },
  {
    id: '3',
    date: new Date('2025-10-09T18:45:00'),
    amount: 320.00,
    type: 'received',
    address: 'SMC5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4',
  },
  {
    id: '4',
    date: new Date('2025-10-09T12:20:00'),
    amount: -100.00,
    type: 'sent',
    address: 'SMC3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2',
  },
  {
    id: '5',
    date: new Date('2025-10-08T16:30:00'),
    amount: 75.80,
    type: 'received',
    address: 'SMC7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
  },
  {
    id: '6',
    date: new Date('2025-10-08T09:10:00'),
    amount: -25.00,
    type: 'sent',
    address: 'SMC1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0',
  },
  {
    id: '7',
    date: new Date('2025-10-07T14:55:00'),
    amount: 200.00,
    type: 'received',
    address: 'SMC9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8',
  },
];

// Mock wallet data - PLACEHOLDER DATA
export const mockWalletData: WalletData = {
  publicKey: 'SMC1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7',
  balance: 2530.35,
  usdValue: 3795.53, // Assuming $1.50 per SMC
  change24h: 5.24,
  transactions: mockTransactions,
};

// Mock chart data - PLACEHOLDER DATA
export const mockChartData: ChartDataPoint[] = [
  { time: '00:00', value: 2400 },
  { time: '04:00', value: 2420 },
  { time: '08:00', value: 2385 },
  { time: '12:00', value: 2450 },
  { time: '16:00', value: 2480 },
  { time: '20:00', value: 2530.35 },
];
