'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwap } from '../../src/store';
import { ZKProofStatus } from '../../src/components/zk/ZKProofStatus';
import { HTLCProgress } from '../../src/components/zk/HTLCProgress';
import { ThunderBolt } from '../../src/components/ui/Icons';
import { useUI } from '../../src/store';

export default function SwapPage() {
  const router = useRouter();
  const { showToast } = useUI();
  const { createSwap, isLoading } = useSwap();
  
  const [amount, setAmount] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStep, setSwapStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsSwapping(true);
    setSwapStep(1);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    try {
      // Simulate swap creation
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setSwapStep(2);
      
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSwapStep(3);
      
      showToast('Swap completed successfully! 🎉', 'success');
    } catch (error) {
      showToast('Swap failed', 'error');
    } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setIsSwapping(false);
        setSwapStep(0);
        setProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pt-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-gold text-2xl font-bold tracking-wider font-serif">
          Thunder Swap
        </h1>
        <button
          onClick={() => setIsPrivate(!isPrivate)}
          className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
            isPrivate
              ? 'border-cyan text-cyan bg-cyan/10'
              : 'border-border text-text-secondary bg-surface'
          }`}
        >
          {isPrivate ? '🛡 SHIELDED' : '🔓 PUBLIC'}
        </button>
      </div>

      {/* Swap Card */}
      <div className="bg-surface rounded-2xl p-5 border border-border">
        {/* From Token - Bitcoin */}
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7931A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">₿</span>
            </div>
            <span className="text-white font-semibold">Bitcoin</span>
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSwapping}
            className="bg-transparent text-right text-white text-2xl font-bold w-32 focus:outline-none placeholder-text-secondary"
          />
        </div>

        {/* Bridge / Swap Icon */}
        <div className="flex items-center justify-center py-3 relative">
          <div className="flex-1 h-px bg-border" />
          <div className="w-14 h-14 rounded-full bg-background border-2 border-cyan flex items-center justify-center mx-4">
            <ThunderBolt size={28} />
          </div>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* To Token - Stellar */}
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan/20 flex items-center justify-center">
              <span className="text-cyan font-bold text-lg">★</span>
            </div>
            <span className="text-white font-semibold">Stellar</span>
          </div>
          <span className="text-right text-cyan text-2xl font-bold">
            {amount ? (parseFloat(amount) * 10000).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Status Area */}
      <div className="mt-8 min-h-[180px] flex items-center justify-center">
        {swapStep === 1 && (
          <ZKProofStatus status="generating" progress={progress} />
        )}
        {swapStep === 2 && (
          <HTLCProgress step={2} status="Verifying zero-knowledge proof..." />
        )}
        {swapStep === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <p className="text-gold text-2xl font-bold tracking-widest">SWAP COMPLETE</p>
            <p className="text-text-secondary text-sm italic mt-2">The runes have been balanced.</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {swapStep === 0 && (
        <button
          onClick={handleSwap}
          disabled={isSwapping || !amount}
          className="w-full h-16 rounded-xl border-2 border-cyan bg-transparent text-cyan font-bold text-lg tracking-wider transition-all hover:bg-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isSwapping ? 'EXECUTING...' : 'EXECUTE PRIVATE SWAP'}
        </button>
      )}

      {swapStep === 3 && (
        <button
          onClick={() => {
            setIsSwapping(false);
            setSwapStep(0);
            setAmount('');
          }}
          className="w-full h-16 rounded-xl border-2 border-gold bg-transparent text-gold font-bold text-lg tracking-wider transition-all hover:bg-gold/10 mt-4"
        >
          NEW RITUAL
        </button>
      )}

      {/* Swap Info */}
      <div className="mt-6 p-3 bg-surface/50 rounded-lg border border-border">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>Rate</span>
          <span>1 BTC ≈ 10,000 XLM</span>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>Privacy</span>
          <span className={isPrivate ? 'text-cyan' : 'text-text-secondary'}>
            {isPrivate ? '🔒 Zero-Knowledge Shielded' : 'Public'}
          </span>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>Network</span>
          <span>Stellar Testnet</span>
        </div>
      </div>
    </div>
  );
}