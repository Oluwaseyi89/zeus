import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBAISPE5ZXRENN3CTXRA4TU4GY5C7BN46YECCHRPFFP4ZGS5IAN4DSBA",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "EscrowWasmHash", values: void};

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the Factory with an administrative identity and the pre-installed SwapEscrow WASM hash.
   */
  initialize: ({admin, wasm_hash}: {admin: string, wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_escrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Dynamically deploys and initializes a new isolated instance of the SwapEscrowContract.
   */
  create_escrow: ({salt, verifier, token, depositor, treasury, swap_amount, timeout_timestamp, fee_bps}: {salt: Buffer, verifier: string, token: string, depositor: string, treasury: string, swap_amount: i128, timeout_timestamp: u64, fee_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a update_wasm_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the blueprint WASM hash for future escrow deployments (e.g., moving to a v2 Escrow)
   */
  update_wasm_hash: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAORXNjcm93V2FzbUhhc2gAAA==",
        "AAAAAAAAAGNJbml0aWFsaXplcyB0aGUgRmFjdG9yeSB3aXRoIGFuIGFkbWluaXN0cmF0aXZlIGlkZW50aXR5IGFuZCB0aGUgcHJlLWluc3RhbGxlZCBTd2FwRXNjcm93IFdBU00gaGFzaC4AAAAACmluaXRpYWxpemUAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAFZEeW5hbWljYWxseSBkZXBsb3lzIGFuZCBpbml0aWFsaXplcyBhIG5ldyBpc29sYXRlZCBpbnN0YW5jZSBvZiB0aGUgU3dhcEVzY3Jvd0NvbnRyYWN0LgAAAAAADWNyZWF0ZV9lc2Nyb3cAAAAAAAAIAAAAAAAAAARzYWx0AAAD7gAAACAAAAAAAAAACHZlcmlmaWVyAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAlkZXBvc2l0b3IAAAAAAAATAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAC3N3YXBfYW1vdW50AAAAAAsAAAAAAAAAEXRpbWVvdXRfdGltZXN0YW1wAAAAAAAABgAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAQAAABM=",
        "AAAAAAAAAFtVcGdyYWRlIHRoZSBibHVlcHJpbnQgV0FTTSBoYXNoIGZvciBmdXR1cmUgZXNjcm93IGRlcGxveW1lbnRzIChlLmcuLCBtb3ZpbmcgdG8gYSB2MiBFc2Nyb3cpAAAAABB1cGRhdGVfd2FzbV9oYXNoAAAAAQAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        create_escrow: this.txFromJSON<string>,
        update_wasm_hash: this.txFromJSON<null>
  }
}