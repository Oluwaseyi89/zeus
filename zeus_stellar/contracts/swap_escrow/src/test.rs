#![cfg(test)]

use crate::{DataKey, SwapEscrowContract, SwapEscrowContractClient};
use soroban_sdk::{
    contract, contractimpl,
    testutils::{Address as _, Ledger as _},
    token,
    xdr::{FromXdr, ToXdr},
    Address, Bytes, BytesN, Env,
};
use zeus_interfaces::BtcSwapJournal;

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

    pub fn is_tx_spent(_env: Env, _btc_tx_hash: BytesN<32>) -> bool {
        false
    }
}

// --- OPTIMIZED TEST ENVIRONMENT CONFIGURATOR ---

struct TestFixture<'a> {
    env: Env,
    client: SwapEscrowContractClient<'a>,
    admin: Address,
    depositor: Address,
    treasury: Address,
    verifier_id: Address,
    token_id: Address,
    _token_admin: Address,
    timeout_timestamp: u64,
    fee_bps: u32,
}

fn setup_test_environment(env: &Env, swap_amount: i128) -> TestFixture<'_> {
    let admin = Address::generate(env);
    let depositor = Address::generate(env);
    let treasury = Address::generate(env);
    let token_admin = Address::generate(env);

    // Default configuration metrics for lifecycle tests
    let timeout_timestamp: u64 = 10000;
    let fee_bps: u32 = 50; // 0.5% protocol fee cut

    // Set initial ledger time comfortably below timeout threshold
    env.ledger().set_timestamp(5000);

    // Register mock token contract framework (v2 returns a StellarAssetContract instance)
    let sac_instance = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_id = sac_instance.address();

    // Register local implementation mock for cross-contract validation
    let verifier_id = env.register(MockZkVerifier, ());

    // Register target contract
    let contract_id = env.register(SwapEscrowContract, ());
    let client = SwapEscrowContractClient::new(env, &contract_id);

    client.initialize(
        &admin,
        &verifier_id,
        &token_id,
        &depositor,
        &treasury,
        &swap_amount,
        &timeout_timestamp,
        &fee_bps,
    );

    TestFixture {
        env: env.clone(),
        client,
        admin,
        depositor,
        treasury,
        verifier_id,
        token_id,
        _token_admin: token_admin,
        timeout_timestamp,
        fee_bps,
    }
}

// --- CORE TEST SUITE CASES ---

#[test]
fn test_initialize_sets_correct_storage_values() {
    let env = Env::default();
    let fixture = setup_test_environment(&env, 500);

    // Verify storage configurations are preserved accurately on initialization inside instance lock
    env.as_contract(&fixture.client.address, || {
        let is_init: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsInitialized)
            .unwrap();
        let registered_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let depositor: Address = env.storage().instance().get(&DataKey::Depositor).unwrap();
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let swap_amt: i128 = env.storage().instance().get(&DataKey::SwapAmount).unwrap();
        let timeout: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TimeoutTimestamp)
            .unwrap();
        let fee: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap();

        assert!(is_init);
        assert_eq!(registered_admin, fixture.admin);
        assert_eq!(depositor, fixture.depositor);
        assert_eq!(treasury, fixture.treasury);
        assert_eq!(swap_amt, 500);
        assert_eq!(timeout, fixture.timeout_timestamp);
        assert_eq!(fee, fixture.fee_bps);
    });
}

#[test]
#[should_panic(expected = "Contract is already initialized")]
fn test_initialize_twice_panics() {
    let env = Env::default();
    let fixture = setup_test_environment(&env, 500);

    fixture.client.initialize(
        &fixture.admin,
        &fixture.verifier_id,
        &fixture.token_id,
        &fixture.depositor,
        &fixture.treasury,
        &100,
        &fixture.timeout_timestamp,
        &fixture.fee_bps,
    );
}

#[test]
fn test_deposit_liquidity_transfers_funds_successfully() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 200);
    let liquidity_provider = Address::generate(&env);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&liquidity_provider, &1000);

    fixture.client.deposit_liquidity(&liquidity_provider, &400);

    let standard_token_client = token::Client::new(&env, &fixture.token_id);
    assert_eq!(standard_token_client.balance(&liquidity_provider), 600);
    assert_eq!(standard_token_client.balance(&fixture.client.address), 400);
}

#[test]
fn test_claim_swap_happy_path_with_fee_extraction() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 1000; // Chosen to make percentage math clear
    let fixture = setup_test_environment(&env, target_swap_amount);
    let recipient = Address::generate(&env);

    // Seed contract with liquid assets
    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &target_swap_amount);

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
    fixture
        .client
        .claim_swap(&recipient, &mock_tx_hash, &dummy_seal, &journal_buffer);

    let standard_token_client = token::Client::new(&env, &fixture.token_id);

    // 50 Bps of 1000 = 5 tokens protocol fee
    let expected_fee = (target_swap_amount * fixture.fee_bps as i128) / 10000;
    let expected_recipient_payout = target_swap_amount - expected_fee;

    assert_eq!(
        standard_token_client.balance(&recipient),
        expected_recipient_payout
    );
    assert_eq!(
        standard_token_client.balance(&fixture.treasury),
        expected_fee
    );
    assert_eq!(standard_token_client.balance(&fixture.client.address), 0);
}

#[test]
#[should_panic(expected = "Lock duration active: Timeout threshold has not been reached")]
fn test_refund_swap_fails_before_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 500);

    // Explicitly confirm current ledger timestamp is securely underneath timeout constraint
    assert!(fixture.env.ledger().timestamp() < fixture.timeout_timestamp);

    // Reclaim attempt must immediately trap and halt execution
    fixture.client.refund_swap();
}

#[test]
fn test_refund_swap_succeeds_after_timeout_expiration() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 500;
    let fixture = setup_test_environment(&env, target_swap_amount);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &target_swap_amount);

    // Fast-forward simulated on-chain environment past the expiration line
    fixture
        .env
        .ledger()
        .set_timestamp(fixture.timeout_timestamp + 1);

    // Execute reclamation routine
    fixture.client.refund_swap();

    let standard_token_client = token::Client::new(&env, &fixture.token_id);

    // Original depositor gets 100% of the funds back
    assert_eq!(
        standard_token_client.balance(&fixture.depositor),
        target_swap_amount
    );
    assert_eq!(standard_token_client.balance(&fixture.client.address), 0);
}

#[test]
fn test_emergency_withdraw_by_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 100);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &500);

    fixture.client.emergency_withdraw(&300);

    let standard_token_client = token::Client::new(&env, &fixture.token_id);
    assert_eq!(standard_token_client.balance(&fixture.admin), 300);
    assert_eq!(standard_token_client.balance(&fixture.client.address), 200);
}
