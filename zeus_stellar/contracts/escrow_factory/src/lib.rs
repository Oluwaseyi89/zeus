#![no_std]
#![allow(clippy::too_many_arguments)]

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env};

// Dynamic client import for your SwapEscrowContract's initialization interface
mod escrow_instance {
    soroban_sdk::contractimport!(file = "../../target/wasm32v1-none/release/swap_escrow.wasm");
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    EscrowWasmHash,
}

#[contract]
pub struct EscrowFactoryContract;

#[contractimpl]
impl EscrowFactoryContract {
    /// Initializes the Factory with an administrative identity and the pre-installed SwapEscrow WASM hash.
    pub fn initialize(env: Env, admin: Address, wasm_hash: BytesN<32>) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Factory already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::EscrowWasmHash, &wasm_hash);
    }

    /// Dynamically deploys and initializes a new isolated instance of the SwapEscrowContract.
    pub fn create_escrow(
        env: Env,
        salt: BytesN<32>,
        verifier: Address,
        token: Address,
        depositor: Address,
        treasury: Address,
        swap_amount: i128,
        timeout_timestamp: u64,
        fee_bps: u32,
    ) -> Address {
        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::EscrowWasmHash)
            .unwrap();
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();

        // 1. Deploy the contract instance passing an empty tuple () for lack of native constructor
        let deployed_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, ());

        // 2. Instantiate a dynamic client for the freshly minted escrow address
        let escrow_client = escrow_instance::Client::new(&env, &deployed_address);

        // 3. Atomically pass configuration parameters via the exact macro-generated structural call
        escrow_client.initialize(
            &admin,
            &verifier,
            &token,
            &depositor,
            &treasury,
            &swap_amount,
            &timeout_timestamp,
            &fee_bps,
        );

        deployed_address
    }

    /// Upgrade the blueprint WASM hash for future escrow deployments (e.g., moving to a v2 Escrow)
    pub fn update_wasm_hash(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::EscrowWasmHash, &new_wasm_hash);
    }
}

#[cfg(test)]
mod test;
