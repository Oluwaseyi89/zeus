import type { Metadata } from 'next';
import { Navbar } from '../components/navigation/Navbar';
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
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
