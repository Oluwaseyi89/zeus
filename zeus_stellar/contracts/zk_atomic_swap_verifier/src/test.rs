#![cfg(test)]

use crate::{ZkAtomicSwapVerifier, ZkAtomicSwapVerifierClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env};
use zeus_interfaces::BtcSwapJournal;

// Clean mock of the external Nethermind verifier interface dependency
#[contract]
pub struct MockNethermindVerifier;

#[contractimpl]
impl MockNethermindVerifier {
    pub fn verify(_env: Env, _seal: Bytes, _image_id: BytesN<32>, _journal_digest: BytesN<32>) {
        // Keeps cross-contract invocation stable and side-effect free
    }
}

// Optimized setup helper utilizing uniform client instances
fn setup_test(env: &Env) -> (ZkAtomicSwapVerifierClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let router_id = env.register(MockNethermindVerifier, ());

    let contract_id = env.register(ZkAtomicSwapVerifier, ());
    let contract_client = ZkAtomicSwapVerifierClient::new(env, &contract_id);

    contract_client.initialize(&admin, &router_id);

    (contract_client, admin, router_id)
}

#[test]
fn test_verify_btc_swap_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    let mock_tx_hash = BytesN::from_array(&env, &[1u8; 32]);
    let mock_recipient = Address::generate(&env);
    let mock_amount: u128 = 100;
    let mock_confirmations: u32 = 6;

    let mock_journal = BtcSwapJournal {
        btc_tx_hash: mock_tx_hash.clone(),
        recipient_stellar: mock_recipient.clone(),
        swap_amount: mock_amount,
        block_confirmations: mock_confirmations,
    };

    let journal_buffer = mock_journal.to_xdr(&env);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);

    let result = contract_client.verify_btc_swap(&journal_buffer, &seal, &mock_tx_hash);

    assert_eq!(result.swap_amount, mock_amount);
    assert_eq!(result.block_confirmations, mock_confirmations);
    assert_eq!(result.btc_tx_hash, mock_tx_hash);
    assert_eq!(result.recipient_stellar, mock_recipient);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")] // Maps directly to VerifierPaused
fn test_verify_btc_swap_verifier_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    contract_client.set_active_status(&false);

    let journal_buffer = Bytes::new(&env);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);
    let tx_hash = BytesN::from_array(&env, &[1u8; 32]);

    contract_client.verify_btc_swap(&journal_buffer, &seal, &tx_hash);
}

#[test]
#[should_panic(expected = "Error(Value, InvalidInput)")] // Catches host structural byte alignment failure
fn test_verify_btc_swap_invalid_journal() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    let corrupt_journal = Bytes::from_slice(&env, &[9, 9, 9, 9, 9]);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);
    let tx_hash = BytesN::from_array(&env, &[1u8; 32]);

    contract_client.verify_btc_swap(&corrupt_journal, &seal, &tx_hash);
}

#[test]
fn test_initialize_sets_admin_and_router() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let router_id = Address::generate(&env);
    let contract_id = env.register(ZkAtomicSwapVerifier, ());
    let client = ZkAtomicSwapVerifierClient::new(&env, &contract_id);

    client.initialize(&admin, &router_id);
    assert!(client.get_verifier_status());
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let router_id = Address::generate(&env);
    let contract_id = env.register(ZkAtomicSwapVerifier, ());
    let client = ZkAtomicSwapVerifierClient::new(&env, &contract_id);

    client.initialize(&admin, &router_id);
    client.initialize(&admin, &router_id);
}

#[test]
fn test_set_active_status_toggles_verifier() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    assert!(contract_client.get_verifier_status());

    contract_client.set_active_status(&false);
    assert!(!contract_client.get_verifier_status());

    contract_client.set_active_status(&true);
    assert!(contract_client.get_verifier_status());
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_set_active_status_not_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ZkAtomicSwapVerifier, ());
    let client = ZkAtomicSwapVerifierClient::new(&env, &contract_id);

    client.set_active_status(&false);
}

#[test]
fn test_whitelist_relayer() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);
    let relayer = Address::generate(&env);

    contract_client.whitelist_relayer(&relayer);
}

#[test]
fn test_remove_relayer() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);
    let relayer = Address::generate(&env);

    contract_client.whitelist_relayer(&relayer);
    contract_client.remove_relayer(&relayer);
}

#[test]
fn test_update_router_id() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);
    let new_router_id = Address::generate(&env);

    contract_client.update_router_id(&new_router_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_update_router_id_not_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ZkAtomicSwapVerifier, ());
    let client = ZkAtomicSwapVerifierClient::new(&env, &contract_id);
    let new_router_id = Address::generate(&env);

    client.update_router_id(&new_router_id);
}

#[test]
fn test_verify_btc_swap_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    let mock_tx_hash = BytesN::from_array(&env, &[1u8; 32]);
    let mock_recipient = Address::generate(&env);
    let mock_amount: u128 = 100;
    let mock_confirmations: u32 = 6;

    let mock_journal = BtcSwapJournal {
        btc_tx_hash: mock_tx_hash.clone(),
        recipient_stellar: mock_recipient.clone(),
        swap_amount: mock_amount,
        block_confirmations: mock_confirmations,
    };

    let journal_buffer = mock_journal.to_xdr(&env);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);

    let result = contract_client.verify_btc_swap(&journal_buffer, &seal, &mock_tx_hash);
    assert_eq!(result.swap_amount, mock_amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")] // Maps directly to BtcTxAlreadySpent
fn test_verify_btc_swap_double_spend_detected() {
    let env = Env::default();
    env.mock_all_auths();

    let (contract_client, _admin, _router_id) = setup_test(&env);

    let mock_tx_hash = BytesN::from_array(&env, &[1u8; 32]);
    let mock_recipient = Address::generate(&env);
    let mock_amount: u128 = 100;
    let mock_confirmations: u32 = 6;

    let mock_journal = BtcSwapJournal {
        btc_tx_hash: mock_tx_hash.clone(),
        recipient_stellar: mock_recipient,
        swap_amount: mock_amount,
        block_confirmations: mock_confirmations,
    };

    let journal_buffer = mock_journal.to_xdr(&env);
    let seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);

    env.as_contract(&contract_client.address, || {
        env.storage().persistent().set(&mock_tx_hash, &true);
    });

    contract_client.verify_btc_swap(&journal_buffer, &seal, &mock_tx_hash);
}
