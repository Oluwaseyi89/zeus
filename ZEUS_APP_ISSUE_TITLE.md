# ZEUS App Issue Titles

## App Foundation and State

- **Replace ad hoc app boot assumptions with a production app bootstrap flow** — Make startup deterministic across providers, storage, network state, and wallet session restoration.
- **Add a typed app configuration layer for dev, testnet, staging, and mainnet** — Remove implicit environment assumptions from the mobile app before production rollout.
- **Refactor shared domain types out of implicit component contracts** — Reduce runtime mismatches across services, hooks, screens, and navigation params.
- **Add persistent app hydration and migration handling for stored state** — Make app upgrades safe when auth, wallet, and notification data schemas evolve.
- **Implement a consistent screen-level loading and error pattern** — Replace uneven async handling across screens with one coherent UX model.
- **Add feature flags for incomplete chain and protocol surfaces** — Allow production-safe rollout of Stellar, vault, and advanced swap capabilities.
- **Create a reusable mobile design system for ZEUS screens** — Standardize cards, forms, status chips, banners, and buttons before the app grows further.
- **Add app-wide telemetry hooks for major user journeys** — Instrument login, swap, wallet, orderbook, and inbox flows for production diagnostics.
- **Add centralized error boundaries and fallback navigation recovery** — Prevent fatal screen crashes from breaking the entire mobile session.
- **Implement app version and environment display for diagnostics** — Surface build, network, and backend environment context inside settings and support views.
- **Add navigation guards based on session and wallet state** — Prevent users from reaching flows that require auth, connection, or funded accounts.
- **Add deep-link routing for swap, inbox, and notification targets** — Make mobile notifications and external links open directly to meaningful screens.

## Authentication and Session Handling

- **Replace wallet-auth dev fallbacks with strict production signing flows** — Stop accepting mocked signatures and ensure every login reflects a real wallet action.
- **Use secure nonce generation and expiration semantics on the client** — Handle backend challenge flow safely and predictably in the app.
- **Add full JWT session restoration at app launch** — Resume authenticated sessions without forcing unnecessary re-logins.
- **Implement logout and session cleanup across storage and sockets** — Tear down tokens, subscriptions, and cached account state correctly.
- **Add session expiration handling and re-auth prompts** — Guide users back through signing when mobile sessions naturally expire.
- **Implement multi-wallet account switching in the app** — Let users move between Bitcoin, Starknet, and future Stellar identities cleanly.
- **Add auth failure surfaces for rejected signatures and wallet mismatches** — Explain why authentication failed instead of silently falling back.
- **Add biometric re-authentication gates for sensitive actions** — Protect withdrawals, settings changes, and major swaps with device biometrics.
- **Add device-scoped session metadata to settings** — Let users inspect and manage mobile session trust from inside the app.
- **Add explicit mainnet action confirmations during auth-sensitive flows** — Make real-fund operations more deliberate once production environments are active.
- **Add offline-aware session behavior for temporary disconnects** — Preserve user context while network is down without corrupting auth state.
- **Add support diagnostics for wallet-auth issues** — Surface device, provider, and backend context to speed up support and debugging.

## Wallet and Account Integration

- **Replace mock Starknet wallet connection logic with real provider integration** — Make the app connect to actual Starknet wallets instead of simulated addresses and calls.
- **Replace mock Bitcoin signing flows with real Xverse-compatible handling** — Support actual Bitcoin signatures and wallet interactions on mobile.
- **Add Stellar wallet support for Soroban participation** — Prepare the app for `zeus_stellar` once backend and contract integration are available.
- **Add wallet capability detection by chain and provider type** — Tailor flows based on what a connected wallet can truly do.
- **Implement account and address validation on all mobile forms** — Stop malformed destinations and identifiers before requests reach the backend.
- **Add connected wallet summaries and chain badges in the UI** — Make the current account and network state visible across the app shell.
- **Add receive, copy, and share actions for chain-specific addresses** — Improve funding and support workflows inside the mobile app.
- **Add wallet disconnect and reconnect controls in settings** — Let users recover from stale or broken provider sessions cleanly.
- **Implement address book and favorite counterparties on mobile** — Save commonly used recipients and trading partners securely.
- **Add wallet security warnings for unsupported provider states** — Alert users when connections are degraded, missing, or unsafe.
- **Add wallet activity summaries and recent actions** — Show connection, signing, and transfer history in wallet management screens.
- **Add per-wallet feature gating based on supported chains** — Prevent users from opening flows their current wallet cannot complete.

## Bitcoin Integration

- **Replace mock HTLC creation in `bitcoinService` with real Bitcoin flow orchestration** — Stop returning fake txids and scripts for atomic swap steps.
- **Implement real Bitcoin balance fetching in `useWalletBalance`** — Use live wallet or backend data rather than a mocked BTC balance.
- **Add Bitcoin address validation and network awareness** — Distinguish regtest, testnet, signet, and mainnet destinations in the mobile app.
- **Implement Bitcoin fee estimation and display in swap and withdrawal flows** — Surface actual network cost before users approve actions.
- **Add Bitcoin transaction broadcast and status tracking in the UI** — Reflect pending, confirmed, and failed actions tied to Bitcoin operations.
- **Add HTLC status visualizations tied to real backend and chain events** — Replace demo progress with accurate Bitcoin swap lifecycle representation.
- **Implement Bitcoin refund and timeout controls where supported** — Give users a mobile recovery path when hashlocked swaps expire.
- **Add vault deposit and withdrawal mobile views for Bitcoin-linked assets** — Expose custody-related workflows in a production-ready way.
- **Add Bitcoin explorer linking and transaction verification** — Let users confirm Bitcoin actions outside the app when needed.
- **Add Bitcoin network health messaging during degraded service** — Explain when Bitcoin-specific backend or RPC issues limit the mobile experience.
- **Implement BTC-specific notification and history entries** — Distinguish Bitcoin actions clearly in inbox and transaction views.
- **Add Bitcoin mainnet safety confirmations before irreversible actions** — Prevent casual mistakes once the app targets real BTC.

## Starknet Integration

- **Replace mock Starknet service calls with real contract and RPC usage** — Stop returning simulated contract behavior from the mobile app service layer.
- **Implement real Starknet balance and allowance fetching** — Populate portfolio and swap flows with live chain data instead of demo assumptions.
- **Add Starknet transaction signing and submission from mobile wallets** — Support genuine wallet approval flows for ZEUS contract actions.
- **Implement Starknet transaction lifecycle tracking in app state** — Show submitted, accepted, and finalized states clearly across screens.
- **Add contract address and network management for mobile environments** — Target the correct Starknet contracts in dev, testnet, and mainnet builds.
- **Add Starknet event-driven state refresh after on-chain actions** — Reconcile local UI state with contract outcomes rather than trusting optimistic assumptions.
- **Implement Starknet fee estimation and max-fee control UI** — Give users better visibility into execution cost and signing prompts.
- **Add fallback RPC handling for mobile Starknet flows** — Keep the app functional when one provider endpoint becomes unreliable.
- **Add Starknet explorer links in history and detail screens** — Improve transparency and user self-service around chain actions.
- **Add governance and token balance surfaces for Starknet ZEUS assets** — Prepare the app for richer on-chain participation beyond swaps.
- **Add chain mismatch handling when wallet and app environment disagree** — Prevent users from signing against the wrong Starknet network.
- **Add Starknet mainnet warnings and confirmations in mobile UX** — Make real-fund actions more deliberate and comprehensible.

## Stellar and Soroban Integration

- **Add a Stellar chain layer to the mobile app service architecture** — Create the app-side service boundary for Soroban-backed interactions.
- **Implement Stellar wallet connect and signing on mobile** — Support Soroban-compatible wallets once backend support exists.
- **Add Stellar balance and asset fetching to portfolio flows** — Make `zeus_stellar` assets first-class in the mobile account view.
- **Build Stellar swap variants in the mobile swap screen** — Extend the current flow to handle Soroban-based settlement paths.
- **Add Stellar bridge and vault state presentation to the app** — Show Soroban-side bridge, custody, and wrapped-asset status.
- **Implement Stellar transaction lifecycle tracking in app state** — Treat Soroban actions like other production chain workflows.
- **Add Stellar network selection and environment messaging** — Keep users aware of testnet versus mainnet behavior on mobile.
- **Add Stellar address validation and asset metadata handling** — Respect Stellar-specific address and asset concepts in the UI.
- **Add Stellar explorer links for history and details** — Give users visibility into Soroban and Stellar actions outside the app.
- **Add Soroban event and backend delta handling in the mobile store** — Keep mobile UI updated when Stellar-side state changes.
- **Add Stellar-specific fee presentation and warnings** — Make Soroban resource costs and behavior understandable in the app.
- **Add mainnet gating for Stellar features until backend maturity** — Prevent mobile release from exposing incomplete Soroban paths.

## Swap, Orderbook, and ZK Flows

- **Replace simulated swap fallback paths in `SwapScreen` with deterministic production behavior** — Stop masking backend and chain failures with demo-only success flows.
- **Implement real swap quote, preview, and confirmation states** — Show actual route, fee, and timing information before submission.
- **Add chain-aware asset selectors and pair validation** — Prevent users from attempting unsupported or invalid swap combinations.
- **Implement orderbook data fetching from real backend APIs** — Replace mocked relayer data with live encrypted orderbook activity.
- **Add order placement, cancellation, and order history flows on mobile** — Make the app capable of managing real market participation.
- **Add partial-fill and swap progress presentation in the UI** — Reflect real backend lifecycle complexity rather than one-step status changes.
- **Replace stubbed crypto utilities with production-safe implementations** — Stop relying on demo hashing and placeholder cryptography on-device.
- **Integrate real ZK proof generation or proof-job orchestration** — Connect the app to the actual proving pipeline instead of placeholder proof output.
- **Add proof verification status and recovery messaging to swap UX** — Explain when the proof layer is pending, rejected, or degraded.
- **Implement secure secret generation, storage, and reveal handling** — Protect hashlock secrets used in cross-chain swaps on mobile devices.
- **Add slippage, timeout, and privacy controls to the swap interface** — Give users production-grade control over execution parameters.
- **Add detailed swap history and dispute-oriented diagnostics** — Help users and operators inspect broken or contested mobile swap flows.

## Realtime, Notifications, and Background Behavior

- **Strengthen websocket connection and reconnection handling in `socket.ts`** — Keep mobile sessions synchronized during app backgrounding and flaky networks.
- **Add room-subscription lifecycle management tied to navigation state** — Avoid stale subscriptions and missed events as users move through the app.
- **Implement push notification delivery for mobile devices** — Extend beyond in-app websocket messaging so important events reach inactive users.
- **Add notification preferences and channel controls in settings** — Let users decide how swap, order, vault, and system alerts are delivered.
- **Add inbox pagination, filtering, and richer detail rendering** — Make the notification center usable once volume grows beyond demo scale.
- **Implement background refresh for critical pending swap state** — Keep time-sensitive flows current even when the app is resumed after inactivity.
- **Add app-resume reconciliation with backend truth** — Refresh swaps, balances, and notifications after the app wakes from background state.
- **Add offline-aware banners and queued-action messaging** — Explain when actions are delayed because the app is disconnected.
- **Add notification deep links into swap, order, and vault screens** — Turn mobile alerts into direct navigation to the relevant workflow.
- **Add websocket health diagnostics to support and settings surfaces** — Help users and operators understand live connection issues.
- **Add live delta handling for future Stellar and multi-chain events** — Prepare the store and hooks for Soroban-backed activity streams.
- **Add delivery acknowledgement handling for important in-app notifications** — Improve reliability around time-sensitive swap and custody events.

## Security, Privacy, and Device UX

- **Add secure storage hardening for tokens, secrets, and wallet-linked metadata** — Review what lives in device storage before mainnet launch.
- **Implement privacy-safe clipboard and share behavior for sensitive values** — Reduce accidental leakage of secrets, txids, or wallet details.
- **Add biometric protection for app unlock and sensitive confirmations** — Use device security to strengthen high-value flows.
- **Add jailbreak or root detection hooks for production risk controls** — Warn or restrict behavior on compromised devices when real funds are involved.
- **Implement screenshot and screen-recording protection where appropriate** — Reduce accidental exposure of sensitive swap or wallet information.
- **Add device trust indicators and session metadata in settings** — Show what device and environment the current account session is using.
- **Add privacy education around wallet reuse and chain linking** — Help users understand how behavior can weaken protocol privacy.
- **Add app-level risk confirmations for mainnet and large actions** — Prevent accidental approvals when values or environments are high-risk.
- **Improve accessibility across screens, gestures, and text scaling** — Make the app usable under assistive and large-text mobile settings.
- **Add localization readiness for labels, dates, and numeric formatting** — Prepare the mobile client for broader production usage.
- **Add haptic and animation refinements for major state transitions** — Improve feedback and confidence during signing, swap, and completion phases.
- **Add performance profiling and render optimization on critical screens** — Keep portfolio, swap, and orderbook flows smooth on lower-end devices.

## Release, Mainnet, and Operations

- **Add EAS or equivalent release pipeline hardening for mobile builds** — Make production build and signing workflows repeatable for iOS and Android.
- **Create dev, staging, and production app config separation** — Stop relying on local-only assumptions for backend and chain targets.
- **Add mobile crash reporting and production telemetry** — Capture field failures once the app is distributed beyond internal testing.
- **Build an end-to-end mobile QA suite for critical user journeys** — Cover login, wallet connect, swap, orderbook, inbox, and history before broader rollout.
- **Add chain-specific smoke tests for mobile release candidates** — Validate Bitcoin, Starknet, and future Stellar behavior before publishing builds.
- **Implement OTA update strategy and rollback planning** — Manage urgent mobile fixes safely after production release.
- **Add release gating for unfinished chains and protocol modules** — Keep the app shippable while parts of the multi-chain stack are still maturing.
- **Add production analytics for retention and journey completion** — Measure where users stall across wallet connect, deposit, and swap flows.
- **Create incident and degraded-service messaging in the app shell** — Communicate backend, wallet, or chain outages clearly to production users.
- **Add mainnet-specific asset, fee, and network confirmations** — Make real-value actions unmistakable in mobile release builds.
- **Add app-store readiness work for permissions, privacy, and policy disclosures** — Prepare the mobile app for serious distribution beyond hackathon or internal builds.
- **Create a mobile support and diagnostics screen for live operations** — Give users and support staff practical context when production issues happen.

## Observations

- **Observation: `zeus_app` already has real product shape but still relies on multiple mocks** — The mobile app is much further along than `zeus_web`, but Bitcoin, Starknet, crypto, and proof layers still contain demo-only behavior.
- **Observation: the mobile app is the strongest functional reference for the broader ZEUS UX** — It should continue to guide parity work in `zeus_web`, especially around screens, flows, and backend expectations.
- **Observation: full Stellar support will require coordinated backend and Soroban milestones** — Mobile UI work for `zeus_stellar` should be staged behind `zeus_service` and contract readiness rather than assumed immediate.
- **Observation: mobile production readiness is as much about device security and release operations as chain logic** — Mainnet launch requires secure storage, biometrics, QA, crash telemetry, and release discipline in addition to chain integration.