export interface UniSatWallet {
  address: string;
  balance: string;
  publicKey: string;
  utxos?: any[];
}

export const unisatService = {
  connect: async (): Promise<UniSatWallet> => {
    // Check if UniSat is installed
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('UniSat wallet is not installed. Please install the UniSat extension.');
    }

    try {
      // Request accounts (connection)
      const accounts = await window.unisat.requestAccounts();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in UniSat wallet');
      }

      const address = accounts[0];

      // Get balance
      let balance = '0';
      try {
        const balanceResponse = await window.unisat.getBalance();
        balance = balanceResponse.total || '0';
      } catch (balanceError) {
        console.warn('Could not fetch balance:', balanceError);
      }

      // Get public key
      let publicKey = '';
      try {
        publicKey = await window.unisat.getPublicKey();
      } catch (pubKeyError) {
        console.warn('Could not fetch public key:', pubKeyError);
      }

      // Get UTXOs
      let utxos = [];
      try {
        utxos = await window.unisat.getUtxos();
      } catch (utxoError) {
        console.warn('Could not fetch UTXOs:', utxoError);
      }

      return {
        address,
        balance,
        publicKey: publicKey || '',
        utxos,
      };
    } catch (error: any) {
      console.error('UniSat connection error:', error);
      throw new Error(error.message || 'Failed to connect to UniSat wallet');
    }
  },

  signMessage: async (message: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('UniSat wallet is not installed');
    }

    try {
      const signature = await window.unisat.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('UniSat sign message error:', error);
      throw new Error(error.message || 'Failed to sign message with UniSat');
    }
  },

  getBalance: async (address?: string): Promise<string> => {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('UniSat wallet is not installed');
    }

    try {
      const balance = await window.unisat.getBalance(address);
      return balance.total || '0';
    } catch (error: any) {
      console.error('UniSat get balance error:', error);
      throw new Error(error.message || 'Failed to get balance from UniSat');
    }
  },

  sendBitcoin: async (toAddress: string, amount: number): Promise<string> => {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('UniSat wallet is not installed');
    }

    try {
      const txid = await window.unisat.sendBitcoin(toAddress, amount);
      return txid;
    } catch (error: any) {
      console.error('UniSat send bitcoin error:', error);
      throw new Error(error.message || 'Failed to send Bitcoin with UniSat');
    }
  },

  getUtxos: async (): Promise<any[]> => {
    if (typeof window === 'undefined' || !window.unisat) {
      throw new Error('UniSat wallet is not installed');
    }

    try {
      const utxos = await window.unisat.getUtxos();
      return utxos;
    } catch (error: any) {
      console.error('UniSat get UTXOs error:', error);
      throw new Error(error.message || 'Failed to get UTXOs from UniSat');
    }
  },

  disconnect: (): void => {
    // UniSat doesn't have a built-in disconnect method
    console.log('Disconnected from UniSat');
  },

  isInstalled: (): boolean => {
    return typeof window !== 'undefined' && !!window.unisat;
  },
};

// Type declarations for UniSat
declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getBalance: (address?: string) => Promise<{ total: string; confirmed?: string; unconfirmed?: string }>;
      getPublicKey: () => Promise<string>;
      signMessage: (message: string) => Promise<string>;
      sendBitcoin: (toAddress: string, amount: number) => Promise<string>;
      getUtxos: () => Promise<any[]>;
    };
  }
}