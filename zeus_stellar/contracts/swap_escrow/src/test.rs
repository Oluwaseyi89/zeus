#![cfg(test)]

use crate::{SwapEscrowContract, SwapEscrowContractClient};
use soroban_sdk::{
    contract, contractimpl,
    testutils::{Address as _, Events, Ledger as _},
    token,
    xdr::{FromXdr, ToXdr},
    Address, Bytes, BytesN, Env, Map, Symbol, TryIntoVal,
};
use zeus_interfaces::BtcSwapJournal;

// --- MOCK DECLARATIONS FOR CROSS-CONTRACT DEPENDENCIES ---

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
        BtcSwapJournal::from_xdr(&env, &journal_bytes).unwrap()
    }

    pub fn is_tx_spent(_env: Env, _btc_tx_hash: BytesN<32>) -> bool {
        false
    }
}

// --- TEST ENVIRONMENT CONFIGURATOR ---

struct TestFixture<'a> {
    env: Env,
    client: SwapEscrowContractClient<'a>,
    admin: Address,
    depositor: Address,
    treasury: Address,
    verifier_id: Address,
    token_id: Address,
    timeout_timestamp: u64,
    fee_bps: u32,
}

fn setup_test_environment(env: &Env, swap_amount: i128) -> TestFixture<'_> {
    let admin = Address::generate(env);
    let depositor = Address::generate(env);
    let treasury = Address::generate(env);
    let token_admin = Address::generate(env);

    let timeout_timestamp: u64 = 10000;
    let fee_bps: u32 = 50;

    env.ledger().set_timestamp(5000);

    let sac_instance = env.register_stellar_asset_contract_v2(token_admin);
    let token_id = sac_instance.address();

    let verifier_id = env.register(MockZkVerifier, ());
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
        timeout_timestamp,
        fee_bps,
    }
}

// --- CORE TEST SUITE CASES (MANEUVERED VIA MAP MATCHING) ---

#[test]
fn test_initialize_sets_correct_storage_values_and_emits_event() {
    let env = Env::default();
    let fixture = setup_test_environment(&env, 500);

    let last_event = env.events().all().pop_back().unwrap();
    assert_eq!(last_event.0, fixture.client.address);

    // Maneuver: Turn raw data Val into a Soroban Map<Symbol, Val>
    let event_map: Map<Symbol, soroban_sdk::Val> = last_event.2.try_into_val(&env).unwrap();

    let admin: Address = event_map
        .get(Symbol::new(&env, "admin"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let depositor: Address = event_map
        .get(Symbol::new(&env, "depositor"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let amount: i128 = event_map
        .get(Symbol::new(&env, "amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();

    assert_eq!(admin, fixture.admin);
    assert_eq!(depositor, fixture.depositor);
    assert_eq!(amount, 500);
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
fn test_deposit_liquidity_transfers_funds_and_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 200);
    let liquidity_provider = Address::generate(&env);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&liquidity_provider, &1000);

    fixture.client.deposit_liquidity(&liquidity_provider, &400);

    let last_event = env.events().all().pop_back().unwrap();

    let event_map: Map<Symbol, soroban_sdk::Val> = last_event.2.try_into_val(&env).unwrap();
    let provider: Address = event_map
        .get(Symbol::new(&env, "provider"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let amount: i128 = event_map
        .get(Symbol::new(&env, "amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();

    assert_eq!(provider, liquidity_provider);
    assert_eq!(amount, 400);
}

#[test]
fn test_claim_swap_happy_path_with_fee_extraction_and_event() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 1000;
    let fixture = setup_test_environment(&env, target_swap_amount);
    let recipient = Address::generate(&env);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &target_swap_amount);

    let mock_tx_hash = BytesN::from_array(&env, &[7u8; 32]);
    let journal_data = BtcSwapJournal {
        btc_tx_hash: mock_tx_hash.clone(),
        recipient_stellar: recipient.clone(),
        swap_amount: target_swap_amount as u128,
        block_confirmations: 6,
    };

    let journal_buffer = journal_data.to_xdr(&env);
    let dummy_seal = Bytes::from_slice(&env, &[1, 2, 3, 4]);

    fixture
        .client
        .claim_swap(&recipient, &mock_tx_hash, &dummy_seal, &journal_buffer);

    let expected_fee = (target_swap_amount * fixture.fee_bps as i128) / 10000;
    let expected_recipient_payout = target_swap_amount - expected_fee;

    let last_event = env.events().all().pop_back().unwrap();

    let event_map: Map<Symbol, soroban_sdk::Val> = last_event.2.try_into_val(&env).unwrap();
    let parsed_recipient: Address = event_map
        .get(Symbol::new(&env, "recipient"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let parsed_tx_hash: BytesN<32> = event_map
        .get(Symbol::new(&env, "btc_tx_hash"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let net_amount: i128 = event_map
        .get(Symbol::new(&env, "net_amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let fee_amount: i128 = event_map
        .get(Symbol::new(&env, "fee_amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();

    assert_eq!(parsed_recipient, recipient);
    assert_eq!(parsed_tx_hash, mock_tx_hash);
    assert_eq!(net_amount, expected_recipient_payout);
    assert_eq!(fee_amount, expected_fee);
}

#[test]
#[should_panic(expected = "Lock duration active: Timeout threshold has not been reached")]
fn test_refund_swap_fails_before_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 500);
    fixture.client.refund_swap();
}

#[test]
fn test_refund_swap_succeeds_after_timeout_expiration_and_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 500;
    let fixture = setup_test_environment(&env, target_swap_amount);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &target_swap_amount);

    fixture
        .env
        .ledger()
        .set_timestamp(fixture.timeout_timestamp + 1);
    fixture.client.refund_swap();

    let last_event = env.events().all().pop_back().unwrap();

    let event_map: Map<Symbol, soroban_sdk::Val> = last_event.2.try_into_val(&env).unwrap();
    let depositor: Address = event_map
        .get(Symbol::new(&env, "depositor"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let amount: i128 = event_map
        .get(Symbol::new(&env, "amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();

    assert_eq!(depositor, fixture.depositor);
    assert_eq!(amount, target_swap_amount);
}

#[test]
fn test_emergency_withdraw_by_admin_and_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let fixture = setup_test_environment(&env, 100);

    let token_client = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_client.mint(&fixture.client.address, &500);

    fixture.client.emergency_withdraw(&300);

    let last_event = env.events().all().pop_back().unwrap();

    let event_map: Map<Symbol, soroban_sdk::Val> = last_event.2.try_into_val(&env).unwrap();
    let admin: Address = event_map
        .get(Symbol::new(&env, "admin"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();
    let amount: i128 = event_map
        .get(Symbol::new(&env, "amount"))
        .unwrap()
        .try_into_val(&env)
        .unwrap();

    assert_eq!(admin, fixture.admin);
    assert_eq!(amount, 300);
}
