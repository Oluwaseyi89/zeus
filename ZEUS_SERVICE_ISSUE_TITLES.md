# ZEUS Service Issue Titles

## Core Platform

- **Replace TypeORM `synchronize` with versioned migrations** — Move database schema management from auto-sync to explicit migrations so production deploys do not mutate state unpredictably.
- **Add environment-specific config validation at startup** — Validate required secrets, RPC URLs, and chain settings before boot so bad deployments fail fast.
- **Introduce a centralized config schema module** — Replace scattered `process.env` access with typed configuration to reduce runtime misconfiguration across modules.
- **Split dev, testnet, and mainnet runtime profiles** — Add first-class environment profiles so the backend can safely target regtest, testnet, and production networks.
- **Add a backend service manifest for active chain integrations** — Expose which chains and modules are enabled at runtime so clients and operators can detect capability mismatches.
- **Implement correlation IDs across all requests and jobs** — Thread a request or job ID through HTTP, queue, and chain interactions so failures can be traced end-to-end.
- **Create a global exception filter with structured error responses** — Normalize API failures into stable machine-readable responses instead of ad hoc thrown errors.
- **Add startup dependency readiness checks** — Verify Redis, Postgres, Bitcoin RPC, Starknet RPC, and future Stellar RPC are reachable before the service accepts traffic.

## API and Transport

- **Version the REST API under `/api/v1`** — Introduce explicit versioning so future multi-chain features can evolve without breaking existing mobile clients.
- **Generate OpenAPI documentation for all controllers** — Publish accurate API docs from Nest decorators so frontend and partner integrations stay aligned.
- **Standardize pagination for list endpoints** — Use one cursor or offset pattern across inbox, orders, swaps, metrics, and future chain-index endpoints.
- **Add response envelopes for all controllers** — Return consistent status, data, error, and metadata fields so clients do not need endpoint-specific parsing logic.
- **Add request size limits and body validation globally** — Reject oversized or malformed payloads early to reduce attack surface and resource waste.
- **Add per-route rate limiting middleware** — Protect auth, swap, wallet, and notification endpoints from abuse before exposing the service publicly.
- **Implement API key scopes and role-based access** — Replace one global admin key with scoped credentials for operators, relayers, and internal automation.
- **Add webhook delivery support for swap lifecycle events** — Let external systems subscribe to settlement events without polling the service continuously.
- **Add idempotency-key support for state-changing endpoints** — Prevent duplicate swaps, withdrawals, or notifications when clients retry requests.
- **Expose a machine-readable service capabilities endpoint** — Return supported chains, deployed contracts, and enabled features so clients can adapt at runtime.

## Auth and Session Security

- **Replace in-memory nonce storage with Redis-backed nonces** — Persist wallet login challenges outside process memory so auth works across multiple instances.
- **Use cryptographically secure nonce generation** — Replace `Math.random()` nonce creation with a secure source suitable for production wallet authentication.
- **Expire and revoke JWT sessions centrally** — Store active sessions in Redis or Postgres so logout and admin invalidation work across replicas.
- **Implement Starknet signature verification without dev fallback** — Remove the non-production auto-accept path and fully validate signed wallet challenges.
- **Add Bitcoin wallet signature verification for login** — Support native Bitcoin-based auth flows instead of assuming Starknet-centric verification only.
- **Add Stellar wallet challenge and signature verification** — Introduce Soroban-compatible auth so `zeus_stellar` can be accessed through the same backend identity model.
- **Add audit logging for authentication events** — Persist login attempts, nonce issuance, token creation, and failed verification attempts for security review.
- **Add session device metadata and revocation tools** — Track device, IP, and last activity so users and admins can revoke specific sessions safely.
- **Implement auth rate limiting by IP and address** — Protect nonce generation and wallet login from brute-force or spam attacks.
- **Add short-lived privileged action tokens** — Require elevated confirmation tokens for withdrawals, config changes, and relayer-sensitive actions.

## Wallet Module

- **Replace mock wallet connect responses with provider-aware connections** — Turn `WalletService.connect` into real chain-aware connection handling rather than a placeholder success object.
- **Implement real message signing adapters per chain** — Support Bitcoin, Starknet, and Stellar signing flows instead of the current dev stub signature string.
- **Add wallet capability detection** — Detect which chains and signing methods a connected wallet actually supports so the backend can enforce compatible flows.
- **Add wallet address validation by chain type** — Reject malformed Bitcoin, Starknet, and Stellar addresses before they enter swap or auth workflows.
- **Store verified wallet-to-user mappings** — Persist trusted wallet associations so users can manage multiple addresses securely across chains.
- **Add wallet risk scoring hooks** — Create extension points for fraud checks, sanctions screening, or internal policy checks before sensitive actions.
- **Add wallet session locking after inactivity** — Force re-authentication after inactivity so long-lived sessions are harder to abuse.
- **Add wallet allowlist support for withdrawals** — Let users or admins restrict payout destinations for production withdrawals.

## Bitcoin RPC and Node Integration

- **Add Bitcoin RPC health and latency monitoring** — Measure and expose Bitcoin node availability before the service depends on it for live flows.
- **Support RPC cookie auth in addition to URL credentials** — Allow the backend to connect to hardened Bitcoin Core deployments without embedding credentials in URLs.
- **Add Bitcoin network selection for regtest, testnet, signet, and mainnet** — Make network targeting explicit so deployments cannot accidentally point to the wrong chain.
- **Add retry and timeout policy around Bitcoin RPC calls** — Make node communication resilient to transient failures instead of failing every request immediately.
- **Add mempool and fee-estimation RPC helpers** — Expose production-grade fee and mempool data instead of only the current raw mempool watcher logic.
- **Add UTXO lookup and normalization utilities** — Standardize how unspent outputs are fetched, validated, and represented inside the service.
- **Add block-height and confirmation tracking services** — Track confirmations for deposits and withdrawals so the backend can enforce settlement safety thresholds.
- **Implement Bitcoin transaction broadcast with result tracking** — Persist broadcast attempts and their outcomes rather than returning fire-and-forget responses.
- **Add Bitcoin address type detection** — Distinguish legacy, SegWit, and Taproot outputs so withdrawal and HTLC logic can branch safely.
- **Add chain reorg detection for Bitcoin state** — Detect invalidated confirmations and roll back dependent service state when reorgs occur.

## Bitcoin HTLC and Swap Scripts

- **Replace HTLC script stubs with real redeem script generation** — Implement proper Bitcoin HTLC script construction instead of the current placeholder descriptors.
- **Add HTLC redeem transaction building** — Construct valid redemption transactions for successful cross-chain swap completion.
- **Add HTLC refund transaction building** — Support timeout-path fund recovery when a swap counterparty fails to complete.
- **Add secret preimage validation for HTLC redemption** — Verify the revealed secret matches the expected hashlock before allowing completion logic.
- **Add Bitcoin witness and script-signing helpers** — Build production-ready signing logic for legacy and SegWit spend paths.
- **Add HTLC fee estimation and dust checks** — Prevent invalid transactions by checking output dust and fee sufficiency before signing.
- **Add automated HTLC timeout monitoring** — Detect expired swap windows and trigger refund workflows rather than relying on manual intervention.
- **Add HTLC regression tests against regtest** — Validate create, redeem, and refund paths against a live Bitcoin test environment.

## Bitcoin Vault Flows

- **Add persistent withdrawal request records for Bitcoin vault operations** — Store withdrawal intent and status in the database instead of relying on transient responses.
- **Track withdrawal state transitions from requested to finalized** — Model approval, broadcast, confirmation, and failure states for Bitcoin withdrawals.
- **Add user-facing withdrawal history queries** — Let clients retrieve historical Bitcoin vault actions tied to an account or wallet.
- **Add admin approval workflows for high-risk vault actions** — Require explicit approval paths for large or policy-sensitive withdrawals.
- **Add Bitcoin withdrawal idempotency and replay protection** — Prevent the same withdrawal payload from being processed more than once.
- **Add vault balance reconciliation jobs** — Compare internal view of custody state with on-chain state and flag mismatches automatically.
- **Add vault anomaly alerts for unexpected UTXO changes** — Detect suspicious or unexplained changes in monitored Bitcoin positions.
- **Add chain-aware notification hooks for vault events** — Notify users and operators when deposits, locks, releases, or withdrawals change status.

## Starknet Runtime

- **Replace simulated Starknet invokes with real account-backed transactions** — Remove the placeholder invoke path and ensure writes always use real account logic.
- **Harden Starknet provider initialization for current RPC standards** — Update provider setup so it works reliably across modern Starknet endpoints.
- **Add Starknet transaction receipt polling with finality awareness** — Distinguish submitted, accepted, and finalized states before reporting success to clients.
- **Persist Starknet transaction hashes against service operations** — Link swap, orderbook, and vault actions to their on-chain transaction records for later recovery.
- **Add Starknet nonce management for concurrent transactions** — Prevent account transaction collisions when multiple backend actions execute in parallel.
- **Add per-contract address validation at startup** — Ensure configured ABI and contract address pairs are complete and usable before serving traffic.
- **Add Starknet event indexing for core ZEUS contracts** — Watch escrow, bridge, vault, and orderbook events instead of relying only on direct invoke responses.
- **Add Starknet fee estimation and max-fee policy controls** — Make transaction cost handling configurable and safe for production account usage.
- **Add support for multiple Starknet RPC endpoints with failover** — Keep the service operational when a provider degrades or becomes unavailable.
- **Add Starknet chain ID awareness across environments** — Prevent testnet and mainnet transaction mix-ups during deploys and operations.

## Stellar and Soroban Integration

- **Create a `stellar` module in `zeus_service`** — Add a dedicated NestJS module for Soroban RPC, contract clients, and Stellar chain services.
- **Implement Soroban RPC provider bootstrapping** — Introduce typed RPC clients for Stellar testnet and mainnet the same way Starknet currently has provider setup.
- **Add Soroban contract address registry support** — Manage deployed `zeus_stellar` contract addresses per environment so service logic can target the right contracts.
- **Add Soroban ABI or contract-spec loading utilities** — Build the Stellar equivalent of the Starknet ABI client factory so backend code can call Soroban contracts cleanly.
- **Add Stellar wallet verification in auth workflows** — Support challenge creation and signature verification for Stellar users entering the ZEUS backend.
- **Implement Stellar swap escrow service bindings** — Wire backend swap operations to the future `zeus_stellar` escrow contract APIs.
- **Implement Stellar bridge service bindings** — Add service-side clients for Stellar atomic bridge, Bitcoin bridge, and vault contracts as they come online.
- **Implement Stellar wrapped asset service bindings** — Add backend support for `zkbtc` and `zeus_gov_token` operations on Soroban.
- **Add Stellar event indexing and normalization** — Convert Soroban events into the same service-side models used for Starknet and Bitcoin workflows.
- **Add Stellar transaction lifecycle tracking** — Persist submitted Soroban transactions and reconcile them to final chain outcomes.
- **Add Stellar environment switching for testnet and mainnet** — Allow production deployments to upgrade from testnet safely without code rewrites.
- **Add Stellar RPC failover and retry controls** — Treat Soroban RPC as a first-class production dependency with fallback behavior.

## Chain Abstraction and Multi-Chain Compatibility

- **Introduce a shared chain-provider abstraction across backend modules** — Stop hardcoding Starknet assumptions into swap and orderbook services so Stellar and Bitcoin paths can coexist cleanly.
- **Add canonical chain identifiers to DTOs and stored entities** — Make every swap, wallet, order, and event explicitly chain-aware.
- **Create a unified asset registry for Bitcoin, Starknet, and Stellar assets** — Normalize symbols, decimals, addresses, and chain IDs across backend logic.
- **Add cross-chain operation state models** — Track one business flow across multiple chains without losing chain-specific detail.
- **Add chain capability negotiation for clients** — Tell mobile and web apps which pairs and actions are currently supported in a given environment.
- **Add chain-specific fee policy interfaces** — Let the backend compute and expose transaction costs consistently across Bitcoin, Starknet, and Stellar.
- **Add network-level feature flags per chain** — Allow deployments to enable or disable entire chain surfaces during phased rollout.
- **Add cross-chain contract dependency validation** — Ensure swap, bridge, vault, and verifier contracts are configured coherently across all enabled chains.

## Swap Service

- **Persist chain-aware swap metadata in the swap entity** — Expand swap records beyond Starknet-centric fields so cross-chain execution can be tracked correctly.
- **Add swap creation flows for Stellar settlement paths** — Extend `SwapService.createOrder` so Soroban-based swaps can be created and tracked natively.
- **Add Bitcoin-to-Starknet settlement orchestration** — Coordinate Bitcoin lock state with Starknet escrow state instead of treating them as isolated operations.
- **Add Bitcoin-to-Stellar settlement orchestration** — Create the backend path that can coordinate Bitcoin with Soroban once `zeus_stellar` contracts are live.
- **Add reverse settlement flows for wrapped-BTC redemption** — Support burns or releases that complete the off-ramp from smart-contract chains back to Bitcoin.
- **Move swap secret handling out of dev-only storage** — Replace optional plaintext secret persistence with a secure production-safe secret strategy.
- **Add swap timeout workers for automatic refunds** — Detect expired swaps and trigger the correct refund path per chain.
- **Add swap lifecycle recovery jobs** — Reconcile partially completed swaps after crashes or RPC outages using on-chain truth.
- **Add partial-fill support to swap records and APIs** — Allow one order to settle through multiple counterparties without data model hacks.
- **Add fee accounting fields to swap persistence** — Record network fees, relayer fees, and protocol fees separately for reporting and settlement.
- **Add swap simulation and quote endpoints** — Let clients preview expected costs and chain actions before creating a live swap.
- **Add dispute and failure reason tracking for swaps** — Persist structured failure causes so operators can debug broken cross-chain flows.

## Orderbook Service

- **Replace placeholder order submission IDs with persistent orders** — Turn `submitOrder` into a database-backed order flow instead of returning random in-memory identifiers.
- **Create an order entity and repository layer** — Persist order intent, market, status, chain pair, and lifecycle timestamps for later matching and analytics.
- **Add order cancellation endpoints and service logic** — Let users or relayers cancel open orders safely and reflect the result in notifications and clients.
- **Add order query endpoints with market filters** — Return open, filled, canceled, and historical orders in a way clients can actually render.
- **Implement a matching engine for price-time priority** — Replace the empty query and fake acceptance flow with real market-side matching logic.
- **Add partial fill accounting for matched orders** — Track remaining quantity and cumulative fills across multiple matches.
- **Add market-specific rooms and normalized deltas** — Publish consistent `order.delta` payloads with market, price, size, and fill details.
- **Add cross-chain market definitions to the orderbook** — Support pairs that settle across Starknet, Stellar, and Bitcoin-backed assets.
- **Add slippage and limit-price enforcement** — Prevent matches from executing outside user-defined price tolerances.
- **Persist orderbook snapshots for recovery** — Allow the service to rebuild live order state after restart instead of starting from empty memory.
- **Add orderbook indexing from on-chain contract events** — Reconcile backend order state with future Starknet and Soroban private orderbook contracts.
- **Add market abuse protections for spam order submission** — Rate limit and validate order creation to defend the matching engine.

## Relayer and Watchtower

- **Expand the Bitcoin watchtower beyond mempool polling** — Track relevant deposits, confirmations, and timeout conditions rather than only logging mempool size.
- **Persist watchtower checkpoints and last processed heights** — Let chain watchers resume safely after restart instead of reprocessing blindly.
- **Add relayer state persistence** — Track multi-step relay workflows in the database so crashes do not lose bridge progress.
- **Add relayer worker queues for chain-specific jobs** — Split Bitcoin, Starknet, and Stellar relay work so backlog on one chain does not block the others.
- **Add relayer failover support for multi-instance deployments** — Coordinate active workers across replicas to avoid duplicate relay execution.
- **Add signed relayer action audit logs** — Record who approved or executed sensitive bridge operations for compliance and incident response.
- **Add relayer timeout and compensation logic** — Detect stuck relay operations and either retry, reassign, or fail them cleanly.
- **Add chain bridge event correlation across relayers** — Tie one business action to its Bitcoin, Starknet, and Stellar transaction footprints.
- **Add relayer budget and fee accounting** — Track fees spent per job so production operations can monitor bridge sustainability.
- **Add a relayer status API for operators** — Surface queue depth, pending actions, and failing workflows to an operations dashboard.

## ZK Module

- **Replace dummy proof generation with a real prover integration interface** — Turn `ZkService` into an adapter boundary for actual proof systems instead of returning placeholders.
- **Replace dummy proof verification with verifiable backend checks** — Validate proof payloads before relaying them to contracts or marking workflows complete.
- **Add prover job orchestration and status tracking** — Model proof generation as async work with progress, retry, and failure states.
- **Add proof artifact storage for audit and replay safety** — Persist generated proofs and verification metadata securely for later investigation.
- **Add proof input normalization utilities** — Standardize how swaps, orders, and bridge events become proof inputs across chains.
- **Add proof expiration and replay-protection rules** — Prevent stale or duplicated proofs from being reused in settlement paths.
- **Add chain-specific verifier adapters for Starknet and Stellar** — Route the same business proof through the correct on-chain verifier surface.
- **Add prover health checks and capacity metrics** — Make proof infrastructure observable before it becomes part of mainnet-critical flow.

## Notification Module

- **Replace mock email behavior with a real provider abstraction** — Support production email delivery without falling back to logging and fake inbox entries.
- **Replace mock SMS behavior with a real provider abstraction** — Send real SMS alerts and capture provider delivery outcomes instead of logging placeholders.
- **Add notification delivery acknowledgements from clients** — Distinguish sent from actually received so retry behavior becomes meaningful.
- **Add exponential backoff and dead-letter queues for notification retries** — Prevent infinite hot-loop retries and retain permanently failed jobs for analysis.
- **Remove duplicate retry loops between interval worker and queue worker** — Consolidate notification retry strategy so one job is retried in one place consistently.
- **Add notification preference storage per user** — Let users opt into or out of certain event categories before push volume grows.
- **Add push notification provider integration for mobile** — Support device push alongside websocket delivery so users receive events while offline.
- **Add inbox pagination and filtering** — Make the stored notification inbox usable at scale for active traders.
- **Add notification deduplication keys** — Prevent repeated retries from generating multiple records for the same logical event.
- **Add room membership audit and cleanup** — Prevent stale websocket subscriptions from leaking data across user sessions.

## Queue and Background Jobs

- **Replace raw Redis list queues with a more robust job model** — Add retries, metadata, scheduling, and dead-letter support beyond `LPUSH/BRPOP`.
- **Add job payload schemas for all queue types** — Validate queued work before processors attempt to run malformed payloads.
- **Add queue metrics for latency and backlog depth** — Monitor job accumulation before it becomes user-visible service degradation.
- **Add scheduled job support for timeout and reconciliation tasks** — Support delayed execution for refunds, retries, and health checks natively.
- **Add queue worker shutdown hooks** — Drain or checkpoint active jobs during deploys so rolling restarts do not lose work.
- **Add poison-job quarantine handling** — Move repeatedly failing jobs aside for operator inspection instead of reprocessing forever.
- **Add worker concurrency controls per queue** — Tune throughput independently for notifications, relayers, reconciliations, and proof jobs.
- **Add queue tenancy or namespace isolation per environment** — Prevent dev, staging, and production workers from touching each other’s jobs accidentally.

## Monitoring and Operations

- **Replace logger-only metrics with a real metrics backend** — Make `MonitoringService` publish counters, gauges, and histograms instead of debug strings.
- **Expose Prometheus-compatible `/metrics` output** — Let cloud infrastructure scrape service health, latency, queue, and chain metrics.
- **Add a real `/health` endpoint with dependency status** — Upgrade the current static health response to include Postgres, Redis, Bitcoin, Starknet, and Stellar readiness.
- **Add structured JSON logging with request context** — Make logs queryable in cloud platforms and central log aggregators.
- **Add latency histograms for external RPC calls** — Track provider performance and detect degraded chain infrastructure early.
- **Add error-rate metrics by module** — Surface whether auth, swap, queue, notification, or chain adapters are failing disproportionately.
- **Add on-call alerts for queue backlog and chain failures** — Notify operators before users notice broken settlement or delivery flows.
- **Add transaction lifecycle tracing across chains** — Follow a swap or withdrawal from API request through chain confirmation in one observable trace.
- **Add audit dashboards for relayer and vault operations** — Let operators monitor sensitive movement of value at a glance.
- **Add cost and fee observability by chain** — Track Bitcoin fees, Starknet gas, and future Stellar fees to inform production policy.

## Persistence and Data Integrity

- **Add uniqueness constraints for critical identifiers** — Enforce unique swap IDs, order IDs, transaction hashes, and notification IDs at the database layer.
- **Add foreign key relationships across core entities** — Tie swaps, notifications, sessions, and future wallets together explicitly for integrity and cleanup.
- **Add optimistic locking on mutable financial records** — Prevent concurrent updates from corrupting swap or withdrawal state under load.
- **Add transactional boundaries around multi-step writes** — Ensure state changes and notifications succeed or fail together where business consistency matters.
- **Add archival strategy for completed swaps and notifications** — Keep active tables lean without losing long-term operational history.
- **Add backup validation and restore drills for Postgres** — Treat persistence as production-critical before cloud rollout.
- **Add DB indexes for expected query patterns** — Optimize inbox, swap lookup, withdrawal status, and future chain-event queries before scale arrives.
- **Add an audit log entity for sensitive mutations** — Record administrative changes, relayer actions, and withdrawal approvals in a tamper-evident history.

## Security Hardening

- **Add Helmet and production HTTP security headers** — Harden the public API against common browser and proxy attack classes.
- **Add CORS allowlists for non-development environments** — Replace open CORS with explicit trusted origins before web clients hit production.
- **Add log redaction for secrets and sensitive payloads** — Prevent JWTs, private keys, and wallet payloads from leaking into log streams.
- **Add secret rotation support for JWT and API keys** — Allow secure credential rollover without hard downtime.
- **Add admin action approval workflows for sensitive operations** — Require stronger control around withdrawals, relayer changes, and production config updates.
- **Add abuse detection around swap and order creation** — Block spam or malicious traffic patterns before they reach expensive chain integrations.
- **Add payload sanitization for notification and webhook content** — Prevent user-supplied content from becoming a rendering or downstream injection vector.
- **Add security regression tests for auth and API guards** — Lock in current protections before the attack surface expands with new chains.

## Testing and Reliability

- **Add unit tests for auth, wallet, and queue modules** — Cover the most obviously stubbed and security-sensitive service layers first.
- **Add integration tests for Starknet account invocation flows** — Verify real contract write paths instead of only relying on best-effort logging.
- **Add regtest-backed Bitcoin integration tests** — Exercise vault, HTLC, and withdrawal paths against a real local Bitcoin node.
- **Add Soroban integration tests for the future Stellar module** — Prepare the service for `zeus_stellar` by validating contract calls and event ingestion in CI.
- **Add multi-chain end-to-end swap tests** — Prove the backend can coordinate real cross-chain flows before mainnet rollout.
- **Add restart recovery tests for queued and in-flight work** — Validate that swaps, notifications, and relayer jobs survive process crashes.
- **Add RPC outage chaos tests** — Ensure degraded Bitcoin, Starknet, or Stellar providers do not cascade into total service failure.
- **Add load tests for websocket fan-out and swap creation** — Measure the service under realistic client and market activity.
- **Add canary deployment verification tests** — Run a small smoke suite automatically during staged production rollout.
- **Add deployment smoke tests for each enabled chain** — Confirm critical RPCs, contract calls, and DB paths after every release.

## Cloud and Deployment

- **Create a production Dockerfile for `zeus_service`** — Package the backend into a reproducible image suitable for staging and cloud deployment.
- **Add a local docker-compose stack for backend dependencies** — Standardize Postgres, Redis, Bitcoin, and future chain-side dev dependencies for contributors.
- **Add Kubernetes deployment manifests for the service** — Define deploy, service, config, and secret resources for cloud-native operation.
- **Add readiness and liveness probes** — Prevent broken pods from receiving traffic and restart unhealthy instances automatically.
- **Add horizontal scaling support for stateless API pods** — Ensure session, nonce, and queue logic work correctly across multiple replicas.
- **Move secrets to a cloud secret manager** — Stop relying on `.env` files for production credentials and private keys.
- **Add CI pipeline for lint, test, build, and artifact publication** — Make production releases reproducible and policy-checked.
- **Add CD pipeline for staged deploys to cloud environments** — Support dev, staging, and production promotion with approval gates.
- **Add rolling deployment and graceful shutdown support** — Let new versions deploy without dropping in-flight requests or jobs.
- **Add TLS termination and ingress configuration** — Prepare the API and websocket layer for secure public internet exposure.
- **Add autoscaling policies tied to latency and queue depth** — Scale the service based on real workload signals instead of only CPU.
- **Add centralized log shipping to a cloud logging backend** — Make multi-instance debugging practical in production.
- **Add database backup and restore automation** — Protect production swap and vault state before real user funds depend on it.
- **Add disaster recovery runbooks and failover drills** — Treat regional or dependency outages as expected operational scenarios.

## Mainnet Readiness

- **Add explicit mainnet safeties for all destructive operations** — Require environment-aware guardrails before the service can move real funds.
- **Add contract-address freeze and change-control tooling** — Prevent accidental mainnet contract reconfiguration without review.
- **Add production RPC quorum or secondary-provider checks** — Reduce single-provider trust when making settlement-critical decisions.
- **Add fee-budget controls for automated chain operations** — Prevent relayers or retries from overspending during volatile network conditions.
- **Add real mainnet onboarding checklist endpoints and docs hooks** — Give operators a definitive way to verify that all chains are ready before go-live.
- **Add compliance and audit export support for critical records** — Prepare swap, notification, and auth history for external review once the system handles real users.
- **Add phased rollout controls for new chains and markets** — Enable Bitcoin, Starknet, and Stellar capabilities incrementally instead of all at once.
- **Add final pre-mainnet rehearsal workflows in staging** — Rehearse full chain coordination, rollback, and incident response before the first production launch.

## Observations

- **Observation: `zeus_service` is currently Starknet-first and Stellar-absent** — The inclusion of `zeus_stellar` in the repository creates a clear backend gap because there is no Soroban module or RPC integration yet.
- **Observation: several core backend paths still rely on dev-mode fallbacks** — Wallet signing, auth verification, Starknet invokes, HTLC scripts, monitoring, and ZK logic all contain placeholders that must be removed for production.
- **Observation: persistence is still thin for a funds-moving backend** — Only a small set of entities exist today, which is not enough for reliable multi-chain settlement, audit, recovery, and operator workflows.
- **Observation: the service can scale functionally only after state leaves process memory** — Nonces, sessions, and several workflow assumptions still depend on single-instance behavior, which conflicts with cloud deployment and HA requirements.