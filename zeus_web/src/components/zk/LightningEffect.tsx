'use client';

import { useEffect, useState } from 'react';

interface LightningEffectProps {
  trigger: boolean;
}

export const LightningEffect = ({ trigger }: LightningEffectProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-cyan/20 animate-flash" />
      <style jsx>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          10%, 30% { opacity: 0.8; }
          50% { opacity: 0.4; }
          70% { opacity: 0.6; }
        }
        .animate-flash {
          animation: flash 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};