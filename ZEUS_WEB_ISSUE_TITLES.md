# ZEUS Web Issue Titles

## Foundation and Parity

- **Replace the default Next.js landing page with a ZEUS web shell** — Turn the starter homepage into a real application entry that matches the product direction described in the repository.
- **Create a shared web app layout with navigation and status regions** — Add the persistent frame needed for portfolio, swap, inbox, privacy, and wallet journeys to feel like one product.
- **Add a route-level loading and error pattern for all app segments** — Prevent blank or broken screens as real data fetching is introduced across the web client.
- **Implement web route parity for all mobile core journeys** — Ensure the browser product covers the same flows already represented in `zeus_app` screens.
- **Create a browser-first design system for ZEUS web** — Establish reusable buttons, panels, cards, forms, tables, and empty states before feature pages diverge.
- **Add a global app state architecture for the web client** — Introduce a proper store pattern for auth, wallet, orders, swaps, and notifications instead of leaving state undefined.
- **Add a provider stack for API, wallets, realtime, and theme** — Centralize app-wide providers so future chain integrations do not sprawl through route components.
- **Create a typed domain model layer for web features** — Define shared web-side types for swaps, orders, balances, vaults, notifications, and chain entities.
- **Add environment-aware frontend configuration management** — Make the web app configurable for dev, testnet, staging, and mainnet without editing source files.
- **Add a browser compatibility support matrix and fallbacks** — Identify which features require fallback behavior on unsupported browsers before wallet and crypto flows expand.
- **Introduce consistent error mapping from `zeus_service` responses** — Normalize backend errors so web flows can render meaningful feedback across modules.
- **Add route guards for authenticated and unauthenticated web states** — Stop future private flows from being accessible without wallet auth or valid session state.

## Home and Navigation Experience

- **Build a real `/home` dashboard route** — Replace planned route scaffolding with an actual browser home experience that mirrors the mobile landing and home journey.
- **Add a hero section that communicates swap, vault, and privacy capabilities** — Give the web product a real entry narrative instead of template content.
- **Create primary navigation for swap, portfolio, inbox, history, and settings** — Make core features discoverable from the browser shell.
- **Add wallet and network status indicators to the top navigation** — Surface connection state, selected chain, and environment visibly across the app.
- **Implement mobile-responsive navigation for smaller screens** — Keep the web client usable on tablets and mobile browsers, not only desktop layouts.
- **Add breadcrumbs or contextual headers for nested routes** — Help users stay oriented as detail pages and account workflows deepen.
- **Create a command palette or quick action launcher** — Speed up power-user navigation between swap, wallet, inbox, and settings flows.
- **Add unread and pending-state badges to navigation items** — Surface actionable system state like notifications, active swaps, and pending signatures.
- **Implement route transition feedback for async pages** — Show users when data-heavy screens are loading instead of stalling silently.
- **Add empty-state navigation shortcuts on uninitialized accounts** — Direct new users toward wallet connect, deposit, and first swap actions.
- **Add a web onboarding flow for first-time users** — Explain the ZEUS privacy, bridge, and swap model before users hit raw forms.
- **Create an app footer with environment, version, and support access** — Expose production-relevant metadata and support entrypoints directly in the UI.

## Authentication and Session UX

- **Implement wallet-based login from the browser** — Wire nonce request, signing, and JWT acquisition to real backend auth flows.
- **Add session persistence and rehydration on page load** — Restore authenticated browser state cleanly after refresh or tab reopen.
- **Implement logout and full session teardown** — Remove tokens, clear wallet-bound state, and close realtime subscriptions on sign-out.
- **Add session expiration handling in the UI** — Detect expired JWTs and guide users back through re-authentication gracefully.
- **Add wallet-switch handling for active sessions** — Prevent state confusion when a user changes browser wallets mid-session.
- **Add browser-safe secure token storage strategy** — Use a deliberate storage model for auth tokens rather than ad hoc local persistence.
- **Implement account summary panels after login** — Show connected wallet identity, session status, and chain access once auth succeeds.
- **Add auth loading and signing states for wallet prompts** — Make signing flows understandable when the browser hands off to extensions or external providers.
- **Add auth error states for rejected signatures and mismatched accounts** — Explain wallet failures clearly so users know whether to retry or reconnect.
- **Implement a reconnect flow after dropped wallet providers** — Recover gracefully when extension state changes or injected providers disappear.
- **Add scoped admin or operator UI gating based on auth claims** — Prepare the browser app for future operator or governance-only surfaces.
- **Add audit-friendly session display for security settings** — Let users see active session context and browser device details from the web app.

## Wallet and Account Management

- **Build a browser wallet connection modal** — Support Starknet, Bitcoin, and future Stellar wallets from one coherent web entrypoint.
- **Add Starknet wallet adapter support for injected providers** — Connect to browser Starknet wallets instead of leaving this path undefined on web.
- **Add WalletConnect support for browser sessions** — Support wallet connections that are not injected directly into the page.
- **Implement Bitcoin wallet connection support for the browser** — Add Xverse or compatible browser wallet handling for Bitcoin-facing actions.
- **Implement Stellar wallet support for Soroban compatibility** — Prepare the web client to connect to Freighter or similar Stellar wallets as `zeus_stellar` becomes active.
- **Add wallet capability detection by chain and feature** — Identify which actions a connected wallet can actually perform before exposing flows.
- **Add account switching and disconnect controls** — Let users manage multiple connected wallets cleanly from browser UI.
- **Create address display, copy, and explorer-link components** — Standardize how wallet and contract addresses are shown and used.
- **Add receive and deposit views for supported chains** — Give users clear browser flows for funding their ZEUS activity.
- **Add wallet risk warnings for unsupported or insecure environments** — Warn on unsupported browsers, missing providers, or risky connection states.
- **Implement address book and favorite counterparties for browser users** — Save frequently used addresses and trading partners in the web experience.
- **Add wallet activity summaries in settings** — Surface connected accounts, last actions, and network usage in one management view.

## Portfolio and Holdings

- **Build the `/portfolio` route with real holdings cards** — Render account balances, asset composition, and current value using backend and chain data.
- **Add portfolio aggregation across supported chains** — Combine Bitcoin, Starknet, and future Stellar holdings into one coherent browser view.
- **Implement asset balance fetching and caching on web** — Fetch and refresh balances efficiently instead of depending on static placeholders.
- **Add portfolio allocation visuals** — Show holdings distribution by asset and by chain so users understand exposure.
- **Create a gain or loss summary module for tracked positions** — Surface value movement over time for active traders and long-term holders.
- **Add recent activity panels to the portfolio route** — Show the latest swaps, deposits, withdrawals, and notifications next to holdings.
- **Implement vault balance and custody summaries on the web** — Expose BTC vault and bridge-linked balances in a dedicated browser view.
- **Add asset filtering and sorting controls to portfolio** — Let users focus on one chain, asset type, or position state.
- **Create a historical portfolio chart experience** — Visualize net worth and value movement over time in the browser.
- **Add portfolio export and reporting actions** — Let users export browser-visible holdings and activity data for their own analysis.
- **Implement token metadata handling for custom assets** — Display names, symbols, decimals, and icons for supported contract assets across chains.
- **Add portfolio empty states for unfunded accounts** — Guide users toward deposit, connect, and first-trade actions when no assets exist yet.

## Swap Experience

- **Build the `/swap` route with a real swap form** — Replace route scaffolding with a browser swap experience that maps to ZEUS protocol actions.
- **Add amount entry, asset selection, and validation for swaps** — Prevent invalid trade inputs before they ever reach backend or wallet flows.
- **Implement quote preview and fee estimation in the web swap UI** — Show users expected output, route, and fees before they sign anything.
- **Add slippage, expiry, and privacy controls to swaps** — Bring advanced execution settings into the browser flow.
- **Create swap confirmation and signing steps for web users** — Break the swap journey into understandable review and wallet-approval phases.
- **Add real-time swap status progression in the UI** — Reflect lock, fund, verify, settle, refund, and failure states clearly on the web.
- **Add swap cancellation and refund controls where supported** — Give browser users direct recovery options when swaps time out or fail.
- **Implement a swap details view with full lifecycle metadata** — Show chain actions, transaction IDs, counterparties, and proof state in one place.
- **Add Bitcoin-backed swap flows to the browser** — Support BTC-related swap routes instead of only abstract smart-contract trading flows.
- **Add Starknet escrow-backed swap flows to the browser** — Integrate the existing Starknet-centered backend and contracts into web swap UX.
- **Add Stellar and Soroban swap variants once backend support lands** — Prepare the browser UI for `zeus_stellar` parity instead of hardcoding only one smart-contract chain.
- **Add multi-chain swap capability warnings and compatibility checks** — Block unsupported cross-chain pairs before users hit backend failures.

## Orderbook and Market Data

- **Build a browser orderbook panel to mirror the mobile app** — Give the web client a real market view instead of leaving orderbook interactions unimplemented.
- **Add market pair selectors and chain-aware market routing** — Let users browse and switch between supported trading pairs and chain combinations.
- **Implement live orderbook subscription over websocket** — Update bids, asks, and trade activity without manual refresh.
- **Add order placement forms for market and limit orders** — Enable real order creation from the browser against backend orderbook APIs.
- **Add order cancellation controls for open browser orders** — Let users manage live orders directly from the web interface.
- **Implement order history and fill history views** — Show browser users what they placed, what matched, and what remains open.
- **Add orderbook depth and spread visualizations** — Make the browser experience stronger than mobile by taking advantage of wider layouts.
- **Implement market filters, search, and sorting** — Make the orderbook usable once multiple assets and chain pairs are available.
- **Add order validation against wallet balances and limits** — Stop obviously invalid orders before they create noise in the backend.
- **Create a browser trade tape for recent fills** — Surface near-real-time execution activity to improve market awareness.
- **Add private order or hidden-liquidity presentation support** — Reflect ZEUS privacy semantics in the web market UI when the backend supports them.
- **Add watchlists and favorite markets for the browser** — Let active users save the pairs they care about most.

## Inbox, Notifications, and Activity

- **Build the `/inbox` route and detail view** — Replace route scaffolding with a working browser notification and message experience.
- **Add real inbox data fetching from `zeus_service`** — Populate the browser inbox from backend notification endpoints rather than static route shells.
- **Implement unread, read, and archived notification states** — Give the browser inbox proper lifecycle handling.
- **Add browser realtime notifications over websocket** — Surface live ZEUS events while the user is active in the app.
- **Implement notification preference controls in the web UI** — Let users tune what reaches the browser and future push channels.
- **Add notification grouping and filtering** — Make the inbox usable as swap and system activity volume grows.
- **Add detail pages that deep-link notifications to related swaps or orders** — Convert passive alerts into actionable navigation.
- **Implement notification toasts and banners for live activity** — Give users immediate feedback on important changes without requiring inbox navigation.
- **Add browser push notification support where appropriate** — Extend beyond open-tab websocket delivery for serious trading workflows.
- **Add error and system incident notifications to the web shell** — Inform users when backend, wallet, or chain services degrade.
- **Implement activity center cards on dashboard and portfolio routes** — Surface the most relevant recent events outside the inbox page.
- **Add notification retention and lazy loading in the browser** — Avoid bloated inbox rendering as message history grows.

## Transaction History and Explorability

- **Build the `/transaction_history` route with real data** — Replace placeholder routing with a functioning browser history screen.
- **Add transaction grouping by chain and type** — Help users distinguish swaps, deposits, withdrawals, bridge actions, and governance operations.
- **Implement filters for date, status, chain, and asset** — Make heavy history usage practical on the web.
- **Add transaction detail drawers or pages** — Show raw IDs, fees, signatures, confirmations, and related entities for each action.
- **Add explorer deep links for Bitcoin, Starknet, and future Stellar actions** — Let users verify activity independently on chain.
- **Implement pagination or infinite scrolling for large history datasets** — Keep browser performance predictable as account history grows.
- **Add export of transaction history from the web app** — Support CSV or similar reporting flows for power users.
- **Create transaction status timelines with confirmation counts** — Give users a clear mental model of pending versus finalized actions.
- **Add retry or recovery affordances for failed actions** — Surface what the user can still do when history items represent broken workflows.
- **Implement chain-aware fee and cost presentation** — Show actual or estimated network and protocol costs per action.
- **Add search by transaction ID, swap ID, or address** — Make the browser history usable as an investigative tool.
- **Add historical reconciliation flags for mismatched state** — Surface when frontend history and backend or chain state need attention.

## Privacy and Security Settings

- **Build the `/privacy_settings` route with real controls** — Replace the planned page with functional privacy and account-safety settings.
- **Add privacy mode toggles for supported flows** — Let users explicitly configure how much swap and market activity should be shielded.
- **Create security settings for session and device management** — Surface browser security posture in a dedicated route.
- **Add address privacy warnings for risky reuse patterns** — Educate users when wallet behaviors weaken protocol privacy.
- **Implement export and deletion requests for user data** — Prepare the browser app for serious operational and compliance usage.
- **Add signing, wallet, and connection activity logs** — Give users a transparent view of security-relevant account actions.
- **Add browser-side encrypted storage for sensitive preferences** — Protect client-side data beyond plain local storage when appropriate.
- **Create approval controls for dangerous actions** — Add secondary review for large withdrawals, chain switches, or risk-sensitive operations.
- **Add browser warnings when using unsupported mainnet environments** — Keep users from assuming production safety in dev or staging contexts.
- **Implement privacy and risk education panels inside settings** — Explain ZK, bridge, and custody tradeoffs in context.
- **Add security incident banners and remediation guidance** — Use the browser shell to guide users during service or chain incidents.
- **Add configurable alert thresholds for portfolio and swap events** — Turn privacy and security settings into actionable monitoring controls.

## Realtime and Client Data Layer

- **Create a typed HTTP service layer for `zeus_service`** — Centralize browser API calls behind typed feature-specific clients.
- **Add request interceptors for auth and environment metadata** — Standardize outbound browser calls as the product matures.
- **Implement retry and timeout policy for web requests** — Keep the browser responsive under partial backend degradation.
- **Add query caching and invalidation strategy for web data** — Avoid redundant requests while keeping portfolio and swap state fresh.
- **Create a websocket client layer with reconnect handling** — Stabilize browser realtime behavior before feature pages depend heavily on it.
- **Add subscription management for rooms and topics** — Keep browser realtime state aligned with swap IDs, markets, and vault views.
- **Implement optimistic UI where safe for order and preference flows** — Improve responsiveness without creating state confusion.
- **Add stale-state recovery when browser tabs sleep or reconnect** — Reconcile missed websocket events with backend truth after inactivity.
- **Create unified loading and error hooks for browser features** — Reduce duplication as portfolio, swap, inbox, and settings all fetch asynchronously.
- **Add request logging and developer diagnostics in non-production builds** — Make frontend-backend debugging faster during rapid development.
- **Implement feature flags for incomplete browser capabilities** — Allow the team to ship incrementally without exposing unfinished flows.
- **Add browser telemetry for request latency and websocket health** — Prepare the frontend for serious production monitoring.

## Bitcoin Browser Integration

- **Add Bitcoin chain status presentation in the web client** — Surface node health, confirmation expectations, and network mode to browser users.
- **Implement BTC receive and withdrawal browser flows** — Bring vault and bridge-related Bitcoin actions into the browser product.
- **Add Bitcoin address validation and formatting utilities in the UI** — Prevent malformed Bitcoin actions at the browser layer.
- **Add mempool-aware fee suggestions for Bitcoin actions** — Help users understand cost before they submit chain operations.
- **Create Bitcoin vault detail screens for the browser** — Expose deposit, lock, release, and withdrawal state in a dedicated UI.
- **Add HTLC status visualizations for Bitcoin-linked swaps** — Show the Bitcoin side of atomic swaps instead of hiding it behind abstract status text.
- **Add Bitcoin transaction progress and confirmation counters** — Make delayed Bitcoin settlement understandable in browser UX.
- **Implement fallback messaging for degraded Bitcoin service health** — Tell users what is blocked when Bitcoin RPC or watchtower services fail.
- **Add explorer integration specific to Bitcoin flows** — Deep-link browser users to transaction and address verification pages.
- **Create chain-aware warnings for Bitcoin mainnet actions** — Prevent casual errors when users operate on real BTC.
- **Add Bitcoin UTXO or withdrawal diagnostics for support use** — Give advanced users and operators better browser visibility into custody workflows.
- **Add BTC-specific analytics cards to history and portfolio views** — Highlight costs, timing, and custody status tied to Bitcoin operations.

## Starknet Browser Integration

- **Build Starknet network selection and status UI** — Let browser users understand which Starknet environment they are using.
- **Add Starknet contract-read hooks for browser pages** — Pull live contract state into swap, orderbook, portfolio, and governance views.
- **Implement Starknet transaction signing and submission from web** — Support browser-side wallet approval for ZEUS contract actions.
- **Add Starknet pending-transaction tracking in the UI** — Reflect submitted, accepted, and final states accurately.
- **Create browser components for Starknet-specific balances and approvals** — Show token allowances and on-chain state relevant to swaps.
- **Add Starknet event-driven updates to the browser store** — Keep UI synchronized with contract events rather than polling alone.
- **Implement Starknet fee estimation and max-fee controls** — Let users understand and tune transaction cost behavior.
- **Add graceful degradation for failed Starknet RPC providers** — Keep the browser app usable when one endpoint fails.
- **Add contract address and environment introspection in developer modes** — Help contributors confirm which Starknet contracts the web app is targeting.
- **Create browser confirmations for sensitive Starknet mainnet actions** — Make real-fund actions deliberate rather than one-click.
- **Add Starknet explorer-link components and transaction receipts** — Improve transparency and self-service debugging for browser users.
- **Add Starknet governance and ZEUS token surfaces once supported** — Prepare web-first governance workflows tied to Starknet contracts.

## Stellar and Soroban Browser Integration

- **Add a Stellar network selector to the browser app** — Prepare the UI to switch cleanly between Soroban testnet and mainnet contexts.
- **Create Soroban wallet connection and signing flows for web** — Support `zeus_stellar` participation from the browser once backend support exists.
- **Add Soroban contract-read support for browser pages** — Pull Stellar-side balances, swaps, bridge state, and governance data into the UI.
- **Implement Stellar transaction submission and lifecycle tracking** — Render submitted, pending, and finalized Soroban actions in the browser.
- **Add Stellar-specific asset and trustline handling in the UI** — Reflect Stellar concepts that do not exist on Bitcoin or Starknet.
- **Build browser views for `zkbtc` and Stellar-side ZEUS assets** — Prepare cross-chain portfolio and swap parity with the Soroban layer.
- **Add Stellar swap and bridge detail presentation** — Make Soroban-driven actions first-class in the browser history and details screens.
- **Create Stellar explorer-link patterns for transactions and contracts** — Support independent verification of browser-visible Stellar actions.
- **Add Soroban event subscription support as backend indexing matures** — Keep web state aligned with Stellar chain actions in real time.
- **Implement Stellar mainnet warnings and environment indicators** — Keep production-chain browser actions explicit and safe.
- **Add Stellar fee and resource estimation UI** — Help users understand Soroban transaction costs before signing.
- **Add browser support for future Stellar governance flows** — Make the web client ready for on-chain governance across chains.

## Mainnet, Production, and Cloud Delivery

- **Add production-safe environment separation for web builds** — Prevent accidental connection to the wrong backend or chain environment.
- **Implement a mainnet banner and environment indicator in the UI** — Make production use unmistakable once real funds are involved.
- **Add feature-gated rollout controls for unfinished browser modules** — Allow selective production activation of swap, bridge, and governance surfaces.
- **Create a frontend configuration manifest for deployed contract and backend addresses** — Keep environment drift out of hardcoded browser bundles.
- **Add robust error tracking and observability to the web app** — Capture production browser failures and degraded UX paths centrally.
- **Build an end-to-end test suite for critical web journeys** — Cover login, portfolio, swap, orderbook, inbox, and settings flows before mainnet launch.
- **Add performance budgets and bundle analysis for the browser client** — Keep heavy wallet and realtime dependencies from degrading usability.
- **Add SEO, metadata, and browser manifest refinement for production** — Prepare the public-facing browser shell for serious deployment.
- **Create CI workflows for linting, testing, and build verification** — Make web releases repeatable and safe in team workflows.
- **Add preview deployment workflows for branch testing** — Let contributors validate browser changes in realistic hosted environments.
- **Add a production hosting configuration for Vercel or equivalent** — Move the web client from local-only assumptions to real cloud deployment.
- **Add CDN and asset caching strategy for static browser resources** — Speed up global delivery of the production web app.

## Observations

- **Observation: `zeus_web` is currently far behind its README and planned structure** — The actual codebase is still essentially the default Next.js starter, so the web backlog must begin with foundational parity work before deeper chain integration.
- **Observation: the mobile app is the real product reference today** — The fastest path for `zeus_web` is to mirror `zeus_app` screen domains, service boundaries, and backend contracts before adding web-only enhancements.
- **Observation: Stellar support on the web depends on both backend and Soroban readiness** — Browser work for `zeus_stellar` should be staged behind service and contract milestones rather than assumed immediately available.
- **Observation: cloud readiness for the web app is mostly an application-ops problem, not just hosting** — Environment management, observability, test coverage, and feature gating matter as much as deploying static assets.