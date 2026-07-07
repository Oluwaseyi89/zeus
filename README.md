# ⚡ ZEUS Protocol
**Zero-Knowledge Encrypted Unified Swaps — Stellar Hacks 2026 Edition**

[![Starknet](https://img.shields.io/badge/Starknet-Cairo-blue)](https://starknet.io)
[![React Native](https://img.shields.io/badge/React-Native-blueviolet)](https://reactnative.dev)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-red)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-Web-black)](https://nextjs.org)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-lightgrey)](https://stellar.org)
[![Stellar Hacks 2026](https://img.shields.io/badge/🏆-Stellar_Hacks_2026-FFD700?style=flat)](https://stellar.org/community/hacks)

ZEUS is a privacy-first decentralized exchange protocol enabling completely private, trust-minimized atomic swaps between Bitcoin and Stellar (Soroban) assets with Starknet integration. Built for **Stellar Hacks: Real-World ZK**, ZEUS hides all trading intent, amounts, and counterparty information using zero-knowledge proofs while maintaining complete verifiability.

## 🌟 Key Features

- 🔐 **ZK-Proof Verification** — RISC Zero/Noir proof verification on Stellar Soroban with replay protection
- 🔄 **Cross-Chain Atomic Swaps** — BTC ↔ XLM/USDC with HTLC-style escrow mechanics
- 🛡️ **Replay Attack Protection** — Each transaction can only be claimed once via `is_tx_spent()`
- ⏱️ **Autonomous Refunds** — Depositors can reclaim funds after timeout without admin intervention
- 💰 **Platform Fee Mechanism** — Sustainable protocol monetization with configurable fee basis points
- 🏭 **Dynamic Escrow Deployment** — Factory pattern for scalable, isolated escrow instances
- 📡 **Real-Time Notifications** — WebSocket delivery with persistent metrics via Redis
- 🎨 **Dark Cyberpunk UI** — Mobile-first web and mobile app with gold/cyan accents

## 🏆 Hackathon Achievements

| Feature | Status |
|---------|--------|
| Stellar Soroban Smart Contracts | ✅ 3 contracts, 25+ tests, 90% coverage |
| ZK Atomic Swap Verifier | ✅ RISC Zero/Noir proof verification |
| Escrow Factory Pattern | ✅ Dynamic isolated escrow deployment |
| NestJS Backend API | ✅ Full REST + WebSocket gateway |
| Next.js Web Application | ✅ Freighter + UniSat wallet integration |
| React Native Mobile App | ✅ Cross-platform atomic swap flows |
| TypeScript Bindings | ✅ Generated clients for all contracts |

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Repository Structure](#repository-structure)
3. [Quick Start](#quick-start)
   - [Mobile App (zeus_app)](#mobile-app-zeus_app)
   - [Web App (zeus_web)](#web-app-zeus_web)
   - [Backend Service (zeus_service)](#backend-service-zeus_service)
   - [Stellar Contracts (zeus_stellar)](#stellar-contracts-zeus_stellar)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Security](#security)
8. [Contributing](#contributing)

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ZEUS Protocol Architecture                           │
│                          Stellar Hacks: Real-World ZK                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              Application Layer                                  │
│  ┌─────────────────────────────┐  ┌───────────────────────────────────────┐   │
│  │     React Native App         │  │     Next.js Web App                   │   │
│  │       (zeus_app)             │  │       (zeus_web)                      │   │
│  │  • Freighter Wallet          │  │  • Freighter Wallet Integration       │   │
│  │  • UniSat Wallet             │  │  • UniSat Wallet Integration          │   │
│  │  • ZK Proof Generation       │  │  • ZK Proof Generation/Verification   │   │
│  │  • Atomic Swap UI            │  │  • Atomic Swap UI with HTLC Tracking  │   │
│  │  • Portfolio Dashboard       │  │  • Portfolio Dashboard                │   │
│  │  • Real-Time Updates         │  │  • Real-Time WebSocket Updates        │   │
│  │  • Push Notifications        │  │  • Inbox System                       │   │
│  └───────────────┬─────────────┘  └───────────────┬───────────────────────┘   │
│                  │                                  │                           │
│                  └──────────────────┬───────────────┘                           │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway + WebSocket (Port 3000)                   │   │
│  │                         REST + Socket.IO                                 │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                     ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                  NestJS Service Layer (zeus_service)                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐    │   │
│  │  │ Auth Module  │  │ Swap Module  │  │ Notification Module         │    │   │
│  │  │ • Nonce auth │  │ • Escrow     │  │ • WebSocket Gateway         │    │   │
│  │  │ • JWT        │  │   creation   │  │ • Inbox with read/unread    │    │   │
│  │  │ • Multi-     │  │ • Cross-     │  │ • Delivery metrics/retry    │    │   │
│  │  │   chain      │  │   chain swap │  │ • Email/SMS providers       │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐    │   │
│  │  │ Stellar      │  │ Starknet     │  │ ZK Module                  │    │   │
│  │  │ Module       │  │ Module       │  │ • Proof generation         │    │   │
│  │  │ • Soroban    │  │ • Starknet   │  │ • RISC Zero/Noir           │    │   │
│  │  │   RPC client │  │   RPC client │  │ • Verifier integration     │    │   │
│  │  │ • Escrow     │  │ • Contract   │  │ • Cross-chain proof        │    │   │
│  │  │   factory    │  │   bindings   │  │   verification             │    │   │
│  │  │   bindings   │  │ • ZK verifier│  │                            │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐    │   │
│  │  │ Bitcoin      │  │ Orderbook    │  │ Relayer Module             │    │   │
│  │  │ Module       │  │ Module       │  │ • Proof submission         │    │   │
│  │  │ • BTC vault  │  │ • Private    │  │ • Transaction monitoring   │    │   │
│  │  │   operations │  │   order      │  │ • Cross-chain relay        │    │   │
│  │  │ • UTXO mgmt  │  │   matching   │  │ • Event listening          │    │   │
│  │  │ • Withdrawal │  │ • Encrypted  │  │                            │    │   │
│  │  │   requests   │  │   orderbook  │  │                            │    │   │
│  │  │ • HTLC       │  │              │  │                            │    │   │
│  │  │   scripts    │  │              │  │                            │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘    │   │
│  └──────────────────────────────────┬──────────────────────────────────────┘   │
│                                     ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     Blockchain Layer                                     │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │              Stellar Soroban (zeus_stellar)                     │    │   │
│  │  │  ┌───────────────────────────┐  ┌────────────────────────────┐ │    │   │
│  │  │  │  ZK Atomic Swap Verifier  │  │  Swap Escrow Contract      │ │    │   │
│  │  │  │  • RISC Zero/Noir proofs  │  │  • HTLC escrow lifecycle   │ │    │   │
│  │  │  │  • Relayer whitelist      │  │  • Autonomous refunds      │ │    │   │
│  │  │  │  • Pause/unpause toggle   │  │  • Platform fee extraction │ │    │   │
│  │  │  │  • Double-spend detection │  │  • Event emissions         │ │    │   │
│  │  │  └───────────────────────────┘  └────────────────────────────┘ │    │   │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  Escrow Factory Contract                                 │  │    │   │
│  │  │  │  • Dynamic isolated escrow deployment                    │  │    │   │
│  │  │  │  • Admin-controlled WASM hash upgrades                   │  │    │   │
│  │  │  │  • Factory created/upgraded events                       │  │    │   │
│  │  │  └──────────────────────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                   Starknet Contracts (zeus_contracts)           │    │   │
│  │  │  ┌───────────────────────────┐  ┌────────────────────────────┐ │    │   │
│  │  │  │  ZKAtomicSwapVerifier     │  │  BTCVault                  │ │    │   │
│  │  │  │  • STARK proof            │  │  • BTC custody             │ │    │   │
│  │  │  │    verification           │  │  • Deposit/withdraw        │ │    │   │
│  │  │  │  • Swap commitment        │  │  • HTLC integration        │ │    │   │
│  │  │  │    management             │  │  • Swap escrow             │ │    │   │
│  │  │  └───────────────────────────┘  └────────────────────────────┘ │    │   │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  ZKOrderBook Contract                                    │  │    │   │
│  │  │  │  • Encrypted order storage                               │  │    │   │
│  │  │  │  • Order matching logic                                  │  │    │   │
│  │  │  │  • Privacy-preserving execution                          │  │    │   │
│  │  │  └──────────────────────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │   Bitcoin Network (via backend)                                 │    │   │
│  │  │   • UTXO management • HTLC scripts • Withdrawal requests       │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Data Layer                                       │   │
│  │  ┌────────────────────────────┐  ┌─────────────────────────────────┐   │   │
│  │  │ PostgreSQL 15 (TypeORM)    │  │  Redis 7.x (Cache/Queue)        │   │   │
│  │  │ • Swap records             │  │  • Session cache                 │   │   │
│  │  │ • User data                │  │  • Notification queue            │   │   │
│  │  │ • Transaction history      │  │  • Real-time metrics             │   │   │
│  │  │ • Orderbook data           │  │  • Rate limiting                 │   │   │
│  │  └────────────────────────────┘  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```
### Core Components

* **Mobile App (React Native/Expo)** - Frontend interface for wallet management, atomic swaps, and private orderbook interaction
* **Web App (Next.js)** - Browser interface for swap lifecycle, portfolio, inbox, privacy, and wallet settings
* **Backend Service (NestJS)** - API gateway, real-time WebSocket server, business logic, and blockchain indexers
* **Smart Contracts (Cairo + Soroban)** - Starknet and Stellar contracts for ZK verification, vault custody, orderbook, and swap escrow
* **Bitcoin Integration** - HTLC scripts and relayer service for Bitcoin atomic swaps into both Starknet and Stellar surfaces
* **ZK Proof System** - Circuit definitions and proof generation for privacy-preserving multi-chain operations

## 📁 Repository Structure
```
zeus/
├── zeus_app/                    # React Native Mobile Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/             # App screens
│   │   ├── services/            # API, wallet, socket services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── navigation/           # Navigation configuration
│   │   └── utils/               # Utility functions
│   ├── assets/                  # Images, fonts, etc.
│   ├── App.tsx                  # App entry point
│   ├── app.json                 # Expo configuration
│   └── package.json             # Dependencies
│
├── zeus_service/                 # NestJS Backend Service
│   ├── src/
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # Wallet authentication
│   │   │   ├── swap/            # Swap management
│   │   │   ├── orderbook/        # Private orderbook
│   │   │   ├── notification/     # Real-time notifications
│   │   │   ├── starknet/         # Starknet integration
│   │   │   ├── bitcoin/          # Bitcoin integration
│   │   │   ├── zk/               # ZK proof handling
│   │   │   └── relayer/          # Transaction relay
│   │   ├── queue/                # Redis queue processors
│   │   ├── common/               # Shared utilities
│   │   ├── config/               # Configuration
│   │   └── main.ts               # Entry point
│   ├── docs/                     # Documentation
│   ├── test/                     # Tests
│   └── package.json              # Dependencies
│
├── zeus_contracts/                # Cairo Smart Contracts
│   ├── src/
│   │   ├── contracts/
│   │   │   ├── core/             # Core protocol contracts
│   │   │   │   ├── ZKAtomicSwapVerifier.cairo
│   │   │   │   ├── BTCVault.cairo
│   │   │   │   ├── SwapEscrow.cairo
│   │   │   │   └── ZKOrderBook.cairo
│   │   │   ├── bridges/          # Bridge contracts
│   │   │   ├── tokens/           # Token contracts
│   │   │   └── mock/             # Test mocks
│   │   ├── interfaces/            # Contract interfaces
│   │   ├── libraries/             # Shared libraries
│   │   ├── constants/             # Protocol constants
│   │   └── errors/                # Error definitions
│   ├── scripts/                   # Deployment scripts
│   ├── abis/                      # Generated ABIs
│   ├── tests/                      # Contract tests
│   ├── Scarb.toml                 # Cairo package config
│   └── snfoundry.toml             # Starknet Foundry config
│
├── zeus_web/                      # Next.js Web Frontend
│   ├── app/                       # App Router routes
│   ├── src/                       # Components, hooks, services
│   ├── public/                    # Static assets
│   └── package.json               # Dependencies
│
├── zeus_stellar/                  # Stellar Soroban Contracts
│   ├── contracts/                 # Protocol contract crates
│   ├── crates/                    # Shared Rust crates
│   ├── scripts/                   # Deploy/invoke helpers
│   ├── test/                      # Integration tests and fixtures
│   └── Cargo.toml                 # Rust workspace config
│
├── docker-compose.yml             # Local development environment
├── .gitignore
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
* **Node.js 18+**
* **npm** or **yarn**
* **Python 3.10+** (for contract deployment)
* **Docker** (optional, for local blockchain services)
* **Expo CLI** (`npm install -g expo-cli`)
* **Scarb** (Cairo package manager)
* **Rust + Cargo** (for Soroban workspace)
* **Redis** and **PostgreSQL** (or use Docker)

### One-Line Setup (macOS/Linux)
```bash
# Clone repository
git clone https://github.com/yourusername/zeus.git
cd zeus

# Start infrastructure (Postgres, Redis, Bitcoin regtest)
docker-compose up -d

# Setup backend
cd zeus_service
npm install
cp .env.example .env  # Edit with your configuration
npm run start:dev

# In a new terminal - setup contracts
cd ../zeus_contracts
scarb build
python3 scripts/deploy.py --network local

# In a new terminal - setup mobile app
cd ../zeus_app
npm install
expo start --lan

# In a new terminal - setup web app
cd ../zeus_web
npm install
npm run dev

# In a new terminal - validate stellar workspace
cd ../zeus_stellar
cargo check
```

### Windows Setup
```powershell
# Use PowerShell as Administrator
cd zeus_service
npm install
copy .env.example .env  # Edit with your configuration
npm run start:dev

# New terminal
cd ..\zeus_app
npm install
expo start --lan

# New terminal
cd ..\zeus_web
npm install
npm run dev
```

## 📱 Mobile App (zeus_app)

The React Native mobile app provides a seamless interface for private atomic swaps.

### Key Features
* **Wallet Integration** - Xverse (Bitcoin), Argent/Braavos (Starknet), WalletConnect
* **Real-time Updates** - Socket.IO for live orderbook and swap status
* **Biometric Security** - Secure storage of swap secrets
* **Push Notifications** - Swap completion alerts
* **Offline Support** - Queue transactions when offline

### Environment Configuration
Create `.env` in `zeus_app`:
```env
API_URL=http://192.168.1.100:3000  # Your local IP
SOCKET_URL=http://192.168.1.100:3000
```

### Key Modules

* **src/services/walletAuth.ts** - Wallet authentication flows
* **src/services/socket.ts** - WebSocket connection management
* **src/services/stateStore.ts** - Zustand unified store
* **src/components/atomic-swap/** - Swap UI components
* **src/hooks/useAtomicSwap.ts** - Swap lifecycle hook

### Running on Device
```bash
# Find your LAN IP
# macOS: ipconfig getifaddr en0
# Linux: hostname -I
# Windows: ipconfig

# Set API URL in App.tsx or .env
(global as any).ZEUS_API_URL = 'http://<YOUR_LAN_IP>:3000';

# Start with LAN flag
expo start --lan

# Scan QR code with Expo Go app
```
---
### QR Code:
![WhatsApp Image 2026-02-28 at 10 26 13 AM](https://github.com/user-attachments/assets/015632ff-3a76-4f7a-9968-1027bcb17ed1)

---

## 🔧 Backend Service (zeus_service)

NestJS backend providing REST APIs and WebSocket real-time updates across Bitcoin, Starknet, and Stellar workflows.

### Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Zeus Service (NestJS)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   Auth Module   │  │   Swap Module   │  │   Notification Module       │ │
│  │  - Nonce        │  │  - Create Swap  │  │  - WebSocket Gateway       │ │
│  │  - Wallet Login │  │  - Fund Escrow  │  │  - Inbox API               │ │
│  │  - JWT Guards   │  │  - Complete     │  │  - Metrics & Retry Queue   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│           │                    │                       │                    │
│           ▼                    ▼                       ▼                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Stellar Module │  │   Starknet     │  │    Bitcoin Module           │ │
│  │  - RPC Client   │  │   Module       │  │  - Vault Service            │ │
│  │  - Escrow       │  │  - Contract    │  │  - UTXO Management          │ │
│  │  - Verifier     │  │    Clients     │  │  - Withdrawal API           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      Shared Infrastructure                              ││
│  │  PostgreSQL (TypeORM) │ Redis (Queue/Cache) │ JWT Auth │ Config Module ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

```

### API Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/nonce` | Request nonce for wallet | Public |
| **POST** | `/auth/wallet-login` | Authenticate with wallet | Public |
| **GET** | `/swap` | List user swaps | JWT |
| **POST** | `/swap` | Create swap | JWT |
| **GET** | `/swap/:id` | Get swap details | JWT |
| **POST** | `/orderbook/submit` | Submit private order | JWT |
| **GET** | `/notification/inbox` | Get notifications | JWT |
| **POST** | `/notification/:id/read` | Mark as read | JWT |

### WebSocket Events

#### Client → Server:
* **authenticate** - Authenticate with JWT
* **subscribe** - Join room (swap, market, vault)
* **unsubscribe** - Leave room

#### Server → Client:
* **notification** - New notification
* **swap.delta** - Swap status update
* **order.delta** - Orderbook update
* **vault.delta** - Vault balance update

## 🌐 Web App (zeus_web)

The Next.js web app mirrors core mobile journeys for desktop/browser users and provides a clean structure for portfolio, swap, inbox, privacy, and wallet flows.

### Route Map
* `/home`
* `/inbox/[id]`
* `/portfolio`
* `/privacy_settings`
* `/swap`
* `/transaction_history`
* `/wallet_settings`

### Web Setup
```bash
cd zeus_web
npm install
npm run dev
```

## ⭐ Stellar Contracts (zeus_stellar)

The Soroban workspace is the Stellar-native contract surface for ZEUS and is structured by protocol domain with shared Rust crates for common types, interfaces, and utilities.

### Key Areas
* `contracts/` - Protocol contract crates (bridge, vault, escrow, verifier, tokens)
* `crates/` - Shared crates (`zeus_types`, `zeus_events`, `zeus_errors`, etc.)
* `scripts/` - Deployment, invocation, and upgrade helpers
* `artifacts/` - WASM, ABI, and binding outputs

### Stellar Workspace Check
```bash
cd zeus_stellar
cargo check
```

## 🔒 Security

### Smart Contract Security
* **Reentrancy Guards** - All external calls at function end (Cairo/Soroban applicable flows)
* **Access Control** - Role-based permissions across Starknet and Stellar contract surfaces
* **Input Validation** - Comprehensive parameter checking for cross-chain payloads
* **Circuit Breakers** - Emergency pause functionality for swap and bridge modules
* **Timelocks** - Administrative actions delayed
* **Multi-sig** - Bitcoin custody requires multiple signatures
* **Nullifier Sets** - Prevent double-spending and replay across supported chains

### Infrastructure Security
* **JWT Authentication** - Short-lived tokens with refresh
* **API Keys** - For relayer/admin access
* **Rate Limiting** - Prevent DoS attacks
* **Encryption** - All sensitive data encrypted at rest
* **Secure Storage** - Keys stored in hardware-backed keystore

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
* **Follow existing code style**
* **Add tests for new features**
* **Update documentation**
* **Ensure all tests pass**
* **Use conventional commits**

## 🙏 Acknowledgments

* **Starknet Foundation**
* **Stellar Development Foundation**
* **Bitcoin community**
* **OpenZeppelin** for Cairo contracts
* **WalletConnect team**
* **All contributors and testers**

## 📞 Contact & Support

* **Discord:** Oluwaseyi89
* **Twitter:** @IsenewoE
* **Email:** isenewoephr2012@gmail.com
* **GitHub Issues:** Report bugs

---
Built with ❤️ for the **Stellar**, **Starknet** and **Bitcoin** communities
