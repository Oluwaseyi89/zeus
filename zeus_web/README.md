# ⚡ Zeus Web Application
Next.js Frontend for Private Cross-Chain Swaps with ZK-Proof Verification

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=for-the-badge)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-44337A?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge)](https://socket.io)
[![Stellar-Freighter](https://img.shields.io/badge/Stellar-Freighter-111111?style=for-the-badge)](https://github.com/stellar/freighter-api)

## 🎯 What This Application Does

Zeus Web is the browser frontend for the Zeus protocol, enabling private, cross-chain atomic swaps between Bitcoin and Stellar assets with zero-knowledge proof verification. It provides:

- 🔐 **Multi-Wallet Support** — Freighter (Stellar) and UniSat (Bitcoin) wallet integration
- 🔄 **Cross-Chain Atomic Swaps** — BTC ↔ Stellar asset swaps with HTLC progress tracking
- 🔮 **ZK-Proof Verification** — Generate and verify RISC Zero/Noir proofs on Stellar
- 📡 **Real-Time Notifications** — WebSocket integration for live swap and proof updates
- 🎨 **Dark Cyberpunk UI** — Mobile-first design matching the Zeus mobile app
- 🏗️ **State Management** — Zustand with slice architecture for predictable state

## 🏆 Hackathon-Ready Features

| Feature | Status | Description |
|---------|--------|-------------|
| Freighter Wallet | ✅ Complete | Stellar wallet integration with official API |
| UniSat Wallet | ✅ Complete | Bitcoin wallet integration |
| ZK Swap Verification | ✅ Complete | Generate and verify proofs for atomic swaps |
| Atomic Swap UI | ✅ Complete | HTLC progress, countdown timer, swap actions |
| Order Book | ✅ Complete | Private order matching for atomic swaps |
| Portfolio Dashboard | ✅ Complete | Asset balances and transaction history |
| Inbox System | ✅ Complete | Real-time notifications with read/unread status |
| Real-Time Updates | ✅ Complete | WebSocket integration for live events |
| Dark Theme | ✅ Complete | Cyberpunk aesthetic with gold/cyan accents |
| Mobile-First | ✅ Complete | Responsive design matching mobile app |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Zeus Web (Next.js App Router)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           App Directory (Routes)                        ││
│  │  / (Home) │ /swap │ /swap/[id] │ /orderbook │ /portfolio │ /inbox      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          Component Layer                                 ││
│  │  UI Components │ Wallet Components │ ZK Components │ Atomic Swap        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           Service Layer                                 ││
│  │  API Client │ Wallet Service │ ZK Service │ Real-Time │ Storage         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         State Management (Zustand)                      ││
│  │  Auth │ Wallet │ ZK │ Swap │ OrderBook │ Notification │ UI              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Backend Integration                             ││
│  │  Zeus Service (NestJS) │ Stellar RPC │ Bitcoin RPC │ WebSocket         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📦 Core Features

### 1. Wallet Integration

**Freighter** — Stellar wallet using official `@stellar/freighter-api`
- Automatic detection with periodic rechecking
- Message signing with `signMessage` (SEP-53)
- Network detection and validation

**UniSat** — Bitcoin wallet integration
- Account connection and balance fetching
- UTXO management
- Message signing support

### 2. ZK-Proof System
- **Proof Generation** — Generate proofs for swaps, privacy pools, and compliance
- **Proof Verification** — Verify proofs on Stellar using Soroban verifier contracts
- **RISC Zero Support** — Execute code on a remote VM and verify execution
- **Noir/Circom Support** — Circuit-based ZK proof generation

### 3. Atomic Swaps
- **Swap Creation** — Initiate BTC ↔ Stellar asset swaps
- **HTLC Progress** — Visual tracking of swap stages
- **Countdown Timer** — Real-time swap expiration tracking
- **Fund/Complete/Refund** — Full swap lifecycle management
- **Order Book** — Private order matching for atomic swaps

### 4. Real-Time Features
- **WebSocket Integration** — Live notifications and updates
- **Inbox System** — Persistent notifications with read/unread status
- **Swap Updates** — Real-time swap status changes
- **Proof Updates** — Live proof verification status

### 5. Portfolio & History
- **Asset Dashboard** — Balance overview with tap-to-reveal privacy
- **Transaction History** — Complete transaction log with filtering
- **Quick Actions** — Swap, order book, and privacy settings shortcuts

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 4.x |
| State Management | Zustand 5.x with persist middleware |
| API Client | Axios with interceptors |
| Real-Time | Socket.IO-client 4.x |
| Wallet SDKs | @stellar/freighter-api 6.x |
| Testing | Jest |
| Deployment | Vercel |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn
- Backend server running (`zeus_service`)

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd zeus_web
npm install

# Copy environment configuration
cp .env.example .env.local
```

### Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```
Open http://localhost:3000 in your browser.

## 🗺️ Route Map

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with wallet connection and balance |
| `/swap` | Swap | Create and execute atomic swaps |
| `/swap/[id]` | Swap Details | View and manage specific swap |
| `/orderbook` | Order Book | Private order matching |
| `/portfolio` | Portfolio | Asset balances and transaction history |
| `/inbox` | Inbox | Real-time notifications |
| `/inbox/[id]` | Notification Detail | View specific notification |
| `/wallet_settings` | Wallet Settings | Manage connected wallets |

## 📂 Project Structure

```
zeus_web/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   ├── swap/
│   │   ├── page.tsx              # Swap creation
│   │   └── [id]/page.tsx         # Swap details
│   ├── orderbook/page.tsx        # Order book
│   ├── portfolio/page.tsx        # Portfolio dashboard
│   ├── inbox/
│   │   ├── page.tsx              # Inbox list
│   │   └── [id]/page.tsx         # Notification detail
│   ├── wallet_settings/page.tsx  # Wallet management
│   └── globals.css               # Global styles
├── src/
│   ├── components/
│   │   ├── wallet/               # Wallet components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── navigation/           # Navigation components
│   │   ├── atomic_swap/          # Atomic swap components
│   │   └── zk/                   # ZK proof components
│   ├── services/
│   │   ├── api/                  # API client and endpoints
│   │   ├── wallet/               # Freighter and UniSat services
│   │   ├── zk/                   # ZK proof service
│   │   ├── realtime/             # WebSocket service
│   │   └── security/             # Storage and security
│   ├── store/
│   │   ├── slices/               # Zustand slices
│   │   │   ├── authSlice.ts
│   │   │   ├── walletSlice.ts
│   │   │   ├── zkSlice.ts
│   │   │   ├── swapSlice.ts
│   │   │   ├── orderbookSlice.ts
│   │   │   ├── notificationSlice.ts
│   │   │   └── uiSlice.ts
│   │   ├── index.ts              # Store configuration
│   │   └── types.ts              # Store types
│   ├── hooks/                    # Custom React hooks
│   ├── providers/                # Context providers
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🔌 Integration with Backend Services

The web app integrates with the following backend services:

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Zeus Service | `NEXT_PUBLIC_API_URL` | All HTTP API calls |
| WebSocket | `NEXT_PUBLIC_WEBSOCKET_URL` | Real-time notifications |
| Stellar RPC | Via backend | Soroban contract interactions |
| Bitcoin RPC | Via backend | Bitcoin vault operations |

## 🔗 Related Repositories

| Repository | Purpose |
|------------|---------|
| `zeus_service` | Backend API service |
| `zeus_stellar` | Soroban smart contracts |
| `zeus_app` | React Native mobile app |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Run `npm run test` and `npx tsc --noEmit`
5. Submit a pull request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for <strong>Stellar Hacks: Real-World ZK</strong> ⚡

Making cross-chain swaps private, trustless, and verifiable.
</div>