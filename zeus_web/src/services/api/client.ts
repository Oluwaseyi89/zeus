import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useStore } from '../../store';

// API Response wrapper
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from store or localStorage
        const token = this.getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add API key if needed
        const apiKey = process.env.NEXT_PUBLIC_API_KEY;
        if (apiKey) {
          config.headers['x-api-key'] = apiKey;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const newToken = await this.refreshToken();
            if (newToken) {
              this.setToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout
            this.handleLogout();
          }
        }

        // Handle other errors
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private getToken(): string | null {
    // Check store first
    const token = useStore.getState().token;
    if (token) return token;

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zeus_token');
    }

    return null;
  }

  private setToken(token: string): void {
    useStore.getState().setToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zeus_token', token);
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Implement token refresh logic
    // This depends on your backend implementation
    try {
      const refreshToken = localStorage.getItem('zeus_refresh_token');
      if (!refreshToken) return null;

      const response = await this.client.post('/auth/refresh', {
        refreshToken,
      });

      return response.data.token;
    } catch (error) {
      return null;
    }
  }

  private handleLogout(): void {
    useStore.getState().logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zeus_token');
      localStorage.removeItem('zeus_refresh_token');
    }
  }

  private normalizeError(error: any): any {
    if (error.response) {
      // The request was made and the server responded with a status code
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.response.data?.message || error.response.data?.error || 'An error occurred',
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        message: 'No response from server. Please check your network connection.',
        status: 0,
      };
    } else {
      // Something happened in setting up the request
      return {
        message: error.message || 'Request failed',
        status: -1,
      };
    }
  }

  // Public methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Upload file
  public async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  // Set auth token manually
  public setAuthToken(token: string): void {
    this.setToken(token);
  }

  // Clear auth
  public clearAuth(): void {
    this.handleLogout();
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Export individual methods for convenience
export const { get, post, put, patch, delete: del, upload, setAuthToken, clearAuth } = apiClient;