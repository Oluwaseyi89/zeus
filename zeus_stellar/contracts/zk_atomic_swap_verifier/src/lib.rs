#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, panic_with_error, Address, Bytes, BytesN, Env, Symbol};
use zeus_interfaces::{IZKAtomicSwapVerifier, BtcSwapJournal};

#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    InvalidZkSeal = 1,
    BtcTxAlreadySpent = 2,
    UnauthorizedRelayer = 3,
    VerifierPaused = 4,
    NotInitialized = 5,
    AlreadyInitialized = 6,
    Unauthorized = 7,
}

// Strongly-typed instance storage keys mapping state layout
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Admin,
    RouterId,
    Active,
    Initialized,
    Relayer(Address),
}

// Fixed: Isolated client generation inside an explicit interface module 
// to prevent Rust workspace namespace collisions.
pub mod nethermind {
    #[soroban_sdk::contractclient(name = "NethermindRisc0Client")]
    pub trait NethermindRisc0Verifier {
        fn verify(env: soroban_sdk::Env, seal: soroban_sdk::Bytes, image_id: soroban_sdk::BytesN<32>, journal_digest: soroban_sdk::BytesN<32>);
    }
}

#[contract]
pub struct ZkAtomicSwapVerifier;

#[contractimpl]
impl ZkAtomicSwapVerifier {
    /// Initializes the contract state with the owner and target RISC Zero verifier contract ID
    pub fn initialize(env: Env, admin: Address, router_id: Address) {
        if env.storage().instance().has(&StorageKey::Initialized) {
            panic_with_error!(&env, VerifierError::AlreadyInitialized);
        }

        env.storage().instance().set(&StorageKey::Admin, &admin);
        env.storage().instance().set(&StorageKey::RouterId, &router_id);
        env.storage().instance().set(&StorageKey::Active, &true);
        env.storage().instance().set(&StorageKey::Initialized, &true);
    }

    /// Updates the Nethermind Router address dynamically in instance storage
    pub fn update_router_id(env: Env, new_router_id: Address) {
        let admin: Address = env.storage().instance().get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        
        // Enforce native cryptographically-secure admin signature verification
        admin.require_auth();

        env.storage().instance().set(&StorageKey::RouterId, &new_router_id);
    }

    /// Toggles the operational state of proof verifications (Pause/Unpause status)
    pub fn set_active_status(env: Env, status: bool) {
        let admin: Address = env.storage().instance().get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        
        admin.require_auth();

        env.storage().instance().set(&StorageKey::Active, &status);
    }
}

#[contractimpl]
impl IZKAtomicSwapVerifier for ZkAtomicSwapVerifier {
    
    pub fn verify_btc_swap(
        env: Env,
        journal_bytes: Bytes,
        seal: Bytes,
        image_id: BytesN<32>,
    ) -> BtcSwapJournal {
        // 1. Enforce operational status check
        if !Self::get_verifier_status(env.clone()) {
            panic_with_error!(&env, VerifierError::VerifierPaused);
        }

        // 2. Fetch the target verifier engine ID from state dynamically
        let nethermind_router_id: Address = env.storage().instance().get(&StorageKey::RouterId)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));

        // 3. Compute SHA-256 digest of the raw journal bytes as demanded by zkVM validation specs
        let journal_digest = env.crypto().sha256(&journal_bytes);

        // 4. Secure Cross-Contract invocation to Nethermind's module
        let verifier_client = nethermind::NethermindRisc0Client::new(&env, &nethermind_router_id);
        verifier_client.verify(&seal, &image_id, &journal_digest);

        // 5. Extract domain types out of verified journal payload bytes safely
        let journal: BtcSwapJournal = env.from_try_into_val(&journal_bytes)
            .unwrap_or_else(|_| env.panic_with_error(VerifierError::InvalidZkSeal));

        // 6. Enforce Replay Protection using stateful verification checks
        if Self::is_tx_spent(env.clone(), journal.btc_tx_hash.clone()) {
            panic_with_error!(&env, VerifierError::BtcTxAlreadySpent);
        }

        // Commit transaction to persistent storage map to mark it spent permanently
        env.storage().persistent().set(&journal.btc_tx_hash, &true);

        // Publish event metrics for UI synchronization via NestJS WebSockets
        env.events().publish(
            (Symbol::new(&env, "zk_btc_verified"), journal.btc_tx_hash.clone()),
            (journal.recipient_stellar.clone(), journal.swap_amount),
        );

        journal
    }

    pub fn is_tx_spent(env: Env, btc_tx_hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&btc_tx_hash)
    }

    pub fn whitelist_relayer(env: Env, relayer: Address) {
        let admin: Address = env.storage().instance().get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        admin.require_auth();

        env.storage().instance().set(&StorageKey::Relayer(relayer), &true);
    }

    pub fn remove_relayer(env: Env, relayer: Address) {
        let admin: Address = env.storage().instance().get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        admin.require_auth();

        env.storage().instance().remove(&StorageKey::Relayer(relayer));
    }

    pub fn get_verifier_status(env: Env) -> bool {
        env.storage().instance().get(&StorageKey::Active).unwrap_or(false)
    }
}