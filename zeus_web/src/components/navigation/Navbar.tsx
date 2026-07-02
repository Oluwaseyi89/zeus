'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWallet } from '../wallet/ConnectWallet';
import { WalletStatus } from '../wallet/WalletStatus';
import { useAuth, useUI } from '../../store';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useUI();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/swap', label: 'Swap' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/inbox', label: 'Inbox' },
  ];

  return (
    <nav className="bg-background border-b border-border px-4 py-3 sticky top-0 z-40">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">Z</span>
          </div>
          <span className="text-xl font-bold text-white">Zeus</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <WalletStatus />
          <ConnectWallet />
          
          {isAuthenticated && (
            <Link
              href="/wallet_settings"
              className="text-cyan hover:text-cyan/80 transition-colors"
            >
              ⚙️
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="max-w-md mx-auto flex justify-around mt-3 pt-3 border-t border-border">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs font-medium transition-colors ${
              pathname === link.href
                ? 'text-cyan'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
