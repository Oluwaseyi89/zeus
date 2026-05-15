import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Platform } from 'react-native';
import WCSessionManager from '@/services/WCSessionManager';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from '@/navigation/AppNavigator';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  // Load WalletConnectProvider optionally so bundlers don't fail when the package
  // is not installed (it's listed as an optionalDependency).
  // If it's unavailable we render a trivial passthrough provider.
   
  let WalletConnectProvider: any = ({ children }: { children: any }) => <>{children}</>;
  try {
    // dynamic require avoids Metro trying to resolve the package at bundle time
    // when it's not installed.
     
    const wc = require('@walletconnect/react-native-dapp');
    if (wc && wc.WalletConnectProvider) WalletConnectProvider = wc.WalletConnectProvider;
  } catch (e) {
    // package not installed — continue with passthrough provider
  }

  const redirectUrl = Platform.OS === 'web'
    ? ((globalThis as { location?: { origin?: string } }).location?.origin ?? '')
    : 'zeusapp://';

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <WalletConnectProvider
          redirectUrl={redirectUrl}
          storageOptions={{}}
        >
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
          <WCSessionManager />
        </WalletConnectProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
