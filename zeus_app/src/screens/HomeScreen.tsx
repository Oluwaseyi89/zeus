import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useWalletStore, useAuthStore, useNotificationStore } from '@/services/stateStore';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const ThunderBolt = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#00D4FF" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#FFD700" strokeWidth="2" fill="none" />
    <Path d="M9 12L11 14L15 10" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { starknetAddress, bitcoinAddress } = useWalletStore();
  const { restoreToken } = useAuthStore();
  const { fetchInbox, inbox } = useNotificationStore();
  useEffect(() => {
    // restore auth and fetch notifications on mount
    restoreToken().catch(() => {});
    fetchInbox().catch(() => {});
  }, []);
  const unreadCount = (inbox || []).filter((i: any) => !i.read).length;
  const [isRevealed, setIsRevealed] = useState(false);

  const logoSource = require('../../assets/zeus_logo.png');
  const { width: imgW, height: imgH } = Image.resolveAssetSource(logoSource);
  const screenWidth = Dimensions.get('window').width;
  const logoWidth = Math.min(180, Math.round(screenWidth * 0.36));
  const logoHeight = Math.max(20, Math.round(logoWidth * (imgH / imgW)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.privacyBadge}>
              <ShieldIcon />
              <Text style={styles.privacyText}>Quantum-Safe • STARK Active</Text>
            </View>
            <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => navigation.navigate('WalletSettings')}>
              <Text style={{ color: '#00D4FF', fontWeight: '700' }}>Wallets</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ position: 'absolute', top: 24, right: 24 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
            <Text style={{ color: '#00D4FF', fontWeight: '700' }}>Inbox{unreadCount ? ` (${unreadCount})` : ''}</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card - Treasure Chest */}
        <TouchableOpacity 
          style={styles.balanceCard} 
          onPress={() => setIsRevealed(!isRevealed)}
          activeOpacity={0.9}
        >
          <Text style={styles.balanceLabel}>Private Vault Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceValue, !isRevealed && styles.blurred]}>
              {isRevealed ? '1.24 BTC' : '•••• BTC'}
            </Text>
            <Text style={[styles.balanceSubValue, !isRevealed && styles.blurred]}>
              {isRevealed ? '≈ 12,450.00 STRK' : '•••• STRK'}
            </Text>
          </View>
          <Text style={styles.revealHint}>{isRevealed ? 'Tap to conceal' : 'Tap to reveal vault'}</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.mainActionButton}
            onPress={() => navigation.navigate('Swap')}
          >
            <ThunderBolt />
            <Text style={styles.mainActionText}>THUNDER SWAP</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions - Ancient Parchments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sealed History</Text>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.txCard}>
              <View style={styles.txIcon}>
                <Text style={styles.runeText}>ᛉ</Text>
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txHash}>0x...{Math.random().toString(16).slice(2, 6)}</Text>
                <Text style={styles.txStatus}>Locked in HTLC</Text>
              </View>
              <Text style={styles.txAmount}>0.05 BTC</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
    fontFamily: 'serif', // Placeholder for custom serif font
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  privacyText: {
    color: '#00D4FF',
    fontSize: 10,
    marginLeft: 5,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#0B1120',
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: '#1E293B',
    marginBottom: 30,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceLabel: {
    color: '#A0A0B0',
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceRow: {
    marginBottom: 15,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceSubValue: {
    color: '#00D4FF',
    fontSize: 18,
    marginTop: 5,
  },
  blurred: {
    color: 'rgba(255,255,255,0.1)',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  revealHint: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    opacity: 0.7,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  mainActionButton: {
    backgroundColor: '#020617',
    height: 70,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00D4FF',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  mainActionText: {
    color: '#00D4FF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  txCard: {
    backgroundColor: 'rgba(48, 48, 77, 0.4)',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  runeText: {
    color: '#FFD700',
    fontSize: 20,
  },
  txDetails: {
    flex: 1,
  },
  txHash: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  txStatus: {
    color: '#A0A0B0',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
