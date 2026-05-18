#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_MANIFEST="$ROOT_DIR/Cargo.toml"

expected_shared_packages=(
  "zeus-access-control"
  "zeus-common"
  "zeus-crypto"
  "zeus-errors"
  "zeus-events"
  "zeus-interfaces"
  "zeus-math"
  "zeus-types"
)

expected_contract_packages=(
  "bitcoin-bridge"
  "btc-vault"
  "hello-world"
  "mock-bitcoin-oracle"
  "mock-token"
  "mock-zk-prover"
  "stellar-atomic-bridge"
  "swap-escrow"
  "zeus-gov-token"
  "zk-atomic-swap-verifier"
  "zk-order-book"
  "zkbtc"
)

if [[ ! -f "$ROOT_MANIFEST" ]]; then
  echo "error: root Cargo.toml not found at $ROOT_MANIFEST"
  exit 1
fi

echo "Checking [workspace].members for duplicate entries in Cargo.toml"

members_block="$(sed -n '/^members\s*=\s*\[/,/^\]/p' "$ROOT_MANIFEST")"
if [[ -z "$members_block" ]]; then
  echo "[FAIL] could not read [workspace].members list"
  exit 1
fi

mapfile -t member_entries < <(
  printf '%s\n' "$members_block" \
    | sed -n 's/^[[:space:]]*"\([^"]\+\)"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p'
)

if [[ ${#member_entries[@]} -eq 0 ]]; then
  echo "[FAIL] no member entries found in [workspace].members"
  exit 1
fi

dupe_entries="$(printf '%s\n' "${member_entries[@]}" | sort | uniq -d)"
if [[ -n "$dupe_entries" ]]; then
  echo "[FAIL] duplicate workspace member entries found:"
  printf '%s\n' "$dupe_entries" | sed 's/^/  - /'
  exit 1
fi

echo "[OK]   no duplicate [workspace].members entries"

echo
echo "Verifying shared crates are workspace members"
for pkg in "${expected_shared_packages[@]}"; do
  if cargo pkgid -p "$pkg" --manifest-path "$ROOT_MANIFEST" >/dev/null 2>&1; then
    echo "[OK]   $pkg"
  else
    echo "[FAIL] missing shared workspace package: $pkg"
    exit 1
  fi
done

echo
echo "Verifying contract crates remain workspace members"
for pkg in "${expected_contract_packages[@]}"; do
  if cargo pkgid -p "$pkg" --manifest-path "$ROOT_MANIFEST" >/dev/null 2>&1; then
    echo "[OK]   $pkg"
  else
    echo "[FAIL] missing contract workspace package: $pkg"
    exit 1
  fi
done

echo
echo "Workspace membership verification passed."
