#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$ROOT_DIR/contracts"
RUN_COMPILE_CHECKS=false

if [[ "${1:-}" == "--with-compile" ]]; then
  RUN_COMPILE_CHECKS=true
fi

if [[ ! -d "$CONTRACTS_DIR" ]]; then
  echo "error: contracts directory not found at $CONTRACTS_DIR"
  exit 1
fi

manifest_errors=0
declare -a package_names=()

echo "Checking Soroban contract manifests in $CONTRACTS_DIR"

for contract_dir in "$CONTRACTS_DIR"/*; do
  [[ -d "$contract_dir" ]] || continue
  manifest="$contract_dir/Cargo.toml"
  contract_name="$(basename "$contract_dir")"

  if [[ ! -f "$manifest" ]]; then
    echo "[FAIL] $contract_name: missing Cargo.toml"
    manifest_errors=$((manifest_errors + 1))
    continue
  fi

  missing=()

  grep -Eq '^\[package\]$' "$manifest" || missing+=("[package]")
  grep -Eq '^name\s*=\s*".+"$' "$manifest" || missing+=("package.name")
  grep -Eq '^version\s*=\s*".+"$' "$manifest" || missing+=("package.version")
  grep -Eq '^edition\s*=\s*".+"$' "$manifest" || missing+=("package.edition")

  grep -Eq '^\[lib\]$' "$manifest" || missing+=("[lib]")
  grep -Eq '^crate-type\s*=\s*\[.*"cdylib".*\]$' "$manifest" || missing+=("lib.crate-type includes cdylib")
  grep -Eq '^crate-type\s*=\s*\[.*"lib".*\]$' "$manifest" || missing+=("lib.crate-type includes lib")

  grep -Eq '^\[dependencies\]$' "$manifest" || missing+=("[dependencies]")
  grep -Eq '^soroban-sdk\s*=\s*\{\s*workspace\s*=\s*true\s*\}$' "$manifest" || missing+=("dependencies.soroban-sdk workspace=true")

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "[FAIL] $contract_name"
    for item in "${missing[@]}"; do
      echo "  - missing or invalid: $item"
    done
    manifest_errors=$((manifest_errors + 1))
    continue
  fi

  package_name="$(sed -n 's/^name\s*=\s*"\([^"]\+\)"$/\1/p' "$manifest" | head -n 1)"
  if [[ -z "$package_name" ]]; then
    echo "[FAIL] $contract_name: unable to read package.name"
    manifest_errors=$((manifest_errors + 1))
    continue
  fi

  package_names+=("$package_name")
  echo "[OK]   $contract_name -> $package_name"
done

if [[ $manifest_errors -gt 0 ]]; then
  echo
  echo "Manifest validation failed with $manifest_errors error(s)."
  exit 1
fi

echo
echo "Manifest validation passed for ${#package_names[@]} contract crate(s)."

if [[ "$RUN_COMPILE_CHECKS" == true ]]; then
  echo
  echo "Running independent compile checks for contract crates"
  for package in "${package_names[@]}"; do
    echo "  cargo check -p $package"
    cargo check -p "$package" --manifest-path "$ROOT_DIR/Cargo.toml"
  done
  echo
  echo "All independent compile checks passed."
fi
