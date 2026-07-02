export interface StorageItem {
  key: string;
  value: any;
  expires?: Date;
}

export interface SecureStorageOptions {
  prefix?: string;
  encryptionKey?: string;
}

export class SecureStorageService {
  private prefix: string;
  private encryptionKey?: string;

  constructor(options: SecureStorageOptions = {}) {
    this.prefix = options.prefix || 'zeus_';
    this.encryptionKey = options.encryptionKey;
  }

  /**
   * Set an item in storage
   */
  setItem<T>(key: string, value: T, expiresIn?: number): void {
    const fullKey = this.prefix + key;
    const item: StorageItem = {
      key: fullKey,
      value: this.encryptionKey ? this.encrypt(value) : value,
      expires: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  /**
   * Get an item from storage
   */
  getItem<T>(key: string): T | null {
    const fullKey = this.prefix + key;
    
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      const item: StorageItem = JSON.parse(raw);
      
      // Check if expired
      if (item.expires && new Date(item.expires) < new Date()) {
        localStorage.removeItem(fullKey);
        return null;
      }

      const value = this.encryptionKey ? this.decrypt(item.value) : item.value;
      return value as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    const fullKey = this.prefix + key;
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  /**
   * Clear all items with this prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * Get all keys with this prefix
   */
  getKeys(): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }
    } catch (error) {
      console.error('Storage get keys error:', error);
    }
    return keys;
  }

  /**
   * Simple encryption (base64) - in production, use proper encryption
   */
  private encrypt<T>(value: T): string {
    try {
      const json = JSON.stringify(value);
      // Simple base64 encoding (not secure, just for obfuscation)
      return btoa(encodeURIComponent(json));
    } catch (error) {
      console.error('Encryption error:', error);
      return String(value);
    }
  }

  /**
   * Simple decryption
   */
  private decrypt<T>(value: string): T {
    try {
      const decoded = decodeURIComponent(atob(value));
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.error('Decryption error:', error);
      return value as T;
    }
  }
}

// Singleton instance
export const storageService = new SecureStorageService({
  prefix: 'zeus_',
});

// JWT token specific helpers
export const tokenStorage = {
  getToken: (): string | null => {
    return storageService.getItem<string>('token');
  },

  setToken: (token: string): void => {
    storageService.setItem('token', token);
  },

  removeToken: (): void => {
    storageService.removeItem('token');
  },

  getRefreshToken: (): string | null => {
    return storageService.getItem<string>('refresh_token');
  },

  setRefreshToken: (token: string): void => {
    storageService.setItem('refresh_token', token);
  },

  removeRefreshToken: (): void => {
    storageService.removeItem('refresh_token');
  },

  getUser: (): any => {
    return storageService.getItem('user');
  },

  setUser: (user: any): void => {
    storageService.setItem('user', user);
  },

  removeUser: (): void => {
    storageService.removeItem('user');
  },

  clearAll: (): void => {
    storageService.clear();
  },
};

// Session management
export const sessionService = {
  getSession: (): any => {
    return storageService.getItem('session');
  },

  setSession: (session: any): void => {
    storageService.setItem('session', session, 24 * 60 * 60 * 1000); // 24 hours
  },

  clearSession: (): void => {
    storageService.removeItem('session');
  },

  isValid: (): boolean => {
    const session = storageService.getItem('session');
    return !!session;
  },
};