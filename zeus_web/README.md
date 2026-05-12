# ZEUS Web
**Next.js Frontend for ZEUS Protocol**

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-3178C6)
![Web](https://img.shields.io/badge/Platform-Browser-1F6FEB)

ZEUS Web is the browser frontend for the ZEUS protocol. It mirrors major product journeys from the mobile app and is structured for rapid feature parity across portfolio, swap, inbox, wallet, and privacy flows.

## Table of Contents
1. [Scope](#scope)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Route Map](#route-map)
5. [Service Layer Layout](#service-layer-layout)
6. [Quick Start](#quick-start)
7. [Integration Notes](#integration-notes)
8. [Roadmap](#roadmap)

## Scope
- Browser-first interface for ZEUS account, swap, and monitoring workflows.
- Route and domain parity with zeus_app where product journeys overlap.
- Modular source layout for reusable UI and service adapters.

## Architecture
```text
zeus_web/
+-- app/                 # Next.js App Router route segments
+-- src/
|   +-- components/      # Reusable UI and feature components
|   +-- hooks/           # Client hooks for stateful flows
|   +-- services/        # API, wallet, relayer, zk, realtime adapters
|   +-- store/           # App state and derived selectors
|   +-- utils/           # Shared utilities
|   +-- types/           # Domain typings
|   +-- providers/       # App-level providers
|   +-- navigation/      # Navigation config/helpers
|   +-- constants/       # Static config and constants
|   +-- lib/             # Low-level helpers and wrappers
|   `-- abis/            # Contract ABIs used by web integrations
`-- public/              # Static assets
```

## Folder Structure
```text
zeus_web/
|-- app/
|   |-- home/
|   |-- inbox/[id]/
|   |-- portfolio/
|   |-- privacy_settings/
|   |-- swap/
|   |-- transaction_history/
|   `-- wallet_settings/
|-- src/
|   |-- abis/
|   |-- components/
|   |   `-- atomic_swap/
|   |-- hooks/
|   |-- navigation/
|   |-- providers/
|   |-- services/
|   |   |-- api/
|   |   |-- bitcoin/
|   |   |-- relayer/
|   |   |-- realtime/
|   |   |-- security/
|   |   |-- state/
|   |   |-- wallet/
|   |   |-- web3/
|   |   `-- zk/
|   |-- store/
|   |-- types/
|   |-- utils/
|   |-- constants/
|   `-- lib/
|-- public/
|   |-- assets/
|   |-- icons/
|   `-- images/
`-- README.md
```

## Route Map
- /home
- /inbox/[id]
- /portfolio
- /privacy_settings
- /swap
- /transaction_history
- /wallet_settings

These map directly to the mobile app screen domains to keep product parity predictable.

## Service Layer Layout
- services/api: HTTP clients and backend endpoint wrappers.
- services/realtime: WebSocket or streaming subscriptions.
- services/wallet: wallet auth/connect interactions.
- services/bitcoin and services/web3: chain-specific adapters.
- services/zk: proof and verifier integration points.
- services/relayer/security/state: orchestration, policy, and client state boundary logic.

## Quick Start
```bash
cd zeus_web
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Integration Notes
- Backend API and realtime endpoints should align with zeus_service contracts.
- ABI files placed under src/abis should match deployed contract versions.
- Keep route naming and feature semantics aligned with zeus_app for consistent UX.

## Roadmap
1. Add feature pages to each route segment.
2. Implement shared provider stack and state store.
3. Wire services to zeus_service REST and realtime channels.
4. Add web wallet connection and signing workflows.
5. Add dashboard-level telemetry and error boundaries.
