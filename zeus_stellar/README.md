# ZEUS Stellar Contracts
**Soroban Rust Workspace for ZEUS Protocol**

![Stellar](https://img.shields.io/badge/Stellar-Soroban-111111)
![Rust](https://img.shields.io/badge/Rust-Contracts-CE422B)
![Workspace](https://img.shields.io/badge/Cargo-Workspace-3C873A)

This package contains the Stellar Soroban contract workspace for ZEUS. It mirrors protocol domains from the Starknet implementation while following Rust workspace modularity for shared types, interfaces, events, and reusable cryptographic/math utilities.

## Table of Contents
1. [Purpose](#purpose)
2. [Current Status](#current-status)
3. [Folder Structure](#folder-structure)
4. [Contract Domains](#contract-domains)
5. [Shared Crates](#shared-crates)
6. [Scripts and Artifacts](#scripts-and-artifacts)
7. [Quick Start](#quick-start)
8. [Roadmap](#roadmap)

## Purpose
- Establish a Stellar-native execution layer for ZEUS swap and bridge primitives.
- Keep domain parity with zeus_contracts while adopting Soroban idioms.
- Isolate protocol logic into contract crates and shared utility crates.

## Current Status
- Workspace and folder scaffolding are created.
- Domain-specific directories are in place.
- No protocol implementation code has been added yet.

## Folder Structure
```text
zeus_stellar/
|-- Cargo.toml
|-- contracts/
|   |-- bitcoin_bridge/
|   |-- stellar_atomic_bridge/
|   |-- btc_vault/
|   |-- swap_escrow/
|   |-- zk_atomic_swap_verifier/
|   |-- zk_order_book/
|   |-- zeus_gov_token/
|   |-- zkbtc/
|   |-- mock_bitcoin_oracle/
|   |-- mock_token/
|   |-- mock_zk_prover/
|   `-- hello_world/
|-- crates/
|   |-- zeus_common/
|   |-- zeus_interfaces/
|   |-- zeus_types/
|   |-- zeus_events/
|   |-- zeus_errors/
|   |-- zeus_math/
|   |-- zeus_crypto/
|   `-- zeus_access_control/
|-- scripts/
|   |-- deploy/
|   |-- invoke/
|   |-- upgrade/
|   `-- bindings/
|-- test/
|   |-- integration/
|   |-- fixtures/
|   `-- helpers/
|-- artifacts/
|   |-- wasm/
|   |-- abi/
|   `-- bindings/
|-- docs/
|   |-- architecture/
|   |-- contracts/
|   `-- runbooks/
`-- examples/
```

## Contract Domains
- bitcoin_bridge: Bitcoin bridge entry and deposit/withdraw lifecycle hooks.
- stellar_atomic_bridge: Cross-domain coordinator for atomic swap execution.
- btc_vault: BTC custody/accounting primitives.
- swap_escrow: Escrow lifecycle and settlement controls.
- zk_atomic_swap_verifier: Proof verification and replay protection surface.
- zk_order_book: Privacy-preserving order management.
- zeus_gov_token and zkbtc: Tokenized governance and BTC representation.
- mocks: Isolated test doubles for oracle/token/prover workflows.

## Shared Crates
- zeus_common: Shared helpers and common constants.
- zeus_interfaces: Public trait and interface definitions.
- zeus_types: Canonical protocol data structures.
- zeus_events: Event payload schemas.
- zeus_errors: Error enums and code mapping.
- zeus_math and zeus_crypto: Deterministic utility primitives.
- zeus_access_control: Roles, permissions, and authorization patterns.

## Scripts and Artifacts
- scripts/deploy: deployment workflows.
- scripts/invoke: invocation and smoke checks.
- scripts/upgrade: migration and upgrade runbooks.
- scripts/bindings: client binding generation pipelines.
- artifacts/wasm and artifacts/abi: compiled outputs and interface data.

## Quick Start
```bash
cd zeus_stellar
cargo check
```

As implementation files are added, run per-crate checks and tests from this workspace root.

## Roadmap
1. Add contract Cargo.toml manifests for each protocol contract crate.
2. Define shared types/events/interfaces in crates.
3. Implement contract modules incrementally by domain.
4. Add integration tests under test/integration.
5. Generate and publish ABI/WASM artifacts for service and frontend integration.
