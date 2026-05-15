// Avoid a hard dependency on @walletconnect/react-native-dapp so the app can
// run without native WalletConnect installed. We dynamically require the
// package and fall back to safe no-op implementations when unavailable.
// This file exports two helpers: `useWC()` (hook) and `useWCManager()`.

 
function makeFallbackConnector(): any {
  return {
    connected: false,
    // stable empty array to avoid identity changes
    accounts: Object.freeze([]),
    connect: async () => {
      throw new Error('WalletConnect not available');
    },
    killSession: async () => {},
  };
}

// Singleton fallback connector to preserve identity across renders
const FALLBACK_CONNECTOR = makeFallbackConnector();

export function useWC() {
  try {
     
    const wc = require('@walletconnect/react-native-dapp');
    if (wc && typeof wc.useWalletConnect === 'function') return wc.useWalletConnect();
  } catch (e) {
    // package not available — fall through to fallback
  }
  // Fallback must be a stable object to avoid hook errors in callers
  return FALLBACK_CONNECTOR;
}

export function useWCManager() {
  const connector = useWC();
  const connect = async () => {
    if (!connector) throw new Error('WalletConnect unavailable');
    if (!connector.connected) {
      if (typeof connector.connect === 'function') return connector.connect();
      throw new Error('WalletConnect connect not available');
    }
  };
  const disconnect = async () => {
    if (!connector) return;
    if (connector.connected && typeof connector.killSession === 'function') return connector.killSession();
  };
  return { connector, connect, disconnect } as const;
}

export default useWC;
