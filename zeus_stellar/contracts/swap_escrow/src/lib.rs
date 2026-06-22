#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env};

// Import client components generated from your interfaces crate
use zeus_interfaces::ZkVerifierClient;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Verifier,
    Token,
    SwapAmount,
    IsInitialized,
}

#[contract]
pub struct SwapEscrowContract;

#[contractimpl]
impl SwapEscrowContract {
    /// Initializes the escrow vault with administrative controls, the target token, and the verifier address.
    pub fn initialize(
        env: Env,
        admin: Address,
        verifier: Address,
        token: Address,
        swap_amount: i128,
    ) {
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Contract is already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::SwapAmount, &swap_amount);
        env.storage().instance().set(&DataKey::IsInitialized, &true);
    }

    /// Allows the admin or liquidity providers to fund the contract vault with native assets.
    pub fn deposit_liquidity(env: Env, provider: Address, amount: i128) {
        provider.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer funds from the provider into this contract instance
        token_client.transfer(&provider, env.current_contract_address(), &amount);
    }

    /// Claims the escrowed funds by verifying a Risc0 proof against the zk-verifier contract.
    pub fn claim_swap(
        env: Env,
        recipient: Address,
        tx_hash: BytesN<32>,
        seal: Bytes,
        journal: Bytes,
    ) {
        // Prevent transaction submission issues by ensuring recipient matches intents
        recipient.require_auth();

        let verifier_addr: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let swap_amount: i128 = env.storage().instance().get(&DataKey::SwapAmount).unwrap();

        // 1. Instantiating cross-contract client for your v23 verifier module
        let verifier_client = ZkVerifierClient::new(&env, &verifier_addr);
        // 2. Cross-contract call to verify zero-knowledge proof validity and prevent duplicate claims
        let _verified_journal = verifier_client.verify_btc_swap(&journal, &seal, &tx_hash);

        // 3. Dispatch the pre-funded native Stellar assets directly to the verified recipient
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &recipient, &swap_amount);
    }

    /// Allows emergency withdrawal of locked vault liquidity by the administrator.
    pub fn emergency_withdraw(env: Env, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&env.current_contract_address(), &admin, &amount);
    }
}
