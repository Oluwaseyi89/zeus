#![no_std]
use soroban_sdk::{contractclient, contracttype, Address, Bytes, BytesN, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BtcSwapJournal {
    pub btc_tx_hash: BytesN<32>,
    pub recipient_stellar: Address,
    pub swap_amount: u128,
    pub block_confirmations: u32,
}

#[contractclient(name = "ZkVerifierClient")]
pub trait IZKAtomicSwapVerifier {
    fn verify_btc_swap(
        env: Env,
        journal_bytes: Bytes,
        seal: Bytes,
        image_id: BytesN<32>,
    ) -> BtcSwapJournal;

    fn is_tx_spent(env: Env, btc_tx_hash: BytesN<32>) -> bool;
    fn whitelist_relayer(env: Env, relayer: Address);
    fn remove_relayer(env: Env, relayer: Address);
    fn get_verifier_status(env: Env) -> bool;
}
