export interface FreighterWallet {
  address: string;
  balance: string;
  publicKey: string;
}

export const freighterService = {
  connect: async (): Promise<FreighterWallet> => {
    // Check if Freighter is installed
    if (typeof window === 'undefined' || !window.freighter) {
      throw new Error('Freighter wallet is not installed. Please install the Freighter extension.');
    }

    try {
      // Request connection
      const response = await window.freighter.connect();
      
      if (!response || !response.address) {
        throw new Error('Failed to connect to Freighter wallet');
      }

      // Get balance
      let balance = '0';
      try {
        const balanceResponse = await window.freighter.getBalance(response.address);
        balance = balanceResponse.balance || '0';
      } catch (balanceError) {
        console.warn('Could not fetch balance:', balanceError);
      }

      // Get public key
      let publicKey = '';
      try {
        publicKey = await window.freighter.getPublicKey();
      } catch (pubKeyError) {
        console.warn('Could not fetch public key:', pubKeyError);
      }

      return {
        address: response.address,
        balance,
        publicKey: publicKey || response.publicKey || '',
      };
    } catch (error: any) {
      console.error('Freighter connection error:', error);
      throw new Error(error.message || 'Failed to connect to Freighter wallet');
    }
  },

  signMessage: async (address: string, message: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.freighter) {
      throw new Error('Freighter wallet is not installed');
    }

    try {
      const signature = await window.freighter.signMessage(address, message);
      return signature;
    } catch (error: any) {
      console.error('Freighter sign message error:', error);
      throw new Error(error.message || 'Failed to sign message with Freighter');
    }
  },

  getBalance: async (address: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.freighter) {
      throw new Error('Freighter wallet is not installed');
    }

    try {
      const response = await window.freighter.getBalance(address);
      return response.balance || '0';
    } catch (error: any) {
      console.error('Freighter get balance error:', error);
      throw new Error(error.message || 'Failed to get balance from Freighter');
    }
  },

  disconnect: (): void => {
    // Freighter doesn't have a built-in disconnect method
    // Just clear local state
    console.log('Disconnected from Freighter');
  },

  isInstalled: (): boolean => {
    return typeof window !== 'undefined' && !!window.freighter;
  },
};

// Type declarations for Freighter
declare global {
  interface Window {
    freighter?: {
      connect: () => Promise<{ address: string; publicKey?: string }>;
      getBalance: (address: string) => Promise<{ balance: string }>;
      getPublicKey: () => Promise<string>;
      signMessage: (address: string, message: string) => Promise<string>;
    };
  }
}