# Description

Add a root `Makefile` to `zeus_stellar` that provides one consistent command surface for common Soroban developer workflows, including build, test, formatting, artifact handling, and script execution. This removes command fragmentation, improves contributor onboarding speed, and prevents incompatible local command conventions from emerging across contributors.

## Technical Context

- **Project**: ZEUS Protocol
- **Target Workspace**: `zeus_stellar`
- **Stack**: Rust, Cargo workspace, Soroban SDK, shell scripts
- **Current State**:
  - Workspace has scaffolded directories for contracts, shared crates, scripts, and artifacts.
  - Developer workflows are currently ad hoc and depend on each contributor remembering raw cargo/script commands.
  - `scripts/` folders (`deploy`, `invoke`, `upgrade`, `bindings`) and `artifacts/` folders (`wasm`, `abi`, `bindings`) exist but lack a unified root execution entrypoint.
- **Problem**:
  - Without a root `Makefile`, contributors can invent different command sequences, causing drift in local behavior and CI expectations.

## Requirements

1. **Root Makefile Creation**
	- Add a `Makefile` at `zeus_stellar/Makefile`.
	- Provide clear, discoverable targets for the most common workflows.
	- Include a default help target that documents available commands and usage.

2. **Core Workflow Targets**
	- Add standardized targets for workspace checks and builds (for example check/build/test flows).
	- Add formatting and lint-related targets suitable for Rust/Soroban development.
	- Ensure targets are compatible with workspace-wide and per-crate workflows.

3. **Script and Artifact Workflow Targets**
	- Add targets that invoke script workflows under `scripts/deploy`, `scripts/invoke`, `scripts/upgrade`, and `scripts/bindings`.
	- Add targets for artifact generation and organization tied to `artifacts/wasm`, `artifacts/abi`, and `artifacts/bindings`.
	- Keep script invocation patterns explicit and environment-aware.

4. **Environment and Safety Conventions**
	- Include support for environment selection or variable passing where needed (for example local/testnet/mainnet style flags).
	- Add safe defaults to avoid accidental destructive operations.
	- Ensure potentially dangerous targets are explicit and not run as implicit dependencies of basic commands.

5. **Contributor Consistency and Extensibility**
	- Use predictable naming conventions for targets (short, action-oriented names).
	- Keep target composition modular so future workflows can be added without breaking existing commands.
	- Make the `Makefile` understandable for new contributors with minimal project context.

6. **Validation and CI Compatibility**
	- Verify all documented targets run successfully in a clean local workspace setup.
	- Ensure command outputs and failure behavior are CI-friendly (non-silent failures, deterministic exits).
	- Align `Makefile` workflows with expected future CI jobs so local and CI command surfaces match.

## Acceptance Criteria

- `zeus_stellar/Makefile` exists with documented, usable workflow targets.
- Contributors can run build, test, format, and artifact-related workflows through standardized `make` commands.
- Script directories are invocable via `Makefile` targets rather than manual path-by-path execution.
- Help or usage output clearly describes available targets and required parameters.
- Commands are deterministic and do not introduce hidden side effects for default developer workflows.

## Definition of Done

- PR created with root `Makefile` and validated target set.
- Team review confirms targets cover core Soroban contributor workflows.
- README or relevant docs updated to reference `make`-based workflow usage.
- Contributors can execute common development tasks without inventing local script conventions.

---

### Directory to Work On:

`zeus_stellar`
