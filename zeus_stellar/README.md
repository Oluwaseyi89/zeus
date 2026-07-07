# ⚡ Zeus Stellar Contracts
Soroban Smart Contracts for Private Cross-Chain Atomic Swaps

[![Stellar-Soroban](https://img.shields.io/badge/Stellar-Soroban-111111?style=for-the-badge)](https://stellar.org)
[![Rust](https://img.shields.io/badge/Rust-1.81+-CE422B?style=for-the-badge)](https://rust-lang.org)
[![Stellar Hacks 2026](https://img.shields.io/badge/🏆-Stellar_Hacks_2026-FFD700?style=for-the-badge)](https://stellar.org/community/hacks)
[![Tests](https://img.shields.io/badge/Tests-25+-success?style=for-the-badge)](#)
[![Coverage](https://img.shields.io/badge/Coverage-90%25-brightgreen?style=for-the-badge)](#)

## 🎯 What This Project Does

Zeus Stellar enables private, zero-knowledge verified atomic swaps between Bitcoin and Stellar assets. Using Soroban smart contracts, it ensures:

- 🔐 **ZK-Proof Verification** — Validates Bitcoin swap proofs on Stellar without revealing sensitive data
- 🔄 **Trustless Cross-Chain Swaps** — BTC ↔ XLM/USDC with HTLC-style escrow mechanics
- 🛡️ **Replay Attack Protection** — Each transaction can only be claimed once
- ⏱️ **Autonomous Refunds** — Depositors can reclaim funds after timeout without admin intervention
- 💰 **Platform Fee Mechanism** — Sustainable protocol monetization with configurable fee basis points
- 🏭 **Dynamic Escrow Deployment** — Factory pattern for scalable, isolated escrow instances

## 🏆 Hackathon-Ready Features

| Feature | Status | Description |
|---------|--------|-------------|
| ZK Atomic Swap Verifier | ✅ Complete | Verifies RISC Zero/Noir proofs on Stellar |
| Swap Escrow Contract | ✅ Complete | Manages BTC-XLM escrow lifecycle |
| Escrow Factory | ✅ Complete | Dynamically deploys isolated escrow instances |
| Platform Fees | ✅ Complete | Fee extraction on successful swaps |
| Timeout Refunds | ✅ Complete | Autonomous refunds after configurable timeout |
| Event Emissions | ✅ Complete | Full lifecycle event tracking for off-chain indexing |
| TypeScript Bindings | ✅ Complete | Generated clients for frontend integration |
| Comprehensive Tests | ✅ Complete | 25+ unit/integration tests, 90% coverage |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Zeus Stellar Contracts                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │   Escrow        │    │   ZK Atomic Swap Verifier       │   │
│  │   Factory       │───▶│   - Proof Verification          │   │
│  │   - Deploy      │    │   - Relayer Management          │   │
│  │   - Upgrade     │    │   - Double-Spend Protection     │   │
│  └─────────────────┘    └──────────────────────────────────┘   │
│           │                           │                         │
│           ▼                           ▼                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Swap Escrow                          │  │
│  │   - Initialize with depositor, treasury, timeout, fees  │  │
│  │   - Deposit liquidity                                    │  │
│  │   - Claim swap (with ZK proof verification)             │  │
│  │   - Refund after timeout                                 │  │
│  │   - Fee extraction to treasury                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Shared Crates                        │  │
│  │   interfaces │ types │ events │ errors │ crypto │ math  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Contract Breakdown

### 1. Escrow Factory (`contracts/escrow_factory/`)
- Dynamically deploys isolated SwapEscrow instances from pre-uploaded WASM
- Admin-controlled WASM hash upgrades for future versions
- Event emission: `factory_init`, `factory_created`, `factory_upgraded`

### 2. Swap Escrow (`contracts/swap_escrow/`)
Core settlement contract for atomic swaps:
- **Initialize**: Sets depositor, treasury, timeout, fee basis points
- **Deposit Liquidity**: Authenticated funding of escrow
- **Claim Swap**: Verifies ZK proof, transfers assets, extracts fees
- **Refund**: Depositor reclaims funds after timeout
- **Emergency Withdraw**: Admin escape hatch

### 3. ZK Atomic Swap Verifier (`contracts/zk_atomic_swap_verifier/`)
- Verifies RISC Zero/Noir/UltraHonk proofs on Stellar
- Relayer whitelist management
- Pause/unpause toggling for emergency stops
- Double-spend detection with `is_tx_spent()`
- Router ID updates for proof routing

### 4. TypeScript Bindings (`packages/bindings/`)
- Generated TS clients for escrow-factory and zk-verifier
- Full type safety with exported interfaces
- Method documentation for frontend integration

## 🧪 Test Coverage

| Contract | Unit Tests | Integration Tests | Coverage |
|----------|------------|-------------------|----------|
| Swap Escrow | 5 | 3 | 90% |
| ZK Verifier | 12 | — | 92% |
| Escrow Factory | 8 | — | 85% |
| **Total** | **25** | **3** | **~90%** |

**Test Scenarios:**
- ✅ Happy path: Complete P2P atomic swap settlement
- ✅ Replay attack prevention: Double-spend attempts rejected
- ✅ Recipient mismatch: Unauthorized claims rejected
- ✅ Fee extraction: Platform fees calculated and sent to treasury
- ✅ Timeout refunds: Depositors reclaim funds after expiration
- ✅ Factory deployment: Dynamic escrow creation with configurable params
- ✅ Factory upgrade: WASM hash updates for future versions

## 🚀 Quick Start

### Prerequisites
- Rust 1.81+
- Soroban CLI (`cargo install soroban-cli`)
- Stellar development environment

## 🔐 Security Features

| Feature | Description |
|---------|-------------|
| Replay Protection | `is_tx_spent()` prevents double-spending |
| Recipient Verification | Only intended recipient can claim funds |
| Amount Integrity | Journal amount must match escrow configuration |
| Timeout Safety | Autonomous refunds after configurable timeout |
| Pause Mechanism | Admin can pause verification in emergencies |
| Relayer Whitelist | Only authorized relayers can submit proofs |
| Fee Validation | Fee basis points cannot exceed 10000 (100%) |
| Initialization Guard | Contracts cannot be re-initialized |

## 📡 Events for Off-Chain Indexing

| Event | Description |
|-------|-------------|
| `factory_init` | Factory initialized with admin and blueprint |
| `factory_created` | New escrow instance deployed |
| `factory_upgraded` | WASM hash updated |
| `swap_initialized` | Escrow initialized with parameters |
| `liquidity_added` | Liquidity deposited |
| `swap_claimed` | Successful claim with fee extraction |
| `swap_refunded` | Refund after timeout |
| `emergency_withdrawn` | Admin emergency withdrawal |

## 🛠️ Architecture Decisions

- **Factory Pattern** — Enables scalable, isolated escrow deployment without redeploying factory logic
- **WASM Upgrades** — Future-proof contract evolution without breaking existing instances
- **Event-Driven** — Full lifecycle events for off-chain indexing and monitoring
- **TypeScript Bindings** — Generated clients for seamless frontend integration
- **Workspace Modularity** — Shared crates for types, interfaces, events, and utilities

## 📂 Project Structure

```
zeus_stellar/
├── contracts/
│   ├── escrow_factory/          # Dynamic escrow deployment
│   ├── swap_escrow/             # Core escrow lifecycle
│   ├── zk_atomic_swap_verifier/ # ZK proof verification
│   ├── bitcoin_bridge/          # Bitcoin bridge primitives
│   ├── stellar_atomic_bridge/   # Cross-chain coordinator
│   ├── zk_order_book/           # Privacy-preserving order book
│   ├── zkbtc/                   # ZK-BTC token representation
│   └── mock_*/                  # Mock contracts for testing
├── crates/
│   ├── zeus_interfaces/         # Public trait definitions
│   ├── zeus_types/              # Canonical data structures
│   ├── zeus_events/             # Event payload schemas
│   ├── zeus_errors/             # Error enums
│   ├── zeus_crypto/             # Cryptographic utilities
│   └── zeus_math/               # Math primitives
├── packages/bindings/
│   ├── escrow-factory/          # Generated TS client
│   └── zk-verifier/             # Generated TS client
├── scripts/
│   ├── deploy/                  # Deployment workflows
│   ├── invoke/                  # Contract invocation
│   ├── upgrade/                 # Migration runbooks
│   └── bindings/                # Client generation pipelines
├── test/
│   ├── integration/             # End-to-end tests
│   └── fixtures/                # Test fixtures
├── artifacts/
│   ├── wasm/                    # Compiled WASM outputs
│   ├── abi/                     # Contract ABIs
│   └── bindings/                # Generated bindings
└── docs/
    ├── architecture/            # Architecture diagrams
    ├── contracts/               # Contract documentation
    └── runbooks/                # Operational runbooks
```

## 🔗 Related Repositories

| Repository | Purpose |
|------------|---------|
| `zeus_service` | Backend API service |
| `zeus_app` | React Native mobile app |
| `zeus_web` | Next.js web application |

## 📚 Documentation

- [Stellar Soroban Docs](https://developers.stellar.org/docs/smart-contracts)
- [ZEUS Protocol Architecture](https://docs.zeus-protocol.io)
- [Contract Runbooks](https://docs.zeus-protocol.io/runbooks)

## 🏅 Hackathon Recognition

This project was built for **Stellar Hacks: Real-World ZK**, demonstrating:

- ✅ **ZK Integration** — RISC Zero proof verification on Stellar with replay protection
- ✅ **Real-World Use Case** — Private BTC ↔ Stellar asset swaps
- ✅ **Comprehensive Test Coverage** — 25+ tests with 90% coverage
- ✅ **Production-Ready** — Factory pattern, event emissions, TypeScript bindings
- ✅ **Innovation** — Autonomous refunds, platform fees, double-spend prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for any new functionality
4. Run `cargo test` and `bash scripts/verify_workspace_members.sh`
5. Submit a pull request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for <strong>Stellar Hacks: Real-World ZK</strong> ⚡

Making cross-chain swaps private, trustless, and verifiable.
</div>