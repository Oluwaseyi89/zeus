#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, panic_with_error, xdr::FromXdr, Address,
    Bytes, BytesN, Env, Symbol,
};
use zeus_interfaces::{BtcSwapJournal, IZKAtomicSwapVerifier};

const MIN_TTL: u32 = 17_280;
const BUMP_TTL: u32 = 518_400;

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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    Admin,
    RouterId,
    Active,
    Initialized,
    Relayer(Address),
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ZkBtcVerifiedEvent {
    #[topic]
    pub topic: Symbol,
    #[topic]
    pub btc_tx_hash: BytesN<32>,
    pub recipient: Address,
    pub amount: u128,
}

pub mod nethermind {
    #[soroban_sdk::contractclient(name = "NethermindRisc0Client")]
    pub trait NethermindRisc0Verifier {
        fn verify(
            env: soroban_sdk::Env,
            seal: soroban_sdk::Bytes,
            image_id: soroban_sdk::BytesN<32>,
            journal_digest: soroban_sdk::BytesN<32>,
        );
    }
}

#[contract]
pub struct ZkAtomicSwapVerifier;

#[contractimpl]
impl ZkAtomicSwapVerifier {
    pub fn initialize(env: Env, admin: Address, router_id: Address) {
        if env.storage().instance().has(&StorageKey::Initialized) {
            panic_with_error!(&env, VerifierError::AlreadyInitialized);
        }

        env.storage().instance().set(&StorageKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&StorageKey::RouterId, &router_id);
        env.storage().instance().set(&StorageKey::Active, &true);
        env.storage()
            .instance()
            .set(&StorageKey::Initialized, &true);
        env.storage().instance().extend_ttl(MIN_TTL, BUMP_TTL);
    }

    pub fn update_router_id(env: Env, new_router_id: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));

        admin.require_auth();
        env.storage()
            .instance()
            .set(&StorageKey::RouterId, &new_router_id);
        env.storage().instance().extend_ttl(MIN_TTL, BUMP_TTL);
    }

    pub fn set_active_status(env: Env, status: bool) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));

        admin.require_auth();
        env.storage().instance().set(&StorageKey::Active, &status);
        env.storage().instance().extend_ttl(MIN_TTL, BUMP_TTL);
    }
}

#[contractimpl]
impl IZKAtomicSwapVerifier for ZkAtomicSwapVerifier {
    fn verify_btc_swap(
        env: Env,
        journal_bytes: Bytes,
        seal: Bytes,
        image_id: BytesN<32>,
    ) -> BtcSwapJournal {
        if !Self::get_verifier_status(env.clone()) {
            panic_with_error!(&env, VerifierError::VerifierPaused);
        }

        let nethermind_router_id: Address = env
            .storage()
            .instance()
            .get(&StorageKey::RouterId)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));

        let raw_hash = env.crypto().sha256(&journal_bytes);
        let journal_digest = BytesN::from(raw_hash);

        let verifier_client = nethermind::NethermindRisc0Client::new(&env, &nethermind_router_id);
        verifier_client.verify(&seal, &image_id, &journal_digest);

        let journal: BtcSwapJournal = BtcSwapJournal::from_xdr(&env, &journal_bytes)
            .unwrap_or_else(|_| env.panic_with_error(VerifierError::InvalidZkSeal));

        if Self::is_tx_spent(env.clone(), journal.btc_tx_hash.clone()) {
            panic_with_error!(&env, VerifierError::BtcTxAlreadySpent);
        }

        env.storage().persistent().set(&journal.btc_tx_hash, &true);
        env.storage()
            .persistent()
            .extend_ttl(&journal.btc_tx_hash, MIN_TTL, BUMP_TTL);

        ZkBtcVerifiedEvent {
            topic: Symbol::new(&env, "zk_btc_verified"),
            btc_tx_hash: journal.btc_tx_hash.clone(),
            recipient: journal.recipient_stellar.clone(),
            amount: journal.swap_amount,
        }
        .publish(&env);

        journal
    }

    fn is_tx_spent(env: Env, btc_tx_hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&btc_tx_hash)
    }

    fn whitelist_relayer(env: Env, relayer: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        admin.require_auth();

        env.storage()
            .instance()
            .set(&StorageKey::Relayer(relayer), &true);
        env.storage().instance().extend_ttl(MIN_TTL, BUMP_TTL);
    }

    fn remove_relayer(env: Env, relayer: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&StorageKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, VerifierError::NotInitialized));
        admin.require_auth();

        env.storage()
            .instance()
            .remove(&StorageKey::Relayer(relayer));
    }

    fn get_verifier_status(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&StorageKey::Active)
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
