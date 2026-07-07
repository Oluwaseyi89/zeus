# 🚀 Zeus Service — Backend
NestJS Backend for Private Cross-Chain Swaps with ZK-Proof Verification

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge)](https://typescriptlang.org)
[![Stellar-Soroban](https://img.shields.io/badge/Stellar-Soroban-111111?style=for-the-badge)](https://stellar.org)
[![Starknet](https://img.shields.io/badge/Starknet-0.13-FF4B4B?style=for-the-badge)](https://starknet.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge)](https://redis.io)

## 🎯 What This Service Does

Zeus Service is the backend orchestration layer for the Zeus protocol, enabling private, cross-chain atomic swaps between Bitcoin and Stellar (Soroban) with Starknet integration. It provides:

- 🔐 **Multi-Chain Wallet Authentication** — Nonce-based login with JWT sessions for Stellar, Bitcoin, and Starknet wallets
- 🔄 **Cross-Chain Swap Management** — Unified swap lifecycle across Starknet and Stellar blockchains
- 🔮 **ZK-Proof Verification** — Verify RISC Zero/Noir proofs using Soroban ZK verifier contracts
- 🏦 **Bitcoin Vault Operations** — BTC custody, UTXO management, and withdrawal requests
- 📡 **Real-Time Notifications** — WebSocket delivery with persistent metrics and queued retry via Redis
- 🏗️ **Contract Bindings** — Type-safe TypeScript clients for all Soroban and Starknet contracts

## 🏆 Hackathon-Ready Features

| Feature | Status | Description |
|---------|--------|-------------|
| Stellar/Soroban Integration | ✅ Complete | Full Stellar RPC client with contract bindings |
| Wallet Authentication | ✅ Complete | Multi-chain nonce-based wallet login |
| Cross-Chain Swaps | ✅ Complete | Unified swap model for Starknet + Stellar |
| ZK-Proof Verification | ✅ Complete | Soroban verifier contract integration |
| Escrow Factory Support | ✅ Complete | Dynamic escrow deployment via factory pattern |
| Bitcoin Vault | ✅ Complete | BTC custody and withdrawal management |
| Real-Time Notifications | ✅ Complete | WebSocket gateway with queue retry |
| TypeScript Bindings | ✅ Complete | Generated clients for all contracts |
| Comprehensive Tests | ✅ Complete | Unit + E2E tests for all modules |

## 🏗️ Architecture Overview

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

## 📦 Core Modules

### 1. Auth Module (`src/modules/auth/`)
- Nonce-based challenge-response wallet authentication
- JWT session management with wallet context
- Guards: `JwtAuthGuard`, `WalletSignatureGuard`, `ApiKeyGuard`
- Supports Stellar, Bitcoin, and Starknet wallets

### 2. Stellar Module (`src/modules/stellar/`)
- Soroban RPC client with network passphrase support
- Operator key management with transaction signing
- Escrow factory and ZK verifier contract bindings
- BTC transaction spend tracking with on-chain validation

### 3. Swap Module (`src/modules/swap/`)
- Unified swap model for Starknet and Stellar blockchains
- Stellar escrow creation with configurable parameters:
  - Fee basis points (BPS)
  - Timelock configuration
  - Token addresses and treasury
- Cross-chain swap completion with ZK-proof verification

### 4. ZK Module (`src/modules/zk/`)
- ZK-proof generation and verification endpoints
- RISC Zero, Noir, and Circom support
- Integration with Soroban ZK verifier contracts

### 5. Bitcoin Module (`src/modules/bitcoin/`)
- Bitcoin vault with UTXO management
- Withdrawal request API with RPC integration
- HTLC script generation for atomic swaps

### 6. Notification Module (`src/modules/notification/`)
- WebSocket gateway with Socket.IO
- Persistent inbox with read/unread tracking
- Delivery metrics with retry queue
- Email/SMS support via configured providers

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | NestJS 10.x |
| Language | TypeScript 5.x |
| Database | PostgreSQL 15 (TypeORM) |
| Cache/Queue | Redis 7.x |
| Blockchain SDKs | Stellar SDK 16.x, Starknet.js |
| Bitcoin | bitcoinjs-lib, bitcoind RPC |
| Real-Time | Socket.IO |
| Authentication | JWT with nonce |
| Testing | Jest (Unit + E2E) |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL 15+
- Redis 7+
- Bitcoin Core (optional, for Bitcoin flows)

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd zeus_service
npm install --legacy-peer-deps

# Copy environment configuration
cp .env.example .env
```

### Running the Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start
```
The server starts on http://localhost:4000 (default port is configurable via PORT env var). WebSocket gateway is available on the same host using Socket.IO.

## 🔑 Key API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/nonce` | Request nonce for wallet login |
| POST | `/auth/wallet-login` | Sign nonce + exchange for JWT |
| POST | `/auth/verify` | Verify JWT token validity |

### Stellar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stellar/operator/public-key` | Get operator public key |
| GET | `/stellar/rpc/status` | Check Stellar RPC status |
| POST | `/stellar/escrow/create` | Create new escrow contract |
| POST | `/stellar/verify/proof` | Verify ZK proof on Stellar |

### Swap

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/swap` | Create swap order |
| GET | `/swap/:id` | Get swap details |
| POST | `/swap/:id/stellar-escrow` | Create Stellar escrow |
| POST | `/swap/:id/stellar-complete` | Complete swap with ZK proof |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notification/inbox` | Get user notifications |
| POST | `/notification/:id/read` | Mark notification as read |

### Bitcoin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bitcoin/vault/:address/stats` | Get vault stats |
| POST | `/bitcoin/vault/:address/request-withdrawal` | Request withdrawal |


### 🔐 Environment Variables

```env
# App
PORT=4000
NODE_ENV=development
API_KEY=dev-api-key
JWT_SECRET=dev-jwt-secret

# Database
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/zeus_db

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Stellar
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_OPERATOR_SECRET=your_operator_secret

# Bitcoin
BITCOIN_RPC_URL=http://user:pass@127.0.0.1:18443
```

### 📂 Project Structure

```
zeus_service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── config/               # Configuration modules
│   ├── common/               # Shared utilities
│   ├── cache/                # Redis cache service
│   ├── queue/                # BullMQ queue processors
│   ├── abis/                 # Contract ABI JSONs
│   ├── bindings/             # TypeScript contract bindings
│   ├── modules/
│   │   ├── auth/             # Authentication module
│   │   ├── stellar/          # Stellar/Soroban integration
│   │   ├── swap/             # Swap lifecycle management
│   │   ├── zk/               # ZK-proof generation/verification
│   │   ├── bitcoin/          # Bitcoin vault operations
│   │   ├── notification/     # Real-time notifications
│   │   ├── orderbook/        # Order book management
│   │   ├── starknet/         # Starknet contract clients
│   │   └── relayer/          # Cross-chain relay service
│   └── ...
├── scripts/                   # Deployment and utility scripts
├── test/                      # Unit and E2E tests
├── docs/                      # Documentation
└── ...
```

## 🔗 Related Repositories

| Repository | Purpose |
|------------|---------|
| `zeus_stellar` | Soroban smart contracts |
| `zeus_app` | React Native mobile app |
| `zeus_web` | Next.js web application |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Run `npm run test` and `npm run test:e2e`
5. Submit a pull request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for <strong>Stellar Hacks: Real-World ZK</strong> ⚡

Making cross-chain swaps private, trustless, and verifiable.
</div>