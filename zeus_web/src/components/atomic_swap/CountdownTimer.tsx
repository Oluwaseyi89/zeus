'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: number; // Unix timestamp in seconds
  onExpire?: () => void;
}

export const CountdownTimer = ({ targetTime, onExpire }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        onExpire?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      if (newTime.hours === 0 && newTime.minutes === 0 && newTime.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpire]);

  if (isExpired) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm font-medium">⏳ Time Expired</p>
        <p className="text-text-secondary text-xs">The swap window has closed</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="text-center">
        <div className="w-10 h-10 bg-surface rounded-lg border border-border flex items-center justify-center">
          <span className="text-cyan font-mono text-lg font-bold">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
        </div>
        <span className="text-text-secondary text-[10px] mt-1 block">HRS</span>
      </div>
      <span className="text-cyan font-mono text-lg font-bold">:</span>
      <div className="text-center">
        <div className="w-10 h-10 bg-surface rounded-lg border border-border flex items-center justify-center">
          <span className="text-cyan font-mono text-lg font-bold">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
        </div>
        <span className="text-text-secondary text-[10px] mt-1 block">MIN</span>
      </div>
      <span className="text-cyan font-mono text-lg font-bold">:</span>
      <div className="text-center">
        <div className="w-10 h-10 bg-surface rounded-lg border border-border flex items-center justify-center">
          <span className="text-cyan font-mono text-lg font-bold">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
        <span className="text-text-secondary text-[10px] mt-1 block">SEC</span>
      </div>
    </div>
  );
};