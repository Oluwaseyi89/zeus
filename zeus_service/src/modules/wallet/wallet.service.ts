import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  /**
   * Connect to a wallet provider
   * For hackathon demo, this validates the wallet address format
   */
  async connect(
    provider: string,
    opts: any = {},
  ): Promise<{
    connected: boolean;
    provider: string;
    address?: string;
    network?: string;
  }> {
    this.logger.debug(`Connecting to ${provider}`);

    const address = opts.address || opts.publicKey;

    // Validate address format based on provider
    if (address) {
      const isValid = this.validateAddress(address, provider);
      if (!isValid) {
        throw new UnauthorizedException(`Invalid ${provider} address format`);
      }
    }

    const network = this.getNetwork(provider);

    return {
      connected: true,
      provider,
      address: address || undefined,
      network,
    };
  }

  /**
   * Sign a message with the wallet
   */
  async signMessage(
    address: string,
    message: string,
  ): Promise<{
    signature: string;
    address: string;
  }> {
    this.logger.debug(`Signing message for ${address}`);

    // For hackathon demo: generate a deterministic signature
    // In production, this would call the wallet's sign method
    const signature = `sig_${address.slice(0, 8)}_${Buffer.from(message).toString('base64').slice(0, 20)}`;

    return {
      signature,
      address,
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(
    address: string,
    blockchain: string = 'stellar',
  ): Promise<{
    address: string;
    blockchain: string;
    balance: string;
    token: string;
  }> {
    this.logger.debug(`Getting balance for ${address} on ${blockchain}`);

    // Return mock balance for hackathon demo
    // In production, this would query the blockchain
    const mockBalances: Record<string, string> = {
      stellar: '100.50',
      bitcoin: '0.025',
      starknet: '500.75',
    };

    return {
      address,
      blockchain,
      balance: mockBalances[blockchain] || '0.00',
      token:
        blockchain === 'stellar'
          ? 'XLM'
          : blockchain === 'bitcoin'
            ? 'BTC'
            : 'STRK',
    };
  }

  /**
   * Disconnect wallet
   */
  async disconnect(
    address: string,
  ): Promise<{ success: boolean; address: string }> {
    this.logger.debug(`Disconnecting ${address}`);
    return {
      success: true,
      address,
    };
  }

  /**
   * Get available wallet providers
   */
  async getAvailableProviders(): Promise<string[]> {
    return ['freighter', 'unisat', 'argent', 'braavos', 'walletconnect'];
  }

  /**
   * Check if wallet is connected
   */
  async isConnected(address: string, provider: string): Promise<boolean> {
    this.logger.debug(`Checking connection for ${address} on ${provider}`);
    // For hackathon demo, assume connected if address is provided
    return !!address && address.length > 10;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    address: string,
    blockchain: string = 'stellar',
  ): Promise<
    Array<{ txHash: string; amount: string; timestamp: string; type: string }>
  > {
    this.logger.debug(`Getting history for ${address} on ${blockchain}`);

    // Return mock history for hackathon demo
    return [
      {
        txHash: `0x${'abcdef1234567890'.repeat(4)}`,
        amount: '10.50',
        timestamp: new Date().toISOString(),
        type: 'received',
      },
      {
        txHash: `0x${'fedcba0987654321'.repeat(4)}`,
        amount: '5.25',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'sent',
      },
    ];
  }

  /**
   * Validate wallet address format
   */
  private validateAddress(address: string, provider: string): boolean {
    // Stellar: G... (56 chars)
    if (provider === 'freighter' || provider === 'stellar') {
      return /^G[A-Z2-7]{55}$/.test(address);
    }
    // Bitcoin: 1, 3, or bc1...
    if (provider === 'unisat' || provider === 'bitcoin') {
      return /^(1|3|bc1)[A-Za-z0-9]{25,62}$/.test(address);
    }
    // Starknet: 0x... (hex)
    if (
      provider === 'argent' ||
      provider === 'braavos' ||
      provider === 'starknet'
    ) {
      return /^0x[a-fA-F0-9]{40,64}$/.test(address);
    }
    return true;
  }

  /**
   * Get network for provider
   */
  private getNetwork(provider: string): string {
    const networkMap: Record<string, string> = {
      freighter: 'Testnet',
      unisat: 'Testnet',
      argent: 'Testnet',
      braavos: 'Testnet',
      walletconnect: 'Mainnet',
    };
    return networkMap[provider] || 'Testnet';
  }
}
