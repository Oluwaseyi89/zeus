import * as fs from 'fs';
import * as path from 'path';

let starknetLib: any = null;
try {
  starknetLib = require('starknet');
} catch (e) {
  starknetLib = null;
}

const ABI_DIR = path.join(process.cwd(), 'src', 'abis');

export function loadAbi(name: string): any {
  if (!name.endsWith('.json')) name += '.json';
  const p = path.join(ABI_DIR, name);
  if (!fs.existsSync(p)) throw new Error(`ABI not found: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function toUint256Parts(
  amount: string | number | bigint,
): [string, string] {
  const v = BigInt(amount.toString());
  const MASK = (BigInt(1) << BigInt(128)) - BigInt(1);
  const low = (v & MASK).toString();
  const high = (v >> BigInt(128)).toString();
  return [low, high];
}

export function textToFeltArray(s: string, maxLen = 255): string[] {
  const buf = Buffer.from(String(s).slice(0, maxLen), 'utf8');
  return Array.from(buf).map((b) => '0x' + b.toString(16).padStart(2, '0'));
}

export function instantiateWalletAccount(
  nodeUrl: string,
  address: string,
  privateKey: string,
) {
  if (!starknetLib) throw new Error('starknet library not installed');
  const Provider =
    starknetLib.Provider ??
    starknetLib.JsonRpcProvider ??
    starknetLib.default?.Provider ??
    starknetLib.RpcProvider;
  const Account = starknetLib.Account ?? starknetLib.default?.Account;
  if (!Provider || !Account)
    throw new Error('starknet exports missing Provider/Account');
  const provider = new Provider({ baseUrl: nodeUrl });
  const account = new Account(provider, address, privateKey);
  return { provider, account };
}

// Alias that mirrors many examples using RpcProvider naming
export function instantiateWalletAccountRpc(
  nodeUrl: string,
  address: string,
  privateKey: string,
) {
  return instantiateWalletAccount(nodeUrl, address, privateKey);
}

/**
 * Create a contract API object from an ABI file. Methods created correspond
 * to the ABI function names. Each method signature is: async (execOrParams?, ...params)
 * - If execOrParams looks like an account/provider object (has account or execute), it's used as executor.
 * - If execOrParams is a plain object and CallData exists, it will be compiled into calldata.
 * - If no executor provided, the function will attempt to instantiate an account
 *   from `STARKNET_ACCOUNT_PRIVATE_KEY`/`STARKNET_ACCOUNT_ADDRESS` and use that.
 */
export function createContractApi(
  abiFilename: string,
  contractAddress: string,
  starknetService?: any,
) {
  const abi = loadAbi(abiFilename);
  // find function descriptors
  const funcs: any[] = [];
  abi.forEach((it: any) => {
    if (
      (it.type === 'interface' || it.type === 'impl') &&
      Array.isArray(it.items)
    ) {
      it.items.forEach((f: any) => {
        if (f.type === 'function') funcs.push(f);
      });
    }
  });

  const api: any = {};

  const defaultExecFactory = () => {
    if (
      process.env.STARKNET_ACCOUNT_PRIVATE_KEY &&
      process.env.STARKNET_ACCOUNT_ADDRESS
    ) {
      try {
        return instantiateWalletAccount(
          process.env.STARKNET_RPC_URL ?? '',
          process.env.STARKNET_ACCOUNT_ADDRESS,
          process.env.STARKNET_ACCOUNT_PRIVATE_KEY,
        );
      } catch (err) {
        // ignore
      }
    }
    // fallback to starknetService if provided
    if (starknetService) return starknetService;
    return null;
  };

  funcs.forEach((f) => {
    const name = f.name;
    const isView = (f.state_mutability ?? '').toLowerCase() === 'view';

    api[name] = async function (execOrParams?: any, ...restParams: any[]) {
      // detect executor
      let exec: any = null;
      let params: any[] = [];
      if (
        execOrParams &&
        (execOrParams.account ||
          typeof execOrParams.execute === 'function' ||
          typeof execOrParams.callContract === 'function' ||
          typeof execOrParams.call === 'function')
      ) {
        exec = execOrParams;
        params = restParams;
      } else {
        // exec not provided; treat execOrParams as params
        params = [execOrParams, ...restParams].filter(
          (p) => typeof p !== 'undefined',
        );
        exec = defaultExecFactory();
      }

      // If params is a single object and CallData exists, try to compile
      let calldata: any[] = [];
      if (
        params.length === 1 &&
        params[0] &&
        typeof params[0] === 'object' &&
        starknetLib &&
        (starknetLib.CallData || starknetLib.default?.CallData)
      ) {
        try {
          const CallData =
            starknetLib.CallData ?? starknetLib.default?.CallData;
          const cd = new CallData(abi);
          calldata = cd.compile(name, params[0]);
        } catch (err) {
          // fallback to flat object -> values
          calldata = Object.values(params[0]);
        }
      } else {
        // flatten params to string values
        calldata = params.map((p) =>
          typeof p === 'bigint' ? p.toString() : p,
        );
      }

      if (isView) {
        return callViewFunction(
          exec ?? starknetService,
          contractAddress,
          name,
          calldata,
        );
      }

      // state-changing: execute
      if (!exec)
        throw new Error(
          'No executor available for write call; provide account or set STARKNET_ACCOUNT_PRIVATE_KEY/STARKNET_ACCOUNT_ADDRESS',
        );
      return executeFunction(exec, contractAddress, name, calldata);
    };
  });

  return api;
}

// Prepare calldata for SwapEscrow.initiate_swap
export function prepareInitiateSwapCalldata(opts: {
  counterparty: string;
  tokenA: string;
  tokenB: string;
  amountA: string | number | bigint;
  amountB: string | number | bigint;
  hashlock: string;
  timelock: string | number | bigint;
}): string[] {
  const a = toUint256Parts(opts.amountA);
  const b = toUint256Parts(opts.amountB);
  return [
    opts.counterparty,
    opts.tokenA,
    opts.tokenB,
    a[0],
    a[1],
    b[0],
    b[1],
    opts.hashlock,
    String(opts.timelock),
  ];
}

// High-level helper to execute initiate_swap via an Account (waits for inclusion)
export async function executeInitiateSwap(
  accountOrProvider: any,
  escrowAddress: string,
  calldata: string[],
  options: { nodeUrl?: string } = {},
) {
  // accountOrProvider may be { account, provider } or an Account instance
  let account: any = null;
  let provider: any = null;
  if (accountOrProvider && accountOrProvider.account) {
    account = accountOrProvider.account;
    provider = accountOrProvider.provider;
  } else if (
    accountOrProvider &&
    typeof accountOrProvider.execute === 'function'
  ) {
    account = accountOrProvider;
    provider = accountOrProvider.provider ?? null;
  }

  if (!account)
    throw new Error('Account instance required to execute transaction');

  const call = {
    contractAddress: escrowAddress,
    entrypoint: 'initiate_swap',
    calldata,
  };

  const result = await account.execute(call);
  const txHash = result?.transaction_hash ?? result?.hash ?? null;
  if (provider && txHash && typeof provider.waitForTransaction === 'function') {
    await provider.waitForTransaction(txHash);
  }
  return { txHash, raw: result };
}

// Parse a SwapEscrow.get_swap response (RPC call result) into a JS object
export function parseAtomicSwapResponse(resp: any) {
  // Expect resp to either be structured object or a flat array of felts
  if (!resp) return null;
  // If result array is present (starknet_call via RPC)
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  if (!Array.isArray(arr)) return resp;
  // Map fields according to SwapEscrow AtomicSwapResponse struct order from ABI
  // swap_id, initiator, counterparty, token_a, token_b, amount_a(low,high), amount_b(low,high), hashlock, timelock, status, secret, secret_revealed, created_at, funded_at, completed_at
  const r: any = {};
  let i = 0;
  r.swap_id = arr[i++];
  r.initiator = arr[i++];
  r.counterparty = arr[i++];
  r.token_a = arr[i++];
  r.token_b = arr[i++];
  r.amount_a = { low: arr[i++], high: arr[i++] };
  r.amount_b = { low: arr[i++], high: arr[i++] };
  r.hashlock = arr[i++];
  r.timelock = arr[i++];
  r.status = arr[i++];
  r.secret = arr[i++];
  r.secret_revealed = arr[i++];
  r.created_at = arr[i++];
  r.funded_at = arr[i++];
  r.completed_at = arr[i++];
  return r;
}

// --- BTCVault helpers ---
export function prepareRequestWithdrawalCalldata(opts: {
  amount: string | number | bigint;
  bitcoin_address: string;
}) {
  const a = toUint256Parts(opts.amount);
  return [a[0], a[1], opts.bitcoin_address];
}

export async function executeRequestWithdrawal(
  accountOrProvider: any,
  vaultAddress: string,
  calldata: string[],
) {
  let account: any = null;
  let provider: any = null;
  if (accountOrProvider && accountOrProvider.account) {
    account = accountOrProvider.account;
    provider = accountOrProvider.provider;
  } else if (
    accountOrProvider &&
    typeof accountOrProvider.execute === 'function'
  ) {
    account = accountOrProvider;
    provider = accountOrProvider.provider ?? null;
  }
  if (!account)
    throw new Error('Account instance required to execute transaction');
  const call = {
    contractAddress: vaultAddress,
    entrypoint: 'request_withdrawal',
    calldata,
  };
  const result = await account.execute(call);
  const txHash = result?.transaction_hash ?? result?.hash ?? null;
  if (provider && txHash && typeof provider.waitForTransaction === 'function') {
    await provider.waitForTransaction(txHash);
  }
  return { txHash, raw: result };
}

export function parseUTXOResponse(resp: any) {
  if (!resp) return null;
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  if (!Array.isArray(arr)) return resp;
  const r: any = {};
  let i = 0;
  r.txid = arr[i++];
  r.vout = arr[i++];
  r.amount = arr[i++];
  r.script_pubkey = arr[i++];
  r.owner = arr[i++];
  r.status = arr[i++];
  r.locked_until = arr[i++];
  r.created_at = arr[i++];
  r.spent_at = arr[i++];
  r.confirmations = arr[i++];
  return r;
}

export function parseVaultStats(resp: any) {
  if (!resp) return null;
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  if (!Array.isArray(arr)) return resp;
  const r: any = {};
  let i = 0;
  r.total_btc_locked = { low: arr[i++], high: arr[i++] };
  r.total_utxos = arr[i++];
  r.total_withdrawals = arr[i++];
  r.total_withdrawal_amount = { low: arr[i++], high: arr[i++] };
  r.total_deposits = arr[i++];
  r.total_deposit_amount = { low: arr[i++], high: arr[i++] };
  r.active_swaps = arr[i++];
  r.last_updated = arr[i++];
  return r;
}

// Generic executor that uses an account to run an entrypoint and waits for tx
export async function executeFunction(
  accountOrProvider: any,
  contractAddress: string,
  entrypoint: string,
  calldata: any[] = [],
) {
  let account: any = null;
  let provider: any = null;
  if (accountOrProvider && accountOrProvider.account) {
    account = accountOrProvider.account;
    provider = accountOrProvider.provider;
  } else if (
    accountOrProvider &&
    typeof accountOrProvider.execute === 'function'
  ) {
    account = accountOrProvider;
    provider = accountOrProvider.provider ?? null;
  }
  if (!account)
    throw new Error('Account instance required to execute transaction');
  const call = { contractAddress, entrypoint, calldata };
  const result = await account.execute(call);
  const txHash = result?.transaction_hash ?? result?.hash ?? null;
  if (provider && txHash && typeof provider.waitForTransaction === 'function') {
    await provider.waitForTransaction(txHash);
  }
  return { txHash, raw: result };
}

// Generic view caller: accepts a StarknetService-like object (has callContract) or a provider with callContract
export async function callViewFunction(
  exec: any,
  contractAddress: string,
  entrypoint: string,
  calldata: any[] = [],
) {
  try {
    if (exec && typeof exec.callContract === 'function') {
      return await exec.callContract(contractAddress, entrypoint, calldata);
    }
    // fallback: assume exec is a provider with callContract signature
    if (exec && typeof exec.call === 'function') {
      // raw RPC
      return await exec.call(contractAddress, entrypoint, calldata);
    }
  } catch (err) {
    // ignore and return null for dev
  }
  return { result: null };
}

// Wait for tx and find an event by name in receipt (best-effort when provider supports receipts)
export async function waitForTxAndFindEvent(
  provider: any,
  txHash: string,
  eventName: string,
) {
  if (!provider || !txHash) return null;
  try {
    if (typeof provider.getTransactionReceipt === 'function') {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || !Array.isArray(receipt.events)) return null;
      const events: any[] = receipt.events;
      if (!starknetLib || !starknetLib.hash) return { receipt };
      const selector = starknetLib.hash.getSelectorFromName(eventName);
      const found = events.find(
        (e) => Array.isArray(e.keys) && e.keys[0] === selector,
      );
      return { event: found ?? null, receipt };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// ---------------- SwapEscrow helpers ----------------
export async function executeFundSwap(
  accountOrProvider: any,
  escrowAddress: string,
  swapId: string,
) {
  return executeFunction(accountOrProvider, escrowAddress, 'fund_swap', [
    swapId,
  ]);
}

export async function executeCompleteSwap(
  accountOrProvider: any,
  escrowAddress: string,
  swapId: string,
  secret: string,
) {
  return executeFunction(accountOrProvider, escrowAddress, 'complete_swap', [
    swapId,
    secret,
  ]);
}

export async function executeRefundSwap(
  accountOrProvider: any,
  escrowAddress: string,
  swapId: string,
) {
  return executeFunction(accountOrProvider, escrowAddress, 'refund_swap', [
    swapId,
  ]);
}

export async function getSwap(
  exec: any,
  escrowAddress: string,
  swapId: string,
) {
  const resp = await callViewFunction(exec, escrowAddress, 'get_swap', [
    swapId,
  ]);
  return parseAtomicSwapResponse(resp?.result ?? resp);
}

export async function getSwapStatus(
  exec: any,
  escrowAddress: string,
  swapId: string,
) {
  const resp = await callViewFunction(exec, escrowAddress, 'get_swap_status', [
    swapId,
  ]);
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  return Array.isArray(arr) ? arr[0] : arr;
}

export async function canRefund(
  exec: any,
  escrowAddress: string,
  swapId: string,
) {
  const resp = await callViewFunction(exec, escrowAddress, 'can_refund', [
    swapId,
  ]);
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  return Array.isArray(arr) ? Boolean(arr[0]) : Boolean(arr);
}

// ---------------- ZKBTC helpers ----------------
export async function executeNativeMint(
  accountOrProvider: any,
  zkbtcAddress: string,
  to: string,
  amount: string | number | bigint,
  btcTxId: string,
) {
  const parts = toUint256Parts(amount);
  return executeFunction(accountOrProvider, zkbtcAddress, 'native_mint', [
    to,
    parts[0],
    parts[1],
    btcTxId,
  ]);
}

export async function executeNativeBurn(
  accountOrProvider: any,
  zkbtcAddress: string,
  from: string,
  amount: string | number | bigint,
  btcAddress: string,
) {
  const parts = toUint256Parts(amount);
  return executeFunction(accountOrProvider, zkbtcAddress, 'native_burn', [
    from,
    parts[0],
    parts[1],
    btcAddress,
  ]);
}

export async function executeBridgeMint(
  accountOrProvider: any,
  zkbtcAddress: string,
  to: string,
  amount: string | number | bigint,
  btcTxId: string,
) {
  const parts = toUint256Parts(amount);
  return executeFunction(accountOrProvider, zkbtcAddress, 'bridge_mint', [
    to,
    parts[0],
    parts[1],
    btcTxId,
  ]);
}

export async function getMintRequest(
  exec: any,
  zkbtcAddress: string,
  btcTxId: string,
) {
  const resp = await callViewFunction(exec, zkbtcAddress, 'get_mint_request', [
    btcTxId,
  ]);
  return resp?.result ?? resp;
}

export async function getFeeConfig(exec: any, zkbtcAddress: string) {
  const resp = await callViewFunction(exec, zkbtcAddress, 'get_fee_config', []);
  return resp?.result ?? resp;
}

export async function isBridgeWhitelisted(
  exec: any,
  zkbtcAddress: string,
  bridgeAddr: string,
) {
  const resp = await callViewFunction(
    exec,
    zkbtcAddress,
    'is_bridge_whitelisted',
    [bridgeAddr],
  );
  const arr = Array.isArray(resp.result) ? resp.result : resp;
  return Array.isArray(arr) ? Boolean(arr[0]) : Boolean(arr);
}

// ---------------- BitcoinBridge helpers ----------------
export function prepareDepositBTCCalldata(opts: {
  txid: string;
  vout: number;
  amount: number | string;
  script_pubkey: string;
  address: string;
  proof: string[];
  block_height: number | string;
}) {
  const a = String(opts.amount);
  return [
    opts.txid,
    String(opts.vout),
    a,
    opts.script_pubkey,
    opts.address,
    ...(opts.proof ?? []),
    String(opts.block_height),
  ];
}

export async function executeDepositBTC(
  accountOrProvider: any,
  bridgeAddress: string,
  calldata: any[],
) {
  return executeFunction(
    accountOrProvider,
    bridgeAddress,
    'deposit_btc',
    calldata,
  );
}

export async function executeInitiateWithdrawal(
  accountOrProvider: any,
  bridgeAddress: string,
  amount: string | number | bigint,
  btcAddress: string,
) {
  const a = toUint256Parts(amount);
  return executeFunction(
    accountOrProvider,
    bridgeAddress,
    'initiate_withdrawal',
    [a[0], a[1], btcAddress],
  );
}

export async function executeSignWithdrawal(
  accountOrProvider: any,
  bridgeAddress: string,
  withdrawalId: string,
) {
  return executeFunction(accountOrProvider, bridgeAddress, 'sign_withdrawal', [
    withdrawalId,
  ]);
}

export async function executeExecuteWithdrawal(
  accountOrProvider: any,
  bridgeAddress: string,
  withdrawalId: string,
  btcTxId: string,
) {
  return executeFunction(
    accountOrProvider,
    bridgeAddress,
    'execute_withdrawal',
    [withdrawalId, btcTxId],
  );
}

export async function getBridgeStats(exec: any, bridgeAddress: string) {
  const resp = await callViewFunction(
    exec,
    bridgeAddress,
    'get_bridge_stats',
    [],
  );
  return resp?.result ?? resp;
}

export async function getBridgeUTXO(
  exec: any,
  bridgeAddress: string,
  utxoHash: string,
) {
  const resp = await callViewFunction(exec, bridgeAddress, 'get_utxo', [
    utxoHash,
  ]);
  return resp?.result ?? resp;
}

// ---------------- StarknetAtomicBridge helpers ----------------
export function prepareBridgeInitiateCalldata(opts: {
  counterparty: string;
  bridge_type: number;
  amount_btc: string | number | bigint;
  amount_strk: string | number | bigint;
  hashlock: string;
  timelock: string | number | bigint;
}) {
  const a = toUint256Parts(opts.amount_btc);
  const b = toUint256Parts(opts.amount_strk);
  return [
    opts.counterparty,
    String(opts.bridge_type),
    a[0],
    a[1],
    b[0],
    b[1],
    opts.hashlock,
    String(opts.timelock),
  ];
}

export async function executeBridgeInitiateSwap(
  accountOrProvider: any,
  bridgeAddress: string,
  calldata: any[],
) {
  return executeFunction(
    accountOrProvider,
    bridgeAddress,
    'initiate_swap',
    calldata,
  );
}

export async function executeBridgeFundSwap(
  accountOrProvider: any,
  bridgeAddress: string,
  swapId: string,
) {
  return executeFunction(accountOrProvider, bridgeAddress, 'fund_swap', [
    swapId,
  ]);
}

export async function executeBridgeCompleteSwap(
  accountOrProvider: any,
  bridgeAddress: string,
  swapId: string,
  secret: string,
  btcTxId?: string,
) {
  const args = [swapId, secret];
  if (btcTxId) args.push(btcTxId);
  return executeFunction(
    accountOrProvider,
    bridgeAddress,
    'complete_swap',
    args,
  );
}

export async function getBridgeSwap(
  exec: any,
  bridgeAddress: string,
  swapId: string,
) {
  const resp = await callViewFunction(exec, bridgeAddress, 'get_swap', [
    swapId,
  ]);
  return resp?.result ?? resp;
}

export async function getBridgeStatsSimple(exec: any, bridgeAddress: string) {
  const resp = await callViewFunction(
    exec,
    bridgeAddress,
    'get_bridge_stats',
    [],
  );
  return resp?.result ?? resp;
}

// ---------------- ZKAtomicSwapVerifier helpers ----------------
export async function getVerifierProof(
  exec: any,
  verifierAddress: string,
  proofId: string,
) {
  const resp = await callViewFunction(exec, verifierAddress, 'get_proof', [
    proofId,
  ]);
  return resp?.result ?? resp;
}

export async function getVerifierStats(exec: any, verifierAddress: string) {
  const resp = await callViewFunction(exec, verifierAddress, 'get_stats', []);
  return resp?.result ?? resp;
}

export default {
  loadAbi,
  toUint256Parts,
  textToFeltArray,
  instantiateWalletAccount,
  prepareInitiateSwapCalldata,
  executeInitiateSwap,
  parseAtomicSwapResponse,
  prepareRequestWithdrawalCalldata,
  executeRequestWithdrawal,
  parseUTXOResponse,
  parseVaultStats,
  // generic
  executeFunction,
  callViewFunction,
  waitForTxAndFindEvent,
  // swap
  executeFundSwap,
  executeCompleteSwap,
  executeRefundSwap,
  getSwap,
  getSwapStatus,
  canRefund,
  // zkbtc
  executeNativeMint,
  executeNativeBurn,
  executeBridgeMint,
  getMintRequest,
  getFeeConfig,
  isBridgeWhitelisted,
  // bitcoin bridge
  prepareDepositBTCCalldata,
  executeDepositBTC,
  executeInitiateWithdrawal,
  executeSignWithdrawal,
  executeExecuteWithdrawal,
  getBridgeStats,
  getBridgeUTXO,
  // atomic bridge
  prepareBridgeInitiateCalldata,
  executeBridgeInitiateSwap,
  executeBridgeFundSwap,
  executeBridgeCompleteSwap,
  getBridgeSwap,
  getBridgeStatsSimple,
  // verifier
  getVerifierProof,
  getVerifierStats,
};
