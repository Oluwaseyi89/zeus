#![cfg(test)]

use super::*;
use soroban_sdk::{Env, Bytes, BytesN};
use zeus_interfaces::{BtcSwapJournal, ZkVerifierClient};

#[test]
fn test_verify_btc_swap_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Register the verifier contract in the test environment
    let contract_id = env.register_contract(None, SwapEscrowContract); // Uses the verifier contract struct
    let client = ZkVerifierClient::new(&env, &contract_id);

    // 2. Setup mock data
    let tx_hash = BytesN::from_array(&env, &[0u8; 32]);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);
    
    // Create a dummy journal matching your BtcSwapJournal schema requirements
    // For testing parsing stability, we serialize a mock payload or use dummy bytes depending on your exact struct fields
    let journal = Bytes::from_slice(&env, &[0u8; 64]); 

    // 3. Execute the call (Since it returns the BtcSwapJournal or panics)
    // Note: In a pure mock environment without the underlying Nethermind/Risc0 extension linked, 
    // we verify that the client structure accepts the call patterns cleanly.
    let _result = client.verify_btc_swap(&journal, &seal, &tx_hash);
}

#[test]
#[should_panic(expected = "Invalid zero-knowledge proof verification failed")]
fn test_verify_btc_swap_malicious_proof_fails() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SwapEscrowContract);
    let client = ZkVerifierClient::new(&env, &contract_id);

    let tx_hash = BytesN::from_array(&env, &[0u8; 32]);
    let empty_seal = Bytes::from_slice(&env, &[]);
    let corrupt_journal = Bytes::from_slice(&env, &[9, 9, 9]);

    // This should trigger the internal panic condition inside your verifier logic
    client.verify_btc_swap(&corrupt_journal, &empty_seal, &tx_hash);
}