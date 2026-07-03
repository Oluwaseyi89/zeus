export interface FreighterWallet {
  connect: () => Promise<{ address: string; publicKey?: string }>;
  getBalance: (address: string) => Promise<{ balance: string }>;
  getPublicKey: () => Promise<string>;
  signMessage: (address: string, message: string) => Promise<string>;
}

export interface UniSatWallet {
  requestAccounts: () => Promise<string[]>;
  getBalance: (address?: string) => Promise<{ 
    total: string; 
    confirmed?: string; 
    unconfirmed?: string 
  }>;
  getPublicKey: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  sendBitcoin?: (toAddress: string, amount: number) => Promise<string>;
  getUtxos?: () => Promise<any[]>;
}

declare global {
  interface Window {
    freighter?: FreighterWallet;
    unisat?: UniSatWallet;
    stellar?: {
      freighter?: FreighterWallet;
      platform?: 'mobile' | 'extension';
    };
    __FREIGHTER__?: FreighterWallet;
    freighterWallet?: FreighterWallet;
  }
}

export {};
