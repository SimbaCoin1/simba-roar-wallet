import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';

const WALLET_STORAGE_KEY = 'simba_encrypted_wallet';
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

  // Encrypt and save wallet
  saveWallet: (mnemonic: string, address: string, password: string): void => {
    const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
    
    const walletData: EncryptedWallet = {
      encryptedMnemonic,
      address,
      createdAt: Date.now(),
    };
    
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
  },

  // Check if wallet exists
  hasWallet: (): boolean => {
    return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
  },

  // Get wallet address without unlocking
  getWalletAddress: (): string | null => {
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) return null;
    
    try {
      const wallet: EncryptedWallet = JSON.parse(data);
      return wallet.address;
    } catch {
      return null;
    }
  },

  // Unlock wallet with password
  unlockWallet: (password: string): UnlockedWallet => {
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) throw new Error('No wallet found');
    
    try {
      const wallet: EncryptedWallet = JSON.parse(data);
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

  // Delete wallet
  deleteWallet: (): void => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    if (lockTimer) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }
  },

  // Change password
  changePassword: (oldPassword: string, newPassword: string): void => {
    const wallet = walletManager.unlockWallet(oldPassword);
    walletManager.saveWallet(wallet.mnemonic, wallet.address, newPassword);
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
