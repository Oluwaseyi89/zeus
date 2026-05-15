import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions , Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import WalletConnect from '@/components/WalletConnect';
import { useWalletStore, useAuthStore } from '@/services/stateStore';
import api from '@/services/apiClient';
import { signWithArgent, signWithXverse, signWithWalletConnect } from '@/services/walletAuth';

const LandingScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  const { setStarknetAddress, setBitcoinAddress } = useWalletStore();
  const { token, walletLogin } = useAuthStore();

  const handleConnectAndSet = async (type: 'Starknet' | 'Bitcoin', connector?: any) => {
    setLoading(true);
    let address = type === 'Starknet' ? 'stark:0x' + Math.random().toString(16).slice(2, 12) : 'btc:' + Math.random().toString(16).slice(2, 12);
    if (connector && connector.connected && connector.accounts && connector.accounts[0]) {
      // prefer connector-provided address when available
      address = connector.accounts[0];
    }
    try {
      const nonceRes = await api.post('/auth/nonce', { address });
      const nonce = nonceRes?.data?.nonce || nonceRes?.data || null;
      let sigRes: any = null;
      // Prefer WalletConnect session if available
      if (connector && connector.connected) {
        sigRes = await signWithWalletConnect(connector, type, address, nonce);
      }

      if (!sigRes) {
        if (type === 'Starknet') sigRes = await signWithArgent(address, nonce);
        else sigRes = await signWithXverse(address, nonce);
      }
      const signature = sigRes?.signature;
      const publicKey = sigRes?.publicKey;
      if (signature && walletLogin) {
        await walletLogin({ address, signature, publicKey });
      }
    } catch (e: any) {
      // surface error to user
      try { Alert.alert('Wallet connect failed', String(e?.message || e)); } catch {}
    } finally {
      setLoading(false);
    }

    if (type === 'Starknet') setStarknetAddress(address);
    else setBitcoinAddress(address);
    navigation.navigate('Home');
  };

  // direct sats-connect flow for Xverse (optional, RN friendly)
  const handleSatsConnect = async () => {
    const address = 'btc:' + Math.random().toString(16).slice(2, 12);
    setLoading(true);
    try {
      const nonceRes = await api.post('/auth/nonce', { address });
      const nonce = nonceRes?.data?.nonce || nonceRes?.data || null;
      // dynamic require so package is optional
       
      const sats = require('sats-connect');
      let sig: any = null;
      if (sats && typeof sats.requestSignature === 'function') {
        const res = await sats.requestSignature({ address, message: nonce });
        sig = res?.signature || res;
      } else if (sats && typeof sats.signMessage === 'function') {
        const res = await sats.signMessage(nonce, { address });
        sig = res?.signature || res;
      }
      if (sig && walletLogin) {
        await walletLogin({ address, signature: sig });
      }
      setBitcoinAddress(address);
      navigation.navigate('Home');
    } catch (e: any) {
      try { Alert.alert('Xverse sign failed', String(e?.message || e)); } catch {}
      setBitcoinAddress(address);
      navigation.navigate('Home');
    } finally {
      setLoading(false);
    }
  };

  const logoSource = require('../../assets/zeus_logo.png');
  const { width: imgW, height: imgH } = Image.resolveAssetSource(logoSource);
  const screenWidth = Dimensions.get('window').width;
  const logoWidth = Math.min(220, Math.round(screenWidth * 0.5));
  const logoHeight = Math.max(24, Math.round(logoWidth * (imgH / imgW)));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={logoSource} style={[styles.logoImage, { width: logoWidth, height: logoHeight }]} resizeMode="contain" />
        <Text style={styles.tagline}>Private BTC ↔ STRK swaps on Starknet</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connect Wallet</Text>
          <WalletConnect type="Starknet" onConnect={(c?: any) => handleConnectAndSet('Starknet', c)} />
          <WalletConnect type="Bitcoin" onConnect={(c?: any) => handleConnectAndSet('Bitcoin', c)} />
          <TouchableOpacity style={[styles.card, { marginTop: 8 }]} onPress={handleSatsConnect}>
            <Text style={{ color: '#00D4FF', fontWeight: '700' }}>Connect via Xverse (sats-connect)</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 12,
  },
  logoImage: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  tagline: {
    color: '#A0A0B0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#0B1120',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default LandingScreen;

