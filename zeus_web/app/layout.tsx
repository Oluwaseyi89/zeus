import type { Metadata } from 'next';
import { Navbar } from '../src/components/navigation/Navbar';
import { SocketProvider } from '../src/providers/SocketProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zeus - Zero-Knowledge Encrypted Unified Swaps',
  description: 'Privacy-preserving atomic swaps and ZK proofs for cross-chain settlements',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#020617] text-white">
        <SocketProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </SocketProvider>
      </body>
    </html>
  );
}
