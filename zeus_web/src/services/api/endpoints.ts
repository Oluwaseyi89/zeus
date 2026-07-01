export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    NONCE: '/auth/nonce',
    WALLET_LOGIN: '/auth/wallet-login',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // Wallet
  WALLET: {
    CONNECT: '/wallet/connect',
    SIGN: '/wallet/sign',
  },

  // Stellar
  STELLAR: {
    OPERATOR_PUBLIC_KEY: '/stellar/operator/public-key',
    RPC_STATUS: '/stellar/rpc/status',
    ESCROW_CREATE: '/stellar/escrow/create',
    VERIFY_PROOF: '/stellar/verify/proof',
    TX_SPENT: '/stellar/tx/spent',
    STATUS: '/stellar/status',
  },

  // Swap
  SWAP: {
    CREATE: '/swap',
    GET: '/swap/:id',
    ONCHAIN: '/swap/:id/onchain',
    FUND: '/swap/:id/fund',
    COMPLETE: '/swap/:id/complete',
    REFUND: '/swap/:id/refund',
    STELLAR_ESCROW: '/swap/:id/stellar-escrow',
    STELLAR_FUND: '/swap/:id/stellar-fund',
    STELLAR_COMPLETE: '/swap/:id/stellar-complete',
    STELLAR_VERIFY_PROOF: '/swap/stellar/verify-proof',
  },

  // Orderbook
  ORDERBOOK: {
    SUBMIT: '/orderbook/submit',
    QUERY: '/orderbook/query',
  },

  // ZK
  ZK: {
    GENERATE: '/zk/generate',
    VERIFY: '/zk/verify',
  },

  // Bitcoin
  BITCOIN: {
    VAULT_STATS: '/bitcoin/vault/:address/stats',
    VAULT_UTXO: '/bitcoin/vault/:address/utxo/:utxo',
    REQUEST_WITHDRAWAL: '/bitcoin/vault/:address/request-withdrawal',
  },

  // Starknet
  STARKNET: {
    PROXY: '/starknet/proxy',
  },

  // Notification
  NOTIFICATION: {
    SEND: '/notification/send',
    PUBLISH: '/notification/publish',
    INBOX: '/notification/inbox',
    MARK_READ: '/notification/:id/read',
    METRICS: '/notification/metrics',
    METRICS_ID: '/notification/metrics/:id',
  },

  // API
  API: {
    HEALTH: '/api/health',
  },
} as const;

export type APIEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];