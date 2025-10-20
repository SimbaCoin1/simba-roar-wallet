import { ethers } from 'ethers';

// Multiple RPC endpoints for fallback reliability
const RPC_URLS = [
  'https://cloudflare-eth.com',
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
  'https://eth.llamarpc.com',
];

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
  private currentRpcIndex = 0;

  constructor() {
    this.provider = this.createProvider();
    this.contract = new ethers.Contract(SIMBACOIN_CONTRACT, ERC20_ABI, this.provider);
  }

  private createProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(RPC_URLS[this.currentRpcIndex]);
  }

  private async switchToNextProvider(): Promise<boolean> {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % RPC_URLS.length;
    this.provider = this.createProvider();
    this.contract = new ethers.Contract(SIMBACOIN_CONTRACT, ERC20_ABI, this.provider);
    return this.currentRpcIndex !== 0; // false if we've cycled through all
  }

  private async retryWithFallback<T>(
    operation: () => Promise<T>,
    maxRetries = RPC_URLS.length
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`RPC error with ${RPC_URLS[this.currentRpcIndex]}:`, error.message);
        lastError = error;
        
        if (i < maxRetries - 1) {
          await this.switchToNextProvider();
          console.log(`Switching to fallback RPC: ${RPC_URLS[this.currentRpcIndex]}`);
        }
      }
    }
    
    throw new Error(`All RPC providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Get Simbacoin balance
  async getBalance(address: string): Promise<number> {
    return this.retryWithFallback(async () => {
      const balance = await this.contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, SIMBACOIN_DECIMALS));
    });
  }

  // Get ETH balance for gas
  async getEthBalance(address: string): Promise<number> {
    try {
      return await this.retryWithFallback(async () => {
        const balance = await this.provider.getBalance(address);
        return parseFloat(ethers.formatEther(balance));
      });
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return 0;
    }
  }

  // Get transaction history
  async getTransactionHistory(address: string): Promise<BlockchainTransaction[]> {
    try {
      return await this.retryWithFallback(async () => {
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
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Estimate gas for transfer
  async estimateGas(from: string, to: string, amount: string): Promise<{ gasLimit: bigint; gasPrice: bigint; gasCost: string }> {
    return this.retryWithFallback(async () => {
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
    });
  }

  // Send Simbacoin
  async sendTransaction(
    privateKey: string,
    toAddress: string,
    amount: string
  ): Promise<{ hash: string; status: 'pending' }> {
    return this.retryWithFallback(async () => {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(SIMBACOIN_CONTRACT, ERC20_ABI, wallet);
      
      const amountWei = ethers.parseUnits(amount, SIMBACOIN_DECIMALS);
      
      const tx = await contract.transfer(toAddress, amountWei);
      
      return {
        hash: tx.hash,
        status: 'pending',
      };
    });
  }

  // Wait for transaction confirmation
  async waitForTransaction(hash: string): Promise<boolean> {
    try {
      return await this.retryWithFallback(async () => {
        const receipt = await this.provider.waitForTransaction(hash);
        return receipt?.status === 1;
      });
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
