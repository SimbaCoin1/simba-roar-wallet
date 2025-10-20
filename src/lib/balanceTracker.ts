import { ChartDataPoint } from '@/types/wallet';

interface BalanceSnapshot {
  timestamp: number;
  balance: number;
}

const STORAGE_PREFIX = 'simba_balance_history_';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const balanceTracker = {
  addBalanceSnapshot(address: string, balance: number): void {
    const storageKey = `${STORAGE_PREFIX}${address}`;
    const existingData = this.getSnapshots(address);
    const now = Date.now();
    
    // Only add if it's been at least an hour since last snapshot, or if this is the first one
    const lastSnapshot = existingData[existingData.length - 1];
    const oneHour = 60 * 60 * 1000;
    
    if (!lastSnapshot || (now - lastSnapshot.timestamp) >= oneHour) {
      existingData.push({ timestamp: now, balance });
      localStorage.setItem(storageKey, JSON.stringify(existingData));
    } else {
      // Update the most recent snapshot if less than an hour has passed
      existingData[existingData.length - 1] = { timestamp: now, balance };
      localStorage.setItem(storageKey, JSON.stringify(existingData));
    }
  },

  getSnapshots(address: string): BalanceSnapshot[] {
    const storageKey = `${STORAGE_PREFIX}${address}`;
    const data = localStorage.getItem(storageKey);
    
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  getBalanceHistory(address: string): BalanceSnapshot[] {
    const allSnapshots = this.getSnapshots(address);
    const now = Date.now();
    
    // Filter to only last 24 hours
    return allSnapshots.filter(snapshot => 
      (now - snapshot.timestamp) <= TWENTY_FOUR_HOURS
    );
  },

  cleanOldSnapshots(address: string): void {
    const storageKey = `${STORAGE_PREFIX}${address}`;
    const recentSnapshots = this.getBalanceHistory(address);
    localStorage.setItem(storageKey, JSON.stringify(recentSnapshots));
  },

  getChartData(address: string): ChartDataPoint[] {
    const snapshots = this.getBalanceHistory(address);
    
    if (snapshots.length === 0) {
      return [{ time: '0h', value: 0 }];
    }
    
    // Convert snapshots to chart data format
    const now = Date.now();
    return snapshots.map(snapshot => {
      const hoursAgo = Math.floor((now - snapshot.timestamp) / (60 * 60 * 1000));
      return {
        time: `${hoursAgo}h ago`,
        value: snapshot.balance
      };
    }).reverse(); // Most recent last
  },

  getTrackingDuration(address: string): number {
    const snapshots = this.getBalanceHistory(address);
    
    if (snapshots.length < 2) return 0;
    
    const oldest = snapshots[0].timestamp;
    const newest = snapshots[snapshots.length - 1].timestamp;
    
    return Math.floor((newest - oldest) / (60 * 60 * 1000)); // Hours
  }
};
