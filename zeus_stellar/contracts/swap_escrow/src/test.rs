#![cfg(test)]

use crate::{DataKey, SwapEscrowContract, SwapEscrowContractClient};
use soroban_sdk::{
    contract, contractimpl, testutils::Address as _, token, xdr::ToXdr, Address, Bytes, BytesN, Env,
};
use zeus_interfaces::{BtcSwapJournal, ZkVerifierClient};

// --- MOCK DECLARATIONS FOR CROSS-CONTRACT DEPENDENCIES ---

/// A clean mock contract representing the ZkAtomicSwapVerifier.
/// It must match the expected method signature invoked by SwapEscrowContract.
#[contract]
pub struct MockZkVerifier;

#[contractimpl]
impl MockZkVerifier {
    pub fn verify_btc_swap(
        env: Env,
        journal_bytes: Bytes,
        _seal: Bytes,
        _image_id: BytesN<32>,
    ) -> BtcSwapJournal {
        // Unpack structural journal data seamlessly during live simulation paths
        BtcSwapJournal::from_xdr(&env, &journal_bytes).unwrap()
    }
}

// --- OPTIMIZED TEST ENVIRONMENT CONFIGURATOR ---

struct TestFixture<'a> {
    env: Env,
    client: SwapEscrowContractClient<'a>,
    admin: Address,
    verifier_id: Address,
    token_id: Address,
    token_admin: Address,
}

fn setup_test_environment(env: &Env, swap_amount: i128) -> TestFixture<'_> {
    let admin = Address::generate(env);
    let token_admin = Address::generate(env);
    
    // Register and deploy mock token contract framework (SEP-0041 Compliant)
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    
    // Register local implementation mock for cross-contract validation
    let verifier_id = env.register(MockZkVerifier, ());

    // Register target contract
    let contract_id = env.register(SwapEscrowContract, ());
    let client = SwapEscrowContractClient::new(env, &contract_id);

    client.initialize(&admin, &verifier_id, &token_id, &swap_amount);

    TestFixture {
        env: env.clone(),
        client,
        admin,
        verifier_id,
        token_id,
        token_admin,
    }
}

// --- CORE TEST SUITE CASES ---

#[test]
fn test_initialize_sets_correct_storage_values() {
    let env = Env::default();
    let fixture = setup_test_environment(&env, 500);

    // Verify storage configurations are preserved accurately on initialization inside instance lock
    env.as_contract(&fixture.client.address, || {
        let is_init: bool = env.storage().instance().get(&DataKey::IsInitialized).unwrap();
        let registered_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let swap_amt: i128 = env.storage().instance().get(&DataKey::SwapAmount).unwrap();
        
        assert!(is_init);
        assert_eq!(registered_admin, fixture.admin);
        assert_eq!(swap_amt, 500);
    });
}

#[test]
#[should_panic(expected = "Contract is already initialized")]
fn test_initialize_twice_panics() {
    let env = Env::default();
    let fixture = setup_test_environment(&env, 500);

    // Re-triggering initialization should trip the structural constraint check
    fixture.client.initialize(&fixture.admin, &fixture.verifier_id, &fixture.token_id, &100);
}

#[test]
fn test_deposit_liquidity_transfers_funds_successfully() {
    let env = Env::default();
    env.mock_all_auths();
    
    let fixture = setup_test_environment(&env, 200);
    let liquidity_provider = Address::generate(&env);
    
    // Setup initial balances inside mock token contract
    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&liquidity_provider, &1000);

    fixture.client.deposit_liquidity(&liquidity_provider, &400);

    // Check balance distributions post-execution
    let standard_token_client = token::Client::new(&env, &fixture.token_id);
    assert_eq!(standard_token_client.balance(&liquidity_provider), 600);
    assert_eq!(standard_token_client.balance(&fixture.client.address), 400);
}

#[test]
fn test_claim_swap_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 350;
    let fixture = setup_test_environment(&env, target_swap_amount);
    let recipient = Address::generate(&env);
    
    // Seed contract with liquid assets to prevent overdraft scenarios during claims
    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &1000);

    // Construct verifiable XDR journal payload structure
    let mock_tx_hash = BytesN::from_array(&env, &[7u8; 32]);
    let journal_data = BtcSwapJournal {
        btc_tx_hash: mock_tx_hash.clone(),
        recipient_stellar: recipient.clone(),
        swap_amount: target_swap_amount as u128,
        block_confirmations: 6,
    };

    let journal_buffer = journal_data.to_xdr(&env);
    let dummy_seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);

    // Execute Claim invocation
    fixture.client.claim_swap(&recipient, &mock_tx_hash, &dummy_seal, &journal_buffer);

    // Assert funds are routed accurately
    let standard_token_client = token::Client::new(&env, &fixture.token_id);
    assert_eq!(standard_token_client.balance(&recipient), target_swap_amount);
    assert_eq!(standard_token_client.balance(&fixture.client.address), 1000 - target_swap_amount);
}

#[test]
fn test_emergency_withdraw_by_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 100);
    
    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &500);

    // Extract funds back via admin role privilege bounds
    fixture.client.emergency_withdraw(&300);

    let standard_token_client = token::Client::new(&env, &fixture.token_id);
    assert_eq!(standard_token_client.balance(&fixture.admin), 300);
    assert_eq!(standard_token_client.balance(&fixture.client.address), 200);
}