# Zeus Contracts

[![Scarb](https://img.shields.io/badge/Scarb-v2.6.5-orange)](https://swmansion.com/scarb/)
[![Starknet](https://img.shields.io/badge/Starknet-v0.13.1-blue)](https://www.starknet.io/)


This package contains the Cairo / Starknet smart contracts, generated ABIs and deployment helpers used by the Zeus protocol. It implements the protocol primitives (private orderbook, ZK verification, token wrapping, vaults and bridges) and exposes ABIs consumed by the backend (`zeus_service`) and client tooling.

## 📁 Key Locations

- `src/contracts/` — source Cairo contracts (core, bridges, tokens, mock)
- `abis/` — generated ABI JSONs consumed by `zeus_service`
- `scripts/deploy.py` — deployment helper that calls a Starknet CLI (e.g., `starkli`) to declare and deploy
- `Scarb.toml`, `snfoundry.toml` — build / tool config for Scarb and Foundry-style workflows

## 🚀 Quick Build & Deploy

1. Build contracts:
   ```bash
   scarb build
   ```
2. Generated artifacts and ABIs appear under target/ and abis/

3. Deploy using:
   ```bash
		python3 scripts/deploy.py 
   ```

## 🏗️ Architectural Overview (Contracts)

### Core Contracts (`src/contracts/core`)
* **ZKOrderBook.cairo** — privacy-preserving orderbook. Stores encrypted commitments, nullifiers, and match records. Relayers submit ZK proofs to match orders; contract maintains order lifecycle (place, cancel, match, cleanup) and emits compact events consumed by backend for UI deltas.
* **ZKAtomicSwapVerifier.cairo** — on-chain proof registry and verifier facade. Accepts proof submissions, performs (or simulates) verification, manages circuit keys and nullifiers to prevent replays. Exposes APIs used by `StarknetAtomicBridge` and `ZKOrderBook` to validate matching/swap proofs.



#### ZKAtomicSwapVerifier responsibilities:
* Store proof metadata and verification results
* Manage supported circuit verifier keys and relayer roles
* Provide utility methods used by `StarknetAtomicBridge` and `ZKOrderBook` to validate matching/swap proofs
* **SwapEscrow.cairo** — ERC-20 escrow for atomic swaps on Starknet. Manages swap lifecycle for STRK/ZK-wrapped tokens: initiate, fund, complete, refund, relayer flows, fee distribution and token transfer helpers.
* **BTCVault.cairo** — Starknet-side vault tracking Bitcoin UTXOs, user deposits, guardian-controlled withdrawals, and swap locks. Works with `BitcoinBridge` and `StarknetAtomicBridge` to lock/unlock/spend UTXOs for cross-chain swaps.

#### Bridge & Token Contracts (`src/contracts/bridges`, `src/contracts/tokens`)
* **BitcoinBridge.cairo** — bridge entry point for BTC deposits coming from off-chain relayers: validates proofs/merkle data, records UTXOs, interacts with `BTCVault` and mints `ZKBTC` via `ZKBTC.bridge_mint`. Also handles withdrawal initiation / guardian signing flow.
* **StarknetAtomicBridge.cairo** — higher-level cross-chain swap coordinator. Orchestrates bridge swaps (BTC↔STRK), interacts with `BTCVault`, `SwapEscrow`, `ZKAtomicSwapVerifier`, and `ZKBTC`. Handles swap initiation, fund, verification and completion (including relayer-assisted flows).



* **ZKBTC.cairo** — ERC-20-like token representing Bitcoin on Starknet. Supports mint/burn (native and bridge), bridge whitelist, mint/burn fees and caps. `BTCVault` and `BitcoinBridge` use `ZKBTC.bridge_mint` / `native_burn` for custody flows.
* **ZeusGovToken.cairo** — governance token contract (simple ERC-20 with owner/upgradeable hooks) used for protocol governance and administrative roles.

---

## 🔄 How `zeus_service` Interacts with Contracts
* **ABI consumption:** `zeus_service` loads ABIs from `zeus_contracts/abis/` (or from deployed addresses configured via environment variables) and constructs Starknet client dispatchers.
* **Event indexing:** the backend watches Starknet events (Swap events, Bridge events, Orderbook events, Vault events) to update database state and emit compact real-time deltas to mobile clients (`swap.delta`, `order.delta`, `vault.delta`, `notification`).
* **On-chain calls:** administrative or relayer operations (e.g., whitelist relayers, submit/verify proofs, execute withdrawals) are performed by `zeus_service` or by external relayer processes it orchestrates. The service uses private keys (or an account abstraction) for privileged calls.
* **Proof orchestration:** the backend accepts ZK proof submissions from off-chain prove workers (or the app), then relays proofs to `ZKAtomicSwapVerifier` or submits a proof job and records the result when verification completes.
* **ABI & address configuration:** after deployment, update `zeus_service/src/config` (or environment variables) with deployed contract addresses and ensure ABIs are available under `zeus_service/src/abis/` or referenced path.

---

## 📱 How `zeus_app` (Mobile) Interacts with Contracts (Indirectly)
The React Native app communicates with `zeus_service` over REST + WebSocket. It does not (by default) call Starknet contracts directly — instead it:
* Requests nonces and performs wallet-login flows (Starknet and Bitcoin wallets) via `/auth/*` endpoints
* Submits swap/order actions to `zeus_service` (e.g., `POST /swap`, `POST /orderbook/submit`), which then orchestrates on-chain or relayer interactions
* Subscribes to real-time topics via `Socket.IO` to receive compact deltas and notifications based on contract events
* For some user-initiated on-chain actions (e.g., signing a secret reveal or admin flows) the app may prompt the user wallet to create and sign transactions; these signed payloads are either sent to the backend or a relayer for on-chain submission

---

## 🔄 Example End-to-End Flows (High-Level)

### BTC Deposit → Mint ZKBTC
1. User broadcasts BTC deposit on Bitcoin network to address monitored by relayer
2. Relayer submits deposit proof to `BitcoinBridge.deposit_btc` (on-chain) and calls `BTCVault.deposit_utxo` through `BitcoinBridge` flow
3. `BitcoinBridge` validates proof and calls `ZKBTC.bridge_mint` to mint wrapped BTC for the user
4. Backend indexes `BitcoinDepositCompleted` and pushes a `vault.delta` to the app

### Atomic Swap (STRK ↔ BTC) via `SwapEscrow` + `StarknetAtomicBridge`
1. Initiator uses `zeus_app` to create swap (calls backend API). Backend records swap and (optionally) mints/approves tokens
2. Initiator funds the `SwapEscrow` on-chain (or backend/relayer does it on their behalf after signed approval)
3. Counterparty reveals secret / submits ZK proof via `ZKAtomicSwapVerifier` (or backend relayer submits proof), `SwapEscrow.complete_swap` is called and tokens are transferred accordingly
4. For BTC side, `BTCVault` & `BitcoinBridge` are used to mark UTXOs spent and release funds off-chain



---

## ⚙️ Deployment & Integration Notes
* Build with `scarb build` and run `python3 scripts/deploy.py` to declare & deploy contracts. The deploy script emits class hashes / addresses which must be added to `zeus_service` environment and ABIs copied to `zeus_service/src/abis` (or referenced by path)
* `zeus_service` contains Starknet client adapters in `src/modules/starknet/` that wrap ABI dispatchers. Ensure the addresses used in `zeus_service` match deployed contract addresses (env or config files)
* For local development: run a Starknet devnet (or Foundry-mocked network), run `bitcoind` regtest (if testing BTC flows) and use the backend's Docker Compose recipe (see repo root README) to wire Postgres & Redis

## 🔍 Where to Look Next
* **Contract sources:** `src/contracts/core/`, `src/contracts/bridges/`, `src/contracts/tokens/`
* **Backend integration:** update `zeus_service/src/abis/` with the latest ABIs and set deployed addresses in `zeus_service` environment
* **Mobile integration:** `zeus_app` expects the backend to expose compact deltas and swap/bridge endpoints — ensure backend indexing is running when testing UI flows
