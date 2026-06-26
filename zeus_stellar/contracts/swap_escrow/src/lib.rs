#![no_std]
#![allow(clippy::too_many_arguments)]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, token, Address, Bytes, BytesN, Env,
};

// Import client components and types generated from your interfaces crate
use zeus_interfaces::{BtcSwapJournal, ZkVerifierClient};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Verifier,
    Token,
    SwapAmount,
    IsInitialized,
    Depositor,
    TimeoutTimestamp,
    Treasury,
    FeeBps,
}

// --- REMOVED #[contracttype] COLLISIONS; MANAGED NATIVELY BY #[contractevent] ---

#[contractevent(topics = ["swap", "initialized"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapInitializedEvent {
    pub admin: Address,
    pub depositor: Address,
    pub amount: i128,
}

#[contractevent(topics = ["swap", "liquidity_added"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityDepositedEvent {
    pub provider: Address,
    pub amount: i128,
}

#[contractevent(topics = ["swap", "claimed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapClaimedEvent {
    pub recipient: Address,
    pub btc_tx_hash: BytesN<32>,
    pub net_amount: i128,
    pub fee_amount: i128,
}

#[contractevent(topics = ["swap", "refunded"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapRefundedEvent {
    pub depositor: Address,
    pub amount: i128,
}

#[contractevent(topics = ["swap", "emergency_withdrawn"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EmergencyWithdrawalEvent {
    pub admin: Address,
    pub amount: i128,
}

// Define an explicit contract interface to guarantee public metadata visibility
pub trait SwapEscrowTrait {
    fn initialize(
        env: Env,
        admin: Address,
        verifier: Address,
        token: Address,
        depositor: Address,
        treasury: Address,
        swap_amount: i128,
        timeout_timestamp: u64,
        fee_bps: u32,
    );
    fn deposit_liquidity(env: Env, provider: Address, amount: i128);
    fn claim_swap(env: Env, recipient: Address, tx_hash: BytesN<32>, seal: Bytes, journal: Bytes);
    fn refund_swap(env: Env);
    fn emergency_withdraw(env: Env, amount: i128);
}

#[contract]
pub struct SwapEscrowContract;

#[contractimpl]
impl SwapEscrowTrait for SwapEscrowContract {
    /// Initializes the escrow vault with administrative controls, safety timeouts, and monetization parameters.
    fn initialize(
        env: Env,
        admin: Address,
        verifier: Address,
        token: Address,
        depositor: Address,
        treasury: Address,
        swap_amount: i128,
        timeout_timestamp: u64,
        fee_bps: u32,
    ) {
        if env.storage().instance().has(&DataKey::IsInitialized) {
            panic!("Contract is already initialized");
        }

        if fee_bps > 10000 {
            panic!("Fee basis points cannot exceed 10000");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::Depositor, &depositor);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage()
            .instance()
            .set(&DataKey::SwapAmount, &swap_amount);
        env.storage()
            .instance()
            .set(&DataKey::TimeoutTimestamp, &timeout_timestamp);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::IsInitialized, &true);

        SwapInitializedEvent {
            admin: admin.clone(),
            depositor: depositor.clone(),
            amount: swap_amount,
        }
        .publish(&env);
    }

    /// Allows the admin or liquidity providers to fund the contract vault with native assets.
    fn deposit_liquidity(env: Env, provider: Address, amount: i128) {
        provider.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&provider, env.current_contract_address(), &amount);

        LiquidityDepositedEvent {
            provider: provider.clone(),
            amount,
        }
        .publish(&env);
    }

    /// Claims the escrowed funds by verifying a Risc0 proof, splitting the configured protocol fee to the treasury.
    fn claim_swap(env: Env, recipient: Address, tx_hash: BytesN<32>, seal: Bytes, journal: Bytes) {
        recipient.require_auth();

        let verifier_addr: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let expected_amount: i128 = env.storage().instance().get(&DataKey::SwapAmount).unwrap();
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap();

        // 1. Instantiating cross-contract client for your v23 verifier module
        let verifier_client = ZkVerifierClient::new(&env, &verifier_addr);

        // 2. Double-Spend Replay Vector Prevention
        if verifier_client.is_tx_spent(&tx_hash) {
            panic!("Transaction has already been spent");
        }

        // 3. Cross-contract call to verify zero-knowledge proof validity
        let verified_journal: BtcSwapJournal =
            verifier_client.verify_btc_swap(&journal, &seal, &tx_hash);

        // 4. Structural Cryptographic Payload Verification
        if verified_journal.recipient_stellar != recipient {
            panic!("Recipient address mismatch with verified journal");
        }

        if verified_journal.swap_amount != expected_amount as u128 {
            panic!("Swap amount mismatch with verified journal");
        }

        // 5. Calculate and Process Monetization Fees Securely
        let token_client = token::Client::new(&env, &token_addr);
        let fee_amount = (expected_amount * fee_bps as i128) / 10000;
        let recipient_amount = expected_amount - fee_amount;

        if fee_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &treasury, &fee_amount);
        }

        // 6. Dispatch the remaining native Stellar assets directly to the verified recipient
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &recipient_amount,
        );

        SwapClaimedEvent {
            recipient: recipient.clone(),
            btc_tx_hash: tx_hash,
            net_amount: recipient_amount,
            fee_amount,
        }
        .publish(&env);
    }

    /// Permits the original depositor to reclaim their locked assets autonomously if the timeout threshold passes.
    fn refund_swap(env: Env) {
        let depositor: Address = env.storage().instance().get(&DataKey::Depositor).unwrap();
        let timeout_timestamp: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TimeoutTimestamp)
            .unwrap();

        // Trustless enforcement: Reclaim request traps unless the ledger time strictly passes timeout constraint
        if env.ledger().timestamp() < timeout_timestamp {
            panic!("Lock duration active: Timeout threshold has not been reached");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let swap_amount: i128 = env.storage().instance().get(&DataKey::SwapAmount).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Empty entire remaining contract liquidity back to the initial source depositor account
        token_client.transfer(&env.current_contract_address(), &depositor, &swap_amount);

        SwapRefundedEvent {
            depositor: depositor.clone(),
            amount: swap_amount,
        }
        .publish(&env);
    }

    /// Allows emergency withdrawal of locked vault liquidity by the administrator.
    fn emergency_withdraw(env: Env, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&env.current_contract_address(), &admin, &amount);

        EmergencyWithdrawalEvent {
            admin: admin.clone(),
            amount,
        }
        .publish(&env);
    }
}

#[cfg(test)]
mod test;
