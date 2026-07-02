'use client';

import { useEffect, useState } from 'react';

interface ZKProofStatusProps {
  status: 'generating' | 'verified' | 'failed';
  progress?: number;
}

export const ZKProofStatus = ({ status, progress = 0 }: ZKProofStatusProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (status === 'generating') {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 2) % 360);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Animated Rune Circle */}
      <div className="relative w-24 h-24 mb-4">
        <div
          className="absolute inset-0 rounded-full border border-cyan/30"
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(0, 212, 255, 0.3)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-cyan/50"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.02s linear',
            borderWidth: 2,
            borderColor: 'rgba(0, 212, 255, 0.5)',
          }}
        />
        <div
          className="absolute inset-[6px] rounded-full border border-cyan/20"
          style={{
            borderWidth: 1,
            borderColor: 'rgba(0, 212, 255, 0.2)',
          }}
        />
        {/* Inner diamond/rune pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 border-2 border-cyan/40 rotate-45" />
            <div className="absolute inset-2 border border-cyan/30 rotate-45" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-cyan rounded-full" />
            </div>
          </div>
        </div>
        {/* Pulsing ring */}
        <div
          className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${
            status === 'generating' ? 'animate-pulse' : 'opacity-0'
          }`}
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p
          className={`text-sm font-bold tracking-wider ${
            status === 'generating'
              ? 'text-cyan'
              : status === 'verified'
              ? 'text-green-400'
              : 'text-red-400'
          }`}
        >
          {status === 'generating' ? 'GENERATING STARK PROOF' :
           status === 'verified' ? 'PROOF VERIFIED' :
           'PROOF FAILED'}
        </p>
        <p className="text-text-secondary text-xs italic mt-1">
          {status === 'generating' ? 'Summoning zero-knowledge runes...' :
           status === 'verified' ? 'Quantum-safe privacy secured.' :
           'Verification failed. Try again.'}
        </p>
        {status === 'generating' && (
          <div className="w-48 h-1 bg-surface rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};