'use client';

import { useState, useEffect } from 'react';
import { useOrderBook } from '../store';
import { useUI } from '../store';

interface Order {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  asset: string;
  total: number;
  userId: string;
  createdAt: Date;
}

export const OrderBook = () => {
  const { orders, isLoading, submitOrder, queryOrders, clearError } = useOrderBook();
  const { showToast } = useUI();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('BTC');

  useEffect(() => {
    queryOrders({ limit: 20 });
  }, []);

  const handleSubmitOrder = async () => {
    if (!price || !amount) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await submitOrder({
        type: orderType,
        price: parseFloat(price),
        amount: parseFloat(amount),
        asset,
        total: parseFloat(price) * parseFloat(amount),
      });
      showToast('Order submitted!', 'success');
      setPrice('');
      setAmount('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit order', 'error');
    }
  };

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gold text-lg font-bold tracking-wider">Order Book</h2>
        <span className="text-text-secondary text-xs">{orders.length} orders</span>
      </div>

      {/* Order List */}
      <div className="max-h-64 overflow-y-auto space-y-1 mb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
        <div className="flex justify-between text-text-secondary text-xs uppercase tracking-wider pb-2 border-b border-border">
          <span className="w-1/4">Type</span>
          <span className="w-1/4 text-right">Price</span>
          <span className="w-1/4 text-right">Amount</span>
          <span className="w-1/4 text-right">Total</span>
        </div>
        {isLoading ? (
          <div className="text-center text-text-secondary text-sm py-4">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-text-secondary text-sm py-4">No orders</div>
        ) : (
          orders.slice(0, 10).map((order: Order) => (
            <div
              key={order.id}
              className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-surface/50 transition-colors"
            >
              <span
                className={`w-1/4 text-xs font-bold ${
                  order.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {order.type.toUpperCase()}
              </span>
              <span className="w-1/4 text-right text-white font-mono text-sm">
                {order.price}
              </span>
              <span className="w-1/4 text-right text-text-secondary text-sm">
                {order.amount}
              </span>
              <span className="w-1/4 text-right text-text-secondary text-sm">
                {order.total.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Submit Order Form */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              orderType === 'buy'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-surface/50 text-text-secondary border border-border hover:bg-surface'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              orderType === 'sell'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-surface/50 text-text-secondary border border-border hover:bg-surface'
            }`}
          >
            SELL
          </button>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-secondary text-sm focus:outline-none focus:border-cyan"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-secondary text-sm focus:outline-none focus:border-cyan"
          />
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-white text-sm focus:outline-none focus:border-cyan"
          >
            <option value="BTC">BTC</option>
            <option value="XLM">XLM</option>
            <option value="USDC">USDC</option>
          </select>
        </div>

        <button
          onClick={handleSubmitOrder}
          disabled={isLoading}
          className="w-full mt-3 py-2 bg-cyan text-background font-bold rounded-lg transition-all hover:bg-cyan/80 disabled:opacity-50 text-sm"
        >
          {isLoading ? 'SUBMITTING...' : 'SUBMIT ORDER'}
        </button>
      </div>
    </div>
  );
};