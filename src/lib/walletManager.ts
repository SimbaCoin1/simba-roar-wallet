import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { StoredWallet, MultiWalletStorage } from '@/types/wallet';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

const WALLET_STORAGE_KEY = 'simba_encrypted_wallet';
const MULTI_WALLET_STORAGE_KEY = 'simba_wallets_array';
const STORAGE_VERSION = 1;
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface EncryptedWallet {
  encryptedMnemonic: string;
  address: string;
  createdAt: number;
}

export interface UnlockedWallet {
  address: string;
  mnemonic: string;
  privateKey: string;
}

let lockTimer: NodeJS.Timeout | null = null;

export const walletManager = {
  // Migrate old single wallet to new multi-wallet format
  migrateToMultiWallet: (): void => {
    const oldData = localStorage.getItem(WALLET_STORAGE_KEY);
    const newData = localStorage.getItem(MULTI_WALLET_STORAGE_KEY);
    
    // If multi-wallet already exists or old wallet doesn't exist, skip migration
    if (newData || !oldData) return;
    
    try {
      const oldWallet: EncryptedWallet = JSON.parse(oldData);
      const multiWalletData: MultiWalletStorage = {
        wallets: [{
          id: crypto.randomUUID(),
          name: 'Wallet 1',
          encryptedMnemonic: oldWallet.encryptedMnemonic,
          address: oldWallet.address,
          createdAt: oldWallet.createdAt,
          isActive: true,
        }],
        version: STORAGE_VERSION,
      };
      
      localStorage.setItem(MULTI_WALLET_STORAGE_KEY, JSON.stringify(multiWalletData));
      // Keep old wallet for backwards compatibility
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  // Get multi-wallet storage
  getMultiWalletStorage: (): MultiWalletStorage => {
    const data = localStorage.getItem(MULTI_WALLET_STORAGE_KEY);
    if (!data) {
      return { wallets: [], version: STORAGE_VERSION };
    }
    try {
      return JSON.parse(data);
    } catch {
      return { wallets: [], version: STORAGE_VERSION };
    }
  },

  // Save multi-wallet storage
  saveMultiWalletStorage: (storage: MultiWalletStorage): void => {
    localStorage.setItem(MULTI_WALLET_STORAGE_KEY, JSON.stringify(storage));
  },

  // Generate new wallet with mnemonic
  generateWallet: (): { mnemonic: string; address: string; privateKey: string } => {
    const mnemonic = bip39.generateMnemonic();
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    
    return {
      mnemonic,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },

  // Import wallet from mnemonic
  importFromMnemonic: (mnemonic: string): { address: string; privateKey: string } => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },

  // Import wallet from private key
  importFromPrivateKey: (privateKey: string): { address: string; mnemonic: null } => {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      mnemonic: null,
    };
  },

  // Add a new wallet to the array
  addWallet: (mnemonic: string, address: string, password: string, name?: string): string => {
    const storage = walletManager.getMultiWalletStorage();
    const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
    
    // Set all existing wallets to inactive
    storage.wallets.forEach(w => w.isActive = false);
    
    const walletId = crypto.randomUUID();
    const walletNumber = storage.wallets.length + 1;
    
    const newWallet: StoredWallet = {
      id: walletId,
      name: name || `Wallet ${walletNumber}`,
      encryptedMnemonic,
      address,
      createdAt: Date.now(),
      isActive: true,
    };
    
    storage.wallets.push(newWallet);
    walletManager.saveMultiWalletStorage(storage);
    
    return walletId;
  },

  // Get all wallets (without unlocking)
  getAllWallets: (): StoredWallet[] => {
    const storage = walletManager.getMultiWalletStorage();
    return storage.wallets;
  },

  // Get active wallet
  getActiveWallet: (): StoredWallet | null => {
    const storage = walletManager.getMultiWalletStorage();
    return storage.wallets.find(w => w.isActive) || storage.wallets[0] || null;
  },

  // Switch active wallet
  switchWallet: (walletId: string): void => {
    const storage = walletManager.getMultiWalletStorage();
    storage.wallets.forEach(w => {
      w.isActive = w.id === walletId;
    });
    walletManager.saveMultiWalletStorage(storage);
  },

  // Rename wallet
  renameWallet: (walletId: string, newName: string): void => {
    const storage = walletManager.getMultiWalletStorage();
    const wallet = storage.wallets.find(w => w.id === walletId);
    if (wallet) {
      wallet.name = newName;
      walletManager.saveMultiWalletStorage(storage);
    }
  },

  // Delete a specific wallet
  deleteWalletById: (walletId: string): void => {
    const storage = walletManager.getMultiWalletStorage();
    const index = storage.wallets.findIndex(w => w.id === walletId);
    
    if (index === -1) return;
    
    const wasActive = storage.wallets[index].isActive;
    storage.wallets.splice(index, 1);
    
    // If deleted wallet was active, activate the first remaining wallet
    if (wasActive && storage.wallets.length > 0) {
      storage.wallets[0].isActive = true;
    }
    
    walletManager.saveMultiWalletStorage(storage);
  },

  // Check if any wallet exists
  hasWallet: (): boolean => {
    walletManager.migrateToMultiWallet();
    const storage = walletManager.getMultiWalletStorage();
    return storage.wallets.length > 0;
  },

  // Get active wallet address without unlocking
  getWalletAddress: (): string | null => {
    const activeWallet = walletManager.getActiveWallet();
    return activeWallet?.address || null;
  },

  // Unlock a specific wallet with password
  unlockWallet: (password: string, walletId?: string): UnlockedWallet => {
    const storage = walletManager.getMultiWalletStorage();
    const wallet = walletId 
      ? storage.wallets.find(w => w.id === walletId)
      : walletManager.getActiveWallet();
    
    if (!wallet) throw new Error('No wallet found');
    
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(wallet.encryptedMnemonic, password);
      const mnemonic = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!mnemonic) throw new Error('Invalid password');
      
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      
      return {
        address: ethWallet.address,
        mnemonic,
        privateKey: ethWallet.privateKey,
      };
    } catch (error) {
      throw new Error('Invalid password');
    }
  },

  // Delete all wallets
  deleteWallet: (): void => {
    localStorage.removeItem(MULTI_WALLET_STORAGE_KEY);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    if (lockTimer) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }
  },

  // Change password for all wallets
  changePassword: (oldPassword: string, newPassword: string): void => {
    const storage = walletManager.getMultiWalletStorage();
    
    // Decrypt and re-encrypt all wallets
    const updatedWallets = storage.wallets.map(wallet => {
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(wallet.encryptedMnemonic, oldPassword);
        const mnemonic = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!mnemonic) throw new Error('Invalid password');
        
        const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, newPassword).toString();
        
        return {
          ...wallet,
          encryptedMnemonic,
        };
      } catch (error) {
        throw new Error('Invalid password');
      }
    });
    
    storage.wallets = updatedWallets;
    walletManager.saveMultiWalletStorage(storage);
  },

  // Start auto-lock timer
  startAutoLock: (onLock: () => void): void => {
    if (lockTimer) clearTimeout(lockTimer);
    
    lockTimer = setTimeout(() => {
      onLock();
    }, LOCK_TIMEOUT);
  },

  // Reset auto-lock timer
  resetAutoLock: (onLock: () => void): void => {
    walletManager.startAutoLock(onLock);
  },

  // Clear auto-lock timer
  clearAutoLock: (): void => {
    if (lockTimer) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }
  },
};
