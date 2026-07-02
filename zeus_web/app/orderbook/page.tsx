'use client';

import { OrderBook } from '../../src/components/OrderBook';
import { useAuth } from '../../src/store';

export default function OrderBookPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gold mb-2 tracking-wider font-serif">
        Order Book
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        Private order matching for atomic swaps
      </p>

      {!isAuthenticated && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ Connect your wallet to place orders
          </p>
        </div>
      )}

      <OrderBook />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Volume</p>
          <p className="text-white font-bold">2.45 BTC</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Orders</p>
          <p className="text-white font-bold">12</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border text-center">
          <p className="text-text-secondary text-[10px] uppercase tracking-wider">Spread</p>
          <p className="text-cyan font-bold">0.8%</p>
        </div>
      </div>
    </div>
  );
}