#![no_std]
use soroban_sdk::{contractclient, bytes, Bytes, BytesN, Env, Address};

// The deserialized journal structure that the RISC Zero Guest circuit spits out
// after verifying Bitcoin SPV transaction parameters.
#[soroban_sdk::contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BtcSwapJournal {
    pub btc_tx_hash: BytesN<32>,       // The unique Bitcoin TX string identifier
    pub recipient_stellar: Address,    // The exact Stellar address to release funds to
    pub swap_amount: u128,             // Swei / value threshold
    pub block_confirmations: u32,      // Proved Bitcoin block depth
}

#[contractclient(name = "ZkVerifierClient")]
pub trait IZKAtomicSwapVerifier {
    /// Core verification entry point utilizing Nethermind's RISC Zero verifier core
    /// Returns the securely deserialized journal data if the cryptographic seal passes
    fn verify_btc_swap(
        env: Env,
        journal_bytes: Bytes,
        seal: Bytes,
        image_id: BytesN<32>,
    ) -> BtcSwapJournal;

    /// Nullifier management translated directly from your Cairo layout to prevent replay attacks
    fn is_tx_spent(env: Env, btc_tx_hash: BytesN<32>) -> bool;

    /// Admin / Relayer Whitelisting matching your legacy configuration setup
    fn whitelist_relayer(env: Env, relayer: Address);
    fn remove_relayer(env: Env, relayer: Address);
    fn get_verifier_status(env: Env) -> bool; // Handles checking if contract is paused
}