#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, xdr::ToXdr, Address, Bytes, BytesN, Env};

// Import actual contract implementations from your workspace crates
use swap_escrow::{SwapEscrowContract, SwapEscrowContractClient};
use zeus_interfaces::BtcSwapJournal;
use zk_atomic_swap_verifier::{ZkAtomicSwapVerifier, ZkAtomicSwapVerifierClient};

// --- DUMMY ROUTER FOR NETHERMIND RISC0 VERIFIER INTERFACE ---
#[soroban_sdk::contract]
pub struct MockNethermindRouter;

#[soroban_sdk::contractimpl]
impl MockNethermindRouter {
    pub fn verify(_env: Env, _seal: Bytes, _image_id: BytesN<32>, _journal_digest: BytesN<32>) {
        // Yield success cleanly to simulate valid zero-knowledge circuit completion
    }
}

// --- END-TO-END P2P FIXTURE ---
struct IntegrationFixture<'a> {
    _env: Env,
    escrow_client: SwapEscrowContractClient<'a>,
    verifier_client: ZkAtomicSwapVerifierClient<'a>,
    _admin: Address,
    recipient: Address,
    token_id: Address,
}

fn setup_integration_environment(env: &Env, swap_amount: i128) -> IntegrationFixture<'_> {
    let admin = Address::generate(env);
    let recipient = Address::generate(env);
    let token_admin = Address::generate(env);

    // 1. Deploy modern SEP-0041 Asset Contract
    let sac_instance = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_id = sac_instance.address();

    // 2. Deploy Nethermind Mock Router Dependency
    let router_addr = env.register(MockNethermindRouter, ());

    // 3. Deploy and Initialize Actual ZkAtomicSwapVerifier Contract
    let verifier_addr = env.register(ZkAtomicSwapVerifier, ());
    let verifier_client = ZkAtomicSwapVerifierClient::new(env, &verifier_addr);
    verifier_client.initialize(&admin, &router_addr);

    // 4. Deploy and Initialize Actual SwapEscrowContract
    let escrow_addr = env.register(SwapEscrowContract, ());
    let escrow_client = SwapEscrowContractClient::new(env, &escrow_addr);
    escrow_client.initialize(&admin, &verifier_addr, &token_id, &swap_amount);

    IntegrationFixture {
        _env: env.clone(),
        escrow_client,
        verifier_client,
        _admin: admin,
        recipient,
        token_id,
    }
}

// --- INTEGRATION SUITE ---

#[test]
fn test_e2e_p2p_zk_atomic_swap_settlement() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 5000;
    let fixture = setup_integration_environment(&env, target_swap_amount);

    // Seed the escrow vault with target liquidity to fund the swap
    let token_initializer = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_initializer.mint(&fixture.escrow_client.address, &target_swap_amount);

    // Construct valid BtcSwapJournal schema payload mapping exactly to user intents
    let mock_btc_tx_hash = BytesN::from_array(&env, &[9u8; 32]);
    let journal_payload = BtcSwapJournal {
        btc_tx_hash: mock_btc_tx_hash.clone(),
        recipient_stellar: fixture.recipient.clone(),
        swap_amount: target_swap_amount as u128,
        block_confirmations: 6,
    };

    // Serialize payload to plain XDR bytes to pass cross-contract boundary structures securely
    let serialized_journal = journal_payload.to_xdr(&env);
    let mock_seal = Bytes::from_slice(&env, &[0xAA, 0xBB, 0xCC]);

    // Ensure verifier state reports pristine settlement mapping status before execution
    assert!(!fixture.verifier_client.is_tx_spent(&mock_btc_tx_hash));

    // Execute End-to-End Claim Execution over cross-contract environment channel bounds
    fixture.escrow_client.claim_swap(
        &fixture.recipient,
        &mock_btc_tx_hash,
        &mock_seal,
        &serialized_journal,
    );

    // --- STRUCTURAL ASSERTIONS ---
    let standard_token = token::Client::new(&env, &fixture.token_id);

    // Verify liquidity transferred peer-to-peer flawlessly directly to recipient
    assert_eq!(
        standard_token.balance(&fixture.recipient),
        target_swap_amount
    );
    assert_eq!(standard_token.balance(&fixture.escrow_client.address), 0);

    // Verify the verifier tagged the transaction nullifier to prevent double-spending replay vectors
    assert!(fixture.verifier_client.is_tx_spent(&mock_btc_tx_hash));
}

#[test]
#[should_panic(expected = "Transaction has already been spent")]
fn test_integration_replay_attack_prevention() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 5000;
    let fixture = setup_integration_environment(&env, target_swap_amount);

    // Seed liquidity pool vault with enough funds to cover multiple potential transfers
    let token_initializer = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_initializer.mint(&fixture.escrow_client.address, &(target_swap_amount * 2));

    let mock_btc_tx_hash = BytesN::from_array(&env, &[9u8; 32]);
    let journal_payload = BtcSwapJournal {
        btc_tx_hash: mock_btc_tx_hash.clone(),
        recipient_stellar: fixture.recipient.clone(),
        swap_amount: target_swap_amount as u128,
        block_confirmations: 6,
    };

    let serialized_journal = journal_payload.to_xdr(&env);
    let mock_seal = Bytes::from_slice(&env, &[0xAA, 0xBB, 0xCC]);

    // Initial successful claim
    fixture.escrow_client.claim_swap(
        &fixture.recipient,
        &mock_btc_tx_hash,
        &mock_seal,
        &serialized_journal,
    );

    // Re-execution attempt with identical proofs must trap and panic
    fixture.escrow_client.claim_swap(
        &fixture.recipient,
        &mock_btc_tx_hash,
        &mock_seal,
        &serialized_journal,
    );
}

#[test]
#[should_panic(expected = "Recipient address mismatch with verified journal")]
fn test_integration_recipient_mismatch_safeguard() {
    let env = Env::default();
    env.mock_all_auths();

    let target_swap_amount: i128 = 5000;
    let fixture = setup_integration_environment(&env, target_swap_amount);

    let token_initializer = token::StellarAssetClient::new(&env, &fixture.token_id);
    token_initializer.mint(&fixture.escrow_client.address, &target_swap_amount);

    let mock_btc_tx_hash = BytesN::from_array(&env, &[9u8; 32]);
    let malicious_attacker = Address::generate(&env);

    // Construct journal pointing securely to the true recipient
    let journal_payload = BtcSwapJournal {
        btc_tx_hash: mock_btc_tx_hash.clone(),
        recipient_stellar: fixture.recipient.clone(),
        swap_amount: target_swap_amount as u128,
        block_confirmations: 6,
    };

    let serialized_journal = journal_payload.to_xdr(&env);
    let mock_seal = Bytes::from_slice(&env, &[0xAA, 0xBB, 0xCC]);

    // Attack execution vector: Attempting to call swap with an unauthenticated malicious address parameter
    fixture.escrow_client.claim_swap(
        &malicious_attacker,
        &mock_btc_tx_hash,
        &mock_seal,
        &serialized_journal,
    );
}
