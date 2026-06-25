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
    contractId: "CCS2Q3LYJLW3HOUVZE7BHBJU6KDPCB6Z7T4Z7IMSZJLOJFC6A2TFA5XT",
  }
} as const

export type StorageKey = {tag: "Admin", values: void} | {tag: "RouterId", values: void} | {tag: "Active", values: void} | {tag: "Initialized", values: void} | {tag: "Relayer", values: readonly [string]};

export const VerifierError = {
  1: {message:"InvalidZkSeal"},
  2: {message:"BtcTxAlreadySpent"},
  3: {message:"UnauthorizedRelayer"},
  4: {message:"VerifierPaused"},
  5: {message:"NotInitialized"},
  6: {message:"AlreadyInitialized"},
  7: {message:"Unauthorized"}
}



export interface BtcSwapJournal {
  block_confirmations: u32;
  btc_tx_hash: Buffer;
  recipient_stellar: string;
  swap_amount: u128;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, router_id}: {admin: string, router_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_tx_spent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_tx_spent: ({btc_tx_hash}: {btc_tx_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a remove_relayer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_relayer: ({relayer}: {relayer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verify_btc_swap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verify_btc_swap: ({journal_bytes, seal, image_id}: {journal_bytes: Buffer, seal: Buffer, image_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<BtcSwapJournal>>

  /**
   * Construct and simulate a update_router_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update_router_id: ({new_router_id}: {new_router_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_active_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_active_status: ({status}: {status: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a whitelist_relayer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  whitelist_relayer: ({relayer}: {relayer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_verifier_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_verifier_status: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAClN0b3JhZ2VLZXkAAAAAAAUAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAACFJvdXRlcklkAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAtJbml0aWFsaXplZAAAAAABAAAAAAAAAAdSZWxheWVyAAAAAAEAAAAT",
        "AAAABAAAAAAAAAAAAAAADVZlcmlmaWVyRXJyb3IAAAAAAAAHAAAAAAAAAA1JbnZhbGlkWmtTZWFsAAAAAAAAAQAAAAAAAAARQnRjVHhBbHJlYWR5U3BlbnQAAAAAAAACAAAAAAAAABNVbmF1dGhvcml6ZWRSZWxheWVyAAAAAAMAAAAAAAAADlZlcmlmaWVyUGF1c2VkAAAAAAAEAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAABQAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAAGAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAH",
        "AAAABQAAAAAAAAAAAAAAElprQnRjVmVyaWZpZWRFdmVudAAAAAAAAQAAABV6a19idGNfdmVyaWZpZWRfZXZlbnQAAAAAAAAEAAAAAAAAAAV0b3BpYwAAAAAAABEAAAABAAAAAAAAAAtidGNfdHhfaGFzaAAAAAPuAAAAIAAAAAEAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAoAAAAAAAAAAg==",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAlyb3V0ZXJfaWQAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALaXNfdHhfc3BlbnQAAAAAAQAAAAAAAAALYnRjX3R4X2hhc2gAAAAD7gAAACAAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAOcmVtb3ZlX3JlbGF5ZXIAAAAAAAEAAAAAAAAAB3JlbGF5ZXIAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAPdmVyaWZ5X2J0Y19zd2FwAAAAAAMAAAAAAAAADWpvdXJuYWxfYnl0ZXMAAAAAAAAOAAAAAAAAAARzZWFsAAAADgAAAAAAAAAIaW1hZ2VfaWQAAAPuAAAAIAAAAAEAAAfQAAAADkJ0Y1N3YXBKb3VybmFsAAA=",
        "AAAAAAAAAAAAAAAQdXBkYXRlX3JvdXRlcl9pZAAAAAEAAAAAAAAADW5ld19yb3V0ZXJfaWQAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAARc2V0X2FjdGl2ZV9zdGF0dXMAAAAAAAABAAAAAAAAAAZzdGF0dXMAAAAAAAEAAAAA",
        "AAAAAAAAAAAAAAARd2hpdGVsaXN0X3JlbGF5ZXIAAAAAAAABAAAAAAAAAAdyZWxheWVyAAAAABMAAAAA",
        "AAAAAAAAAAAAAAATZ2V0X3ZlcmlmaWVyX3N0YXR1cwAAAAAAAAAAAQAAAAE=",
        "AAAAAQAAAAAAAAAAAAAADkJ0Y1N3YXBKb3VybmFsAAAAAAAEAAAAAAAAABNibG9ja19jb25maXJtYXRpb25zAAAAAAQAAAAAAAAAC2J0Y190eF9oYXNoAAAAA+4AAAAgAAAAAAAAABFyZWNpcGllbnRfc3RlbGxhcgAAAAAAABMAAAAAAAAAC3N3YXBfYW1vdW50AAAAAAo=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        is_tx_spent: this.txFromJSON<boolean>,
        remove_relayer: this.txFromJSON<null>,
        verify_btc_swap: this.txFromJSON<BtcSwapJournal>,
        update_router_id: this.txFromJSON<null>,
        set_active_status: this.txFromJSON<null>,
        whitelist_relayer: this.txFromJSON<null>,
        get_verifier_status: this.txFromJSON<boolean>
  }
}