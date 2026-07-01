export interface User {
  id: string;
  email?: string;
  username?: string;
  walletAddress?: string;
  blockchain?: 'stellar' | 'bitcoin' | 'starknet';
  createdAt?: string;
}

export interface Wallet {
  address: string;
  blockchain: 'stellar' | 'bitcoin' | 'starknet';
  balance?: string | number;
  publicKey?: string;
  connected: boolean;
  type: 'freighter' | 'unisat' | 'starknet' | 'other';
}

export interface ZKProof {
  id: string;
  proof: any;
  publicSignals: any;
  journalBytes?: string;
  seal?: string;
  imageId?: string;
  status: 'generating' | 'generated' | 'verifying' | 'verified' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}

export interface SwapOrder {
  id: string;
  swapId: string;
  initiator: string;
  counterparty?: string;
  amount: number;
  asset: string;
  blockchain: string;
  status: 'pending' | 'funded' | 'completed' | 'refunded' | 'expired';
  escrowAddress?: string;
  createdAt: Date;
  expiresAt?: Date;
  secret?: string;
}

export interface OrderBookEntry {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  asset: string;
  total: number;
  userId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  channel: string;
  to: string;
  payload: any;
  read: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}


















// export interface User {
//   id: string;
//   email?: string;
//   username?: string;
//   walletAddress?: string;
//   blockchain?: 'stellar' | 'bitcoin' | 'starknet';
//   createdAt?: string;
// }

// export interface Wallet {
//   address: string;
//   blockchain: 'stellar' | 'bitcoin' | 'starknet';
//   balance?: string | number;
//   publicKey?: string;
//   connected: boolean;
//   type: 'freighter' | 'unisat' | 'starknet' | 'other';
// }

// export interface ZKProof {
//   id: string;
//   proof: any;
//   publicSignals: any;
//   journalBytes?: string;
//   seal?: string;
//   imageId?: string;
//   status: 'generating' | 'generated' | 'verifying' | 'verified' | 'failed';
//   createdAt: Date;
//   verifiedAt?: Date;
// }

// export interface SwapOrder {
//   id: string;
//   swapId: string;
//   initiator: string;
//   counterparty?: string;
//   amount: number;
//   asset: string;
//   blockchain: string;
//   status: 'pending' | 'funded' | 'completed' | 'refunded' | 'expired';
//   escrowAddress?: string;
//   createdAt: Date;
//   expiresAt?: Date;
//   secret?: string;
// }

// export interface OrderBookEntry {
//   id: string;
//   type: 'buy' | 'sell';
//   price: number;
//   amount: number;
//   asset: string;
//   total: number;
//   userId: string;
//   createdAt: Date;
// }

// export interface Notification {
//   id: string;
//   channel: string;
//   to: string;
//   payload: any;
//   read: boolean;
//   createdAt: Date;
// }

// export interface ApiResponse<T = any> {
//   success?: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }