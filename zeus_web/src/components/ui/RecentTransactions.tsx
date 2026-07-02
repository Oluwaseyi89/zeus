'use client';

interface Transaction {
  id: string;
  hash: string;
  status: string;
  amount: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', hash: '0x7f3a...b9e1', status: 'Locked in HTLC', amount: '0.05 BTC' },
  { id: '2', hash: '0x2d8c...f4a7', status: 'Settled', amount: '0.12 BTC' },
  { id: '3', hash: '0x9e5b...c3d2', status: 'Pending', amount: '0.03 BTC' },
];

export const RecentTransactions = () => (
  <div className="mt-8">
    <h2 className="text-gold text-lg font-bold uppercase tracking-wider mb-5">
      Sealed History
    </h2>
    <div className="space-y-3">
      {mockTransactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-surface-light p-4 rounded-xl border border-gold/10 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <span className="rune-text text-2xl">ᛉ</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{tx.hash}</p>
            <p className="text-text-secondary text-sm">{tx.status}</p>
          </div>
          <p className="text-white font-bold">{tx.amount}</p>
        </div>
      ))}
    </div>
  </div>
);