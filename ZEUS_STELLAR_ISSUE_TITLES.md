# ZEUS Stellar Issue Titles

## Workspace Bootstrap

- **Add workspace manifests for all shared crates** — Create `Cargo.toml` files for every crate under `crates/` so the Soroban workspace has a real shared-library layer instead of empty directories.
- **Add workspace manifests for all contract crates** — Create `Cargo.toml` files for every protocol contract under `contracts/` so each Soroban domain can compile independently.
- **Expand the root Cargo workspace membership** — Update the root workspace to include shared crates explicitly so contributors can build and test common libraries in isolation.
- **Add a shared `lib.rs` pattern for empty crates** — Introduce minimal module entrypoints in each empty crate to make the workspace compile before business logic lands.
- **Create a workspace-wide module naming convention doc** — Document how modules, storage keys, events, and clients should be named so contributors do not diverge as implementation begins.
- **Add a root `Makefile` for Soroban developer workflows** — Provide standard build, test, format, and artifact commands so contributors do not invent incompatible local scripts.

## crates/zeus_types

- **Define atomic swap state types in `zeus_types`** — Add Soroban-safe structs and enums for initiator, responder, timelock, secret hash, and settlement status.
- **Define bridge transfer types in `zeus_types`** — Model deposit, withdrawal, proof reference, and settlement payloads shared by the bridge-facing contracts.
- **Define vault accounting types in `zeus_types`** — Add reusable balance, lock, release, and custody position types for vault-related contract storage.
- **Define order book types in `zeus_types`** — Add structs for encrypted orders, commitment records, nullifiers, match payloads, and cancellation requests.
- **Define verifier payload types in `zeus_types`** — Create canonical proof submission, verifier key, replay-guard, and verification-result types for proof contracts.
- **Define governance and role types in `zeus_types`** — Add proposal, vote, role, and admin-operation types that governance and access-control modules can share.

## crates/zeus_errors

- **Create common protocol error enums in `zeus_errors`** — Add reusable error codes for authorization, validation, state conflicts, and unsupported operations.
- **Create swap-domain errors in `zeus_errors`** — Add escrow and settlement-specific errors so swap contracts can fail with explicit and stable codes.
- **Create bridge-domain errors in `zeus_errors`** — Define deposit, withdrawal, proof-validation, and custody errors for bridge and vault contracts.
- **Create verifier and order book errors in `zeus_errors`** — Add proof, nullifier, matcher, and order-lifecycle errors so privacy contracts share one failure vocabulary.

## crates/zeus_events

- **Add swap lifecycle events in `zeus_events`** — Define reusable event payloads for swap creation, funding, completion, refund, and timeout actions.
- **Add bridge deposit and withdrawal events in `zeus_events`** — Create event structs that can be emitted consistently across `bitcoin_bridge` and `btc_vault` flows.
- **Add wrapped asset mint and burn events in `zeus_events`** — Define token movement event payloads for `zkbtc` and future bridge-integrated mint flows.
- **Add verifier result events in `zeus_events`** — Create proof submission, acceptance, rejection, and replay-block event payloads for the verifier surface.
- **Add order book activity events in `zeus_events`** — Define event payloads for order placement, cancellation, match execution, and settlement finalization.

## crates/zeus_interfaces

- **Define escrow client interfaces in `zeus_interfaces`** — Add traits and client wrappers for contracts that need to call the swap escrow from other modules.
- **Define bridge and vault interfaces in `zeus_interfaces`** — Create shared call signatures for deposit recording, withdrawal approval, and custody synchronization.
- **Define verifier interfaces in `zeus_interfaces`** — Add standard proof-submission and verification-query interfaces for contracts that depend on proof outcomes.
- **Define token interfaces in `zeus_interfaces`** — Create mint, burn, transfer, and supply-query interfaces for wrapped BTC and governance token consumers.
- **Define order book interfaces in `zeus_interfaces`** — Add reusable contract interfaces for order placement, match execution, and read-side market queries.

## crates/zeus_math

- **Add fixed-point math helpers in `zeus_math`** — Implement deterministic helpers for protocol fees, price ratios, and percentage calculations inside Soroban contracts.
- **Add timelock arithmetic helpers in `zeus_math`** — Create utilities for safe deadline, expiry, and grace-period calculations used by swap and bridge state machines.
- **Add bounded amount validation helpers in `zeus_math`** — Implement reusable range checks for deposits, order sizes, and mint or burn amounts.
- **Add settlement split helpers in `zeus_math`** — Provide functions for trader, relayer, and treasury fee distribution so settlement math stays consistent across contracts.

## crates/zeus_crypto

- **Add commitment hashing helpers in `zeus_crypto`** — Create reusable hashing utilities for swap commitments, order commitments, and replay-protection identifiers.
- **Add nullifier derivation helpers in `zeus_crypto`** — Implement deterministic nullifier generation that order book and verifier contracts can reuse.
- **Add secret-hash utilities in `zeus_crypto`** — Provide Soroban-safe helpers for hashlock generation and reveal validation in escrow flows.
- **Add proof payload normalization helpers in `zeus_crypto`** — Build utility functions that normalize verifier inputs before they are persisted or checked on-chain.

## crates/zeus_common

- **Add shared storage key definitions in `zeus_common`** — Centralize storage key enums and prefixes so contract modules do not create conflicting layouts.
- **Add common environment and timestamp helpers in `zeus_common`** — Provide thin wrappers for ledger time, instance checks, and repeated Soroban environment access patterns.
- **Add serialization helpers in `zeus_common`** — Implement shared encode or decode helpers for common payloads stored across multiple contracts.
- **Add protocol constants in `zeus_common`** — Define default fee bps, timeout baselines, and admin limits so contributors do not scatter constants across contracts.

## crates/zeus_access_control

- **Implement admin role storage in `zeus_access_control`** — Add reusable primitives for initializing and rotating contract administrators safely.
- **Implement operator and relayer roles in `zeus_access_control`** — Create role helpers for bridge operators, match relayers, and verifier maintainers.
- **Implement pause and unpause guards in `zeus_access_control`** — Add a shared emergency-stop mechanism that contract crates can apply consistently.
- **Implement role-check helper macros or functions in `zeus_access_control`** — Provide ergonomic authorization checks so contract code stays small and readable.
- **Implement ownership transfer events and helpers in `zeus_access_control`** — Add standard logic for pending-owner handoff and role-change observability across contracts.

## contracts/bitcoin_bridge

- **Scaffold the `bitcoin_bridge` contract entrypoint** — Replace the `.gitkeep` with a minimal Soroban contract module and storage layout for bridge state.
- **Add deposit registration to `bitcoin_bridge`** — Implement the function that records inbound Bitcoin deposit intent and links it to a ZEUS user or swap flow.
- **Add withdrawal request flow to `bitcoin_bridge`** — Implement the contract entrypoint that opens a BTC withdrawal request and persists its lifecycle status.
- **Add bridge admin configuration to `bitcoin_bridge`** — Support operator setup, trusted dependency addresses, and fee settings needed before live bridge use.
- **Emit deposit and withdrawal events from `bitcoin_bridge`** — Wire bridge lifecycle events so downstream indexers can track Stellar-side bridge activity cleanly.

## contracts/btc_vault

- **Scaffold the `btc_vault` contract entrypoint** — Create the initial contract file, storage keys, and constructor logic for vault state on Soroban.
- **Add custody position creation to `btc_vault`** — Implement storage and retrieval for BTC-backed custody positions associated with deposit flows.
- **Add swap lock tracking to `btc_vault`** — Support vault-side lock records so escrow and bridge modules can reserve BTC exposure for open swaps.
- **Add withdrawal approval state to `btc_vault`** — Implement the internal approval and release state machine required before BTC withdrawals can be finalized.
- **Emit custody and lock events from `btc_vault`** — Add observability for deposits, lock creation, releases, and withdrawal approvals.

## contracts/stellar_atomic_bridge

- **Scaffold the `stellar_atomic_bridge` contract entrypoint** — Replace the placeholder directory with a real bridge coordinator contract skeleton and state model.
- **Add swap registration to `stellar_atomic_bridge`** — Implement the entrypoint that opens a Stellar-side atomic bridge record for a cross-chain swap.
- **Add dependency address wiring to `stellar_atomic_bridge`** — Support configuration for linked verifier, vault, escrow, and token contracts without hardcoding addresses.
- **Add settlement transition logic to `stellar_atomic_bridge`** — Implement state changes for registered, funded, verified, settled, and aborted bridge swaps.
- **Emit bridge coordination events from `stellar_atomic_bridge`** — Publish events for each major bridge-state transition so clients can index execution progress.

## contracts/swap_escrow

- **Scaffold the `swap_escrow` contract entrypoint** — Create the base Soroban escrow contract with storage keys, initialization, and instance guards.
- **Add swap creation flow to `swap_escrow`** — Implement the entrypoint for opening a new escrowed swap with participants, assets, and expiry metadata.
- **Add funding flow to `swap_escrow`** — Support the logic that marks a swap as funded once the required Stellar asset has been deposited.
- **Add secret-reveal completion flow to `swap_escrow`** — Implement settlement through valid secret reveal so counterparties can complete hashlocked swaps.
- **Add refund flow to `swap_escrow`** — Implement expiry-based refund behavior so failed or abandoned swaps can be unwound safely.

## contracts/zeus_gov_token

- **Scaffold the `zeus_gov_token` contract entrypoint** — Create the governance token contract skeleton with initialization and metadata storage.
- **Add token mint and transfer logic to `zeus_gov_token`** — Implement core balance changes so governance balances can move on Soroban.
- **Add admin-controlled supply management to `zeus_gov_token`** — Support mint caps, treasury minting, and controlled supply adjustments for protocol governance.

## contracts/zk_atomic_swap_verifier

- **Scaffold the `zk_atomic_swap_verifier` contract entrypoint** — Build the initial verifier contract structure with storage keys and admin initialization.
- **Add verifier key registration to `zk_atomic_swap_verifier`** — Implement admin-controlled storage for supported proof-system identifiers and verification metadata.
- **Add proof submission flow to `zk_atomic_swap_verifier`** — Create the entrypoint that accepts proof payloads and persists verification requests on-chain.
- **Add nullifier replay protection to `zk_atomic_swap_verifier`** — Implement storage checks that prevent the same proof intent from being accepted twice.
- **Emit proof lifecycle events from `zk_atomic_swap_verifier`** — Publish events for submitted, accepted, rejected, and replay-blocked proofs.

## contracts/zk_order_book

- **Scaffold the `zk_order_book` contract entrypoint** — Create the base private-order-book contract skeleton with storage layout and initialization.
- **Add encrypted order placement to `zk_order_book`** — Implement the function that stores new order commitments without revealing trade intent on-chain.
- **Add order cancellation flow to `zk_order_book`** — Support cancellation records and state transitions so users can safely invalidate stale commitments.
- **Add nullifier tracking to `zk_order_book`** — Implement replay protection for consumed or canceled order commitments.
- **Add relayer match submission to `zk_order_book`** — Create the entrypoint for external matchers to submit a valid order match payload for settlement.
- **Emit order and match events from `zk_order_book`** — Add event coverage for order placement, cancellation, match execution, and final settlement.

## contracts/zkbtc

- **Scaffold the `zkbtc` contract entrypoint** — Create the Soroban wrapped-BTC contract skeleton with metadata, admin setup, and supply storage.
- **Add bridge-controlled minting to `zkbtc`** — Implement mint functions restricted to the configured bridge so BTC deposits can become Stellar assets.
- **Add controlled burning to `zkbtc`** — Support burn flows tied to bridge withdrawals and swap settlement exits.
- **Emit mint, burn, and transfer events from `zkbtc`** — Add the event surface needed for off-chain accounting and wallet indexing.

## contracts/mock_bitcoin_oracle

- **Scaffold the `mock_bitcoin_oracle` contract** — Add a minimal test oracle contract that exposes configurable Bitcoin block and transaction data for integration tests.
- **Add programmable deposit-proof responses to `mock_bitcoin_oracle`** — Let tests preconfigure valid and invalid BTC proof outcomes without depending on external infrastructure.

## contracts/mock_token

- **Scaffold the `mock_token` contract** — Create a simple Soroban token stub for tests that need a controllable asset without using the production token contracts.

## contracts/mock_zk_prover

- **Scaffold the `mock_zk_prover` contract** — Add a minimal proof-service stub contract that returns deterministic verification responses for tests.

## test/integration

- **Add `swap_escrow` integration tests** — Cover happy-path creation, funding, completion, timeout, and refund behavior for the Soroban escrow contract.
- **Add `bitcoin_bridge` integration tests** — Verify deposit registration, withdrawal requests, and bridge admin configuration with realistic mock dependencies.
- **Add `btc_vault` integration tests** — Test custody record creation, lock management, withdrawal approval, and event emission behavior.
- **Add `stellar_atomic_bridge` integration tests** — Validate bridge registration, dependency wiring, settlement transitions, and abort scenarios.
- **Add `zk_atomic_swap_verifier` integration tests** — Cover key registration, proof submission, replay protection, and verifier event emission.
- **Add `zk_order_book` integration tests** — Test order placement, cancellation, nullifier use, relayer matching, and event coverage.
- **Add `zkbtc` integration tests** — Validate bridge-only minting, controlled burning, supply tracking, and emitted token events.
- **Add `zeus_gov_token` integration tests** — Cover metadata setup, balance changes, supply management, and governance-token events.

## scripts/deploy

- **Add a contract-by-contract deploy script set in `scripts/deploy`** — Create Soroban deployment scripts for each contract crate so contributors can deploy modules independently without editing one monolithic script.
- **Add a dependency-aware deploy order script in `scripts/deploy`** — Create a deployment helper that deploys contracts in a valid order and records the addresses of linked dependencies.
- **Add a deployment manifest generator in `scripts/deploy`** — Write deployed contract addresses and versions to a manifest file so downstream tooling can consume them consistently.

## Observations

- **Observation: the workspace is still mostly directory scaffolding** — Nearly every `zeus_stellar` folder only contains `.gitkeep`, so contributor throughput will improve if you first agree on naming, storage, and event conventions.
- **Observation: the root workspace currently only includes `contracts/*`** — The shared crates under `crates/` are not active workspace members yet, which will block clean code sharing unless corrected early.
- **Observation: only `contracts/hello_world` has real Rust code today** — That makes it the best place to set a reference implementation pattern before parallel work starts across the empty contract crates.
- **Observation: scripts, tests, docs, and artifacts are all placeholders** — If you want parallel contributors with low merge conflict risk, seeding those support folders early will prevent every contract PR from inventing its own workflow.