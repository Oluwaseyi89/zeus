# ZEUS Protocol
**Zero-Knowledge Encrypted Unified Swaps**

![Starknet](https://img.shields.io/badge/Starknet-Cairo-blue)
![React Native](https://img.shields.io/badge/React-Native-blueviolet)
![NestJS](https://img.shields.io/badge/NestJS-Backend-red)
![Next.js](https://img.shields.io/badge/Next.js-Web-black)
![Stellar](https://img.shields.io/badge/Stellar-Soroban-lightgrey)

ZEUS is a privacy-first decentralized exchange protocol enabling completely private, trust-minimized atomic swaps across Bitcoin, Starknet, and Stellar assets. Unlike traditional DEXs with transparent orderbooks, ZEUS hides all trading intent, amounts, and counterparty information using zero-knowledge proofs while maintaining complete verifiability.

## 🌟 Key Features

* **Quantum-Resistant Privacy** - Uses STARKs not SNARKs for post-quantum security
* **Bitcoin Native** - Direct atomic swaps without wrapped BTC
* **No MEV** - Hidden orderbook prevents front-running and manipulation
* **Multi-Chain Execution** - Protocol surfaces span Starknet (Cairo) and Stellar (Soroban)
* **Cross-Chain ZK** - Proofs and commitments secure Bitcoin, Starknet, and Stellar swap flows
* **Mobile-First** - Full-featured React Native mobile app
* **Institutional Ready** - Audit trails via selective disclosure

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Repository Structure](#repository-structure)
3. [Quick Start](#quick-start)
    * [Mobile App (zeus_app)](#mobile-app-zeus_app)
    * [Web App (zeus_web)](#web-app-zeus_web)
    * [Backend Service (zeus_service)](#backend-service-zeus_service)
    * [Smart Contracts (zeus_contracts)](#smart-contracts-zeus_contracts)
    * [Stellar Contracts (zeus_stellar)](#stellar-contracts-zeus_stellar)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Security](#security)
8. [Contributing](#contributing)

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                        ZEUS Protocol Architecture                   │
├─────────────────────────────────────────────────────────────────────┤
│                         Application Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              React Native Mobile App (zeus_app)             │   │
│  │  • WalletConnect Integration    • Real-time Updates         │   │
│  │  • ZK Proof Generation          • Atomic Swap Flow          │   │
│  │  • Encrypted Orderbook          • Push Notifications        │   │
│  └───────────────────┬─────────────────────────────────────────┘   │
│                      │                                             │
│                      ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway (Port 3000)                   │   │
│  │              REST + WebSocket (Socket.IO)                    │   │
│  └───────────────────┬─────────────────────────────────────────┘   │
│                      │                                             │
│                      ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Service Layer (zeus_service)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ Auth Module │  │ Swap Module │  │ Notification Module │  │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────────────┤  │   │
│  │  │ Orderbook   │  │ Starknet    │  │ Bitcoin Module      │  │   │
│  │  │ Module      │  │ Module      │  │                     │  │   │
│  │  ├─────────────┤  ├─────────────┤  ├─────────────────────┤  │   │
│  │  │ ZK Module   │  │ Relayer     │  │ Queue Service       │  │   │
│  │  │             │  │ Module      │  │ (Redis)             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                      │                                             │
│                      ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Blockchain Layer                            │   │
│  │  ┌───────────────────┐     ┌───────────────────────┐        │   │
│  │  │     Bitcoin       │◄───►│      Starknet         │        │   │
│  │  │    Network        │     │    Contracts          │        │   │
│  │  │                   │     │  (zeus_contracts)     │        │   │
│  │  │ • HTLC Scripts    │     │ • ZKAtomicSwapVerifier│        │   │
│  │  │ • UTXO Flows      │     │ • BTCVault            │        │   │
│  │  └───────────────────┘     │ • SwapEscrow          │        │   │
│  │             ▲              │ • ZKOrderBook         │        │   │
│  │             │              └──────────┬────────────┘        │   │
│  │             │                         │                     │   │
│  │             └─────────────────────────▼                     │   │
│  │                      ┌───────────────────────────────┐      │   │
│  │                      │        Stellar Soroban        │      │   │
│  │                      │      Contracts (zeus_stellar) │      │   │
│  │                      │ • stellar_atomic_bridge       │      │   │
│  │                      │ • btc_vault / swap_escrow     │      │   │
│  │                      │ • zk_order_book / zkbtc       │      │   │
│  │                      └───────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Controllers: Auth, Swap, Orderbook, Notification│   │
│  └──────────┬───────────────────────────┬──────────┘   │
│             │                           │               │
│             ▼                           ▼               │
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │   Services       │        │   WebSocket      │      │
│  │   (Business      │        │   Gateway        │      │
│  │    Logic)        │        │   (Socket.IO)    │      │
│  └────────┬─────────┘        └────────┬─────────┘      │
│          │                           │                 │
│          ▼                           ▼                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Queue Service (Redis)                  │   │
│  │  • Notification retries                          │   │
│  │  • Swap execution                                │   │
│  │  • Starknet + Stellar chain sync                 │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Database (PostgreSQL)                  │   │
│  │  • Users      • Swaps      • Orders             │   │
│  │  • Proofs     • Metrics    • Notifications      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
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
