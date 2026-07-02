'use client';

interface HTLCProgressProps {
  step: number; // 0: initiating, 1: locking, 2: locked, 3: claimed
  status?: string;
}

export const HTLCProgress = ({ step, status }: HTLCProgressProps) => {
  const steps = [
    { id: 0, label: 'INITIATE' },
    { id: 1, label: 'LOCK BTC' },
    { id: 2, label: 'VERIFY ZK' },
    { id: 3, label: 'CLAIM XLM' },
  ];

  return (
    <div className="w-full max-w-sm mx-auto py-4">
      {/* Progress Steps */}
      <div className="flex justify-between items-center relative">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2" />
        
        {/* Progress line */}
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-cyan -translate-y-1/2 transition-all duration-700"
          style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s, index) => {
          const isActive = index <= step;
          const isCurrent = index === step;

          return (
            <div key={s.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'border-cyan bg-cyan/10'
                    : 'border-border bg-surface'
                } ${isCurrent ? 'animate-pulse' : ''}`}
              >
                <span
                  className={`text-xs font-bold ${
                    isActive ? 'text-cyan' : 'text-text-secondary'
                  }`}
                >
                  {s.id + 1}
                </span>
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold tracking-wider ${
                  isActive ? 'text-cyan' : 'text-text-secondary'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      {status && (
        <p className="text-center text-text-secondary text-xs mt-4 font-mono">
          {status}
        </p>
      )}
    </div>
  );
};