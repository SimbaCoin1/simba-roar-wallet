import { ethers } from 'ethers';

const INFURA_URL = import.meta.env.VITE_INFURA_URL;
const SIMBACOIN_CONTRACT = '0x06d114e57e00789ea143685239f8e72611ff8cec';
const SIMBACOIN_DECIMALS = 6;

// Minimal ERC-20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(INFURA_URL);
    this.contract = new ethers.Contract(SIMBACOIN_CONTRACT, ERC20_ABI, this.provider);
  }

  // Get Simbacoin balance
  async getBalance(address: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, SIMBACOIN_DECIMALS));
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  // Get ETH balance for gas
  async getEthBalance(address: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return 0;
    }
  }

  // Get transaction history
  async getTransactionHistory(address: string): Promise<BlockchainTransaction[]> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks

      // Get Transfer events where user is sender or receiver
      const sentFilter = this.contract.filters.Transfer(address, null);
      const receivedFilter = this.contract.filters.Transfer(null, address);

      const [sentEvents, receivedEvents] = await Promise.all([
        this.contract.queryFilter(sentFilter, fromBlock, currentBlock),
        this.contract.queryFilter(receivedFilter, fromBlock, currentBlock),
      ]);

      const allEvents = [...sentEvents, ...receivedEvents];
      
      // Remove duplicates and sort by block number
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.transactionHash, event])).values()
      ).sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

      const transactions: BlockchainTransaction[] = await Promise.all(
        uniqueEvents.slice(0, 50).map(async (event) => {
          const block = await this.provider.getBlock(event.blockNumber || 0);
          const receipt = await this.provider.getTransactionReceipt(event.transactionHash);
          const parsedLog = this.contract.interface.parseLog({
            topics: [...event.topics],
            data: event.data
          });
          
          return {
            hash: event.transactionHash,
            from: parsedLog?.args[0] || '',
            to: parsedLog?.args[1] || '',
            value: ethers.formatUnits(parsedLog?.args[2] || 0, SIMBACOIN_DECIMALS),
            timestamp: (block?.timestamp || 0) * 1000,
            blockNumber: event.blockNumber || 0,
            status: receipt?.status === 1 ? 'confirmed' : 'failed',
          };
        })
      );

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Estimate gas for transfer
  async estimateGas(from: string, to: string, amount: string): Promise<{ gasLimit: bigint; gasPrice: bigint; gasCost: string }> {
    try {
      const amountWei = ethers.parseUnits(amount, SIMBACOIN_DECIMALS);
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      // Estimate gas (approximate for ERC-20 transfer)
      const gasLimit = BigInt(65000);
      const gasCost = ethers.formatEther(gasLimit * gasPrice);

      return {
        gasLimit,
        gasPrice,
        gasCost,
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  // Send Simbacoin
  async sendTransaction(
    privateKey: string,
    toAddress: string,
    amount: string
  ): Promise<{ hash: string; status: 'pending' }> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(SIMBACOIN_CONTRACT, ERC20_ABI, wallet);
      
      const amountWei = ethers.parseUnits(amount, SIMBACOIN_DECIMALS);
      
      const tx = await contract.transfer(toAddress, amountWei);
      
      return {
        hash: tx.hash,
        status: 'pending',
      };
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient ETH for gas fees');
      }
      throw new Error(error.message || 'Failed to send transaction');
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(hash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.waitForTransaction(hash);
      return receipt?.status === 1;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return false;
    }
  }

  // Validate Ethereum address
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  // Get Etherscan link
  getEtherscanLink(hash: string): string {
    return `https://etherscan.io/tx/${hash}`;
  }
}

export const blockchainService = new BlockchainService();
