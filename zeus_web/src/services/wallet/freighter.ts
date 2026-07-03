import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  getNetworkDetails,
  signTransaction,
  signMessage,
  signAuthEntry,
  isAllowed,
  setAllowed,
  WatchWalletChanges,
} from '@stellar/freighter-api';

export interface FreighterWalletInfo {
  address: string;
  balance: string;
  publicKey: string;
  network?: string;
  networkPassphrase?: string;
}

export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const freighterService = {
  /**
   * Check if Freighter is installed
   * Uses isConnected() from the official API
   */
  isInstalled: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
      const result = await isConnected();
      return result.isConnected === true;
    } catch {
      // Fallback: check window object
      return !!(window.freighter || window.stellar?.freighter);
    }
  },

  /**
   * Check if app is authorized
   */
  isAllowed: async (): Promise<boolean> => {
    try {
      const result = await isAllowed();
      return result.isAllowed === true;
    } catch {
      return false;
    }
  },

  /**
   * Request access and get public key
   * This is the recommended connection flow per Freighter docs
   */
  connect: async (): Promise<FreighterWalletInfo> => {
    // Step 1: Check if Freighter is installed
    const installed = await freighterService.isInstalled();
    if (!installed) {
      throw new Error('Freighter wallet is not installed. Please install the Freighter extension.');
    }

    try {
      // Step 2: Request access (combines authorization + public key)
      const accessResult = await requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error.message || 'Access denied');
      }

      if (!accessResult.address) {
        throw new Error('No public key returned');
      }

      // Step 3: Get network info
      let network = 'testnet';
      let networkPassphrase = STELLAR_NETWORK_PASSPHRASE;
      try {
        const networkDetails = await getNetworkDetails();
        if (!networkDetails.error) {
          network = networkDetails.network?.toLowerCase() || 'testnet';
          networkPassphrase = networkDetails.networkPassphrase || STELLAR_NETWORK_PASSPHRASE;
        }
      } catch (networkError) {
        console.warn('Could not fetch network:', networkError);
      }

      return {
        address: accessResult.address,
        balance: '0', // Balance must be fetched separately via Stellar SDK
        publicKey: accessResult.address,
        network,
        networkPassphrase,
      };
    } catch (error: any) {
      console.error('Freighter connection error:', error);
      throw new Error(error.message || 'Failed to connect to Freighter wallet');
    }
  },

  /**
   * Get public key without prompting
   * Returns empty string if not authorized
   */
  getPublicKey: async (): Promise<string> => {
    try {
      const result = await getAddress();
      if (result.error) {
        console.warn('getAddress error:', result.error.message);
        return '';
      }
      return result.address || '';
    } catch {
      return '';
    }
  },

  /**
   * Sign a message using signMessage (SEP-53)
   */
  signMessage: async (address: string, message: string): Promise<string> => {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error('Freighter wallet is not installed');
      }

      const result = await signMessage(message, { address });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign message');
      }

      if (!result.signedMessage) {
        throw new Error('No signature returned');
      }

      return result.signedMessage as string;
    } catch (error: any) {
      console.error('Freighter sign message error:', error);
      throw new Error(error.message || 'Failed to sign message with Freighter');
    }
  },

  /**
   * Sign a transaction using signTransaction
   */
  signTransaction: async (txXdr: string, networkPassphrase?: string): Promise<string> => {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error('Freighter wallet is not installed');
      }

      const result = await signTransaction(txXdr, {
        networkPassphrase: networkPassphrase || STELLAR_NETWORK_PASSPHRASE,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign transaction');
      }

      if (!result.signedTxXdr) {
        throw new Error('No signed transaction returned');
      }

      return result.signedTxXdr;
    } catch (error: any) {
      console.error('Freighter sign transaction error:', error);
      throw new Error(error.message || 'Failed to sign transaction with Freighter');
    }
  },

  /**
   * Sign an auth entry (for Soroban)
   */
  signAuthEntry: async (entryXdr: string, address: string): Promise<string> => {
    try {
      const installed = await freighterService.isInstalled();
      if (!installed) {
        throw new Error('Freighter wallet is not installed');
      }

      const result = await signAuthEntry(entryXdr, { address });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign auth entry');
      }

      if (!result.signedAuthEntry) {
        throw new Error('No signed auth entry returned');
      }

      return result.signedAuthEntry;
    } catch (error: any) {
      console.error('Freighter sign auth entry error:', error);
      throw new Error(error.message || 'Failed to sign auth entry with Freighter');
    }
  },

  /**
   * Get network details
   */
  getNetwork: async (): Promise<{ network: string; networkPassphrase: string }> => {
    try {
      const details = await getNetworkDetails();
      if (details.error) {
        return {
          network: 'testnet',
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        };
      }
      return {
        network: details.network?.toLowerCase() || 'testnet',
        networkPassphrase: details.networkPassphrase || STELLAR_NETWORK_PASSPHRASE,
      };
    } catch {
      return {
        network: 'testnet',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      };
    }
  },

  /**
   * Set allowed (authorize app)
   */
  setAllowed: async (): Promise<boolean> => {
    try {
      const result = await setAllowed();
      return result.isAllowed === true;
    } catch {
      return false;
    }
  },

  /**
   * Watch for wallet changes (address, network)
   */
  watchChanges: (callback: (changes: { address: string; network: string; networkPassphrase: string }) => void): WatchWalletChanges => {
    const watcher = new WatchWalletChanges(2000);
    watcher.watch(callback);
    return watcher;
  },

  disconnect: (): void => {
    console.log('Disconnected from Freighter');
  },
};
