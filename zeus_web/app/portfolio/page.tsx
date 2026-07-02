'use client';

import { useState, useEffect } from 'react';
import { useAuth, useWallet } from '../../src/store';
import { useRouter } from 'next/navigation';

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'stake';
  asset: string;
  amount: string;
  value: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  address: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { wallets, activeWallet } = useWallet();
  const [selectedTab, setSelectedTab] = useState<'assets' | 'transactions'>('assets');
  const [isLoading, setIsLoading] = useState(false);

  // Mock assets data - would come from /api/wallet/balance or /stellar/balance
  const assets: Asset[] = [
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.0245', value: '$1,245.00', change: 2.4, icon: '₿', color: '#F7931A' },
    { symbol: 'XLM', name: 'Stellar', balance: '12,450.00', value: '$1,245.00', change: -0.8, icon: '★', color: '#00D4FF' },
    { symbol: 'USDC', name: 'USD Coin', balance: '500.00', value: '$500.00', change: 0.0, icon: '●', color: '#2775CA' },
    { symbol: 'STRK', name: 'Starknet', balance: '250.00', value: '$125.00', change: 5.2, icon: '⚡', color: '#FFD700' },
  ];

  // Mock transactions - would come from /api/stellar/transactions/:accountId
  const transactions: Transaction[] = [
    { id: '1', type: 'receive', asset: 'BTC', amount: '+0.012', value: '+$600.00', timestamp: new Date(), status: 'completed', address: '0x7f3a...b9e1' },
    { id: '2', type: 'swap', asset: 'XLM', amount: '+5,000', value: '+$500.00', timestamp: new Date(Date.now() - 3600000), status: 'completed', address: 'Swap #123' },
    { id: '3', type: 'send', asset: 'USDC', amount: '-200.00', value: '-$200.00', timestamp: new Date(Date.now() - 7200000), status: 'pending', address: '0x2d8c...f4a7' },
    { id: '4', type: 'stake', asset: 'STRK', amount: '+100.00', value: '+$50.00', timestamp: new Date(Date.now() - 86400000), status: 'completed', address: 'Staking Pool' },
  ];

  const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.value.replace('$', '').replace(',', '')), 0);
  const totalChange = assets.reduce((sum, asset) => sum + asset.change, 0) / assets.length;

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gold tracking-wider font-serif">Portfolio</h1>
          <p className="text-text-secondary text-sm">
            {isAuthenticated ? user?.walletAddress?.slice(0, 6) + '...' + user?.walletAddress?.slice(-4) : 'Not connected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wallets.length > 0 && (
            <div className="flex -space-x-2">
              {wallets.slice(0, 3).map((w, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${
                    w.blockchain === 'stellar' ? 'bg-cyan/20 text-cyan' : 'bg-[#F7931A]/20 text-[#F7931A]'
                  }`}
                >
                  {w.blockchain === 'stellar' ? '★' : '₿'}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/wallet_settings')}
            className="text-cyan hover:text-cyan/80 transition-colors text-sm"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-surface rounded-2xl p-6 border border-border mb-6">
        <p className="text-text-secondary text-sm uppercase tracking-wider">Total Balance</p>
        <p className="text-3xl font-bold text-white mt-1">${totalValue.toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-sm font-medium ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChange >= 0 ? '↑' : '↓'} {Math.abs(totalChange).toFixed(1)}%
          </span>
          <span className="text-text-secondary text-sm">24h change</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface rounded-lg p-1 border border-border">
        <button
          onClick={() => setSelectedTab('assets')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTab === 'assets'
              ? 'bg-cyan text-background'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Assets
        </button>
        <button
          onClick={() => setSelectedTab('transactions')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTab === 'transactions'
              ? 'bg-cyan text-background'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Assets List */}
      {selectedTab === 'assets' && (
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.symbol}
              className="bg-surface rounded-xl p-4 border border-border hover:border-cyan/30 transition-all cursor-pointer"
              onClick={() => router.push(`/swap?asset=${asset.symbol}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
                  >
                    {asset.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{asset.name}</p>
                    <p className="text-text-secondary text-sm">{asset.balance} {asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{asset.value}</p>
                  <p className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions List */}
      {selectedTab === 'transactions' && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-surface rounded-xl p-4 border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'receive' ? 'bg-green-500/20' :
                    tx.type === 'send' ? 'bg-red-500/20' :
                    tx.type === 'swap' ? 'bg-cyan/20' :
                    'bg-gold/20'
                  }`}>
                    <span className="text-lg">
                      {tx.type === 'receive' ? '↓' :
                       tx.type === 'send' ? '↑' :
                       tx.type === 'swap' ? '🔄' :
                       '⚡'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold capitalize">{tx.type}</p>
                    <p className="text-text-secondary text-xs font-mono">{tx.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'receive' || tx.type === 'stake' ? 'text-green-400' :
                    tx.type === 'send' ? 'text-red-400' :
                    'text-cyan'
                  }`}>
                    {tx.amount} {tx.asset}
                  </p>
                  <p className="text-text-secondary text-xs">{tx.value}</p>
                  <p className={`text-[10px] ${
                    tx.status === 'completed' ? 'text-green-400' :
                    tx.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {tx.status.toUpperCase()}
                  </p>
                </div>
              </div>
              <p className="text-text-secondary text-[10px] mt-2">
                {tx.timestamp.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => router.push('/swap')}
          className="py-3 bg-surface rounded-xl border border-border text-center hover:border-cyan transition-all"
        >
          <span className="text-cyan text-xl block">🔄</span>
          <span className="text-text-secondary text-xs">Swap</span>
        </button>
        <button
          onClick={() => router.push('/orderbook')}
          className="py-3 bg-surface rounded-xl border border-border text-center hover:border-cyan transition-all"
        >
          <span className="text-gold text-xl block">📊</span>
          <span className="text-text-secondary text-xs">Order Book</span>
        </button>
        <button
          onClick={() => router.push('/privacy_settings')}
          className="py-3 bg-surface rounded-xl border border-border text-center hover:border-cyan transition-all"
        >
          <span className="text-cyan text-xl block">🛡️</span>
          <span className="text-text-secondary text-xs">Privacy</span>
        </button>
      </div>
    </div>
  );
}