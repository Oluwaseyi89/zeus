import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

const DEFAULT_STARKNET_RPC =
  process.env.STARKNET_RPC_URL ?? 'https://alpha4.starknet.io';

let starknetLib: any = null;
try {
  // dynamic require so developers without the package can still run non-account code

  starknetLib = require('starknet');
} catch (e) {
  starknetLib = null;
}

export interface ContractFunctionInput {
  name: string;
  type: string;
}

export interface ContractFunction {
  name: string;
  inputs: ContractFunctionInput[];
  outputs?: any[];
  state_mutability?: string;
}

export class AbiContract {
  address: string;
  abi: any[];

  constructor(abi: any[], address: string) {
    this.abi = abi;
    this.address = address;
  }

  getFunctions(): ContractFunction[] {
    const items = this.abi.filter(
      (i) => i.type === 'interface' || i.type === 'impl',
    );
    // ABI may contain multiple interface blocks; flatten functions
    const funcs: ContractFunction[] = [];
    this.abi.forEach((item) => {
      if (item.type === 'interface' && Array.isArray(item.items)) {
        item.items.forEach((it: any) => {
          if (it.type === 'function') {
            funcs.push({
              name: it.name,
              inputs: it.inputs ?? [],
              outputs: it.outputs ?? [],
              state_mutability: it.state_mutability,
            });
          }
        });
      }
    });
    return funcs;
  }

  findFunction(name: string): ContractFunction | undefined {
    return this.getFunctions().find((f) => f.name === name);
  }
}

@Injectable()
export class StarknetService {
  private abiDir: string;
  private readonly logger = new Logger(StarknetService.name);
  private provider: any | undefined;

  constructor() {
    this.abiDir = path.join(process.cwd(), 'src', 'abis');
    const rpc = process.env.STARKNET_RPC_URL ?? DEFAULT_STARKNET_RPC;
    if (starknetLib) {
      try {
        const Provider =
          starknetLib.Provider ??
          starknetLib.default?.Provider ??
          starknetLib.JsonRpcProvider;
        if (Provider) {
          this.provider = new Provider({ baseUrl: rpc });
          this.logger.log(
            'Initialized starknet provider from starknet library.',
          );
        }
      } catch (err) {
        this.logger.warn(
          'Failed to initialize starknet provider: ' + String(err),
        );
      }
    }
  }

  loadAbi(filename: string): any[] {
    const p = path.join(this.abiDir, filename);
    if (!fs.existsSync(p)) throw new Error(`ABI file not found: ${p}`);
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  }

  createContractClient(abiFilename: string, address: string): AbiContract {
    const abi = this.loadAbi(abiFilename);
    return new AbiContract(abi, address);
  }

  // Minimal Starknet RPC helpers for devnet testing.
  async callContract(
    address: string,
    entrypoint: string,
    calldata: any[] = [],
  ) {
    const rpc = process.env.STARKNET_RPC_URL ?? DEFAULT_STARKNET_RPC;
    try {
      if (this.provider && typeof this.provider.callContract === 'function') {
        // prefer provider.callContract when available
        const res = await this.provider.callContract({
          contractAddress: address,
          entrypoint,
          calldata,
        });
        return res;
      }
      const payload = {
        jsonrpc: '2.0',
        method: 'starknet_call',
        id: 1,
        params: [
          {
            contract_address: address,
            entry_point_selector: entrypoint,
            calldata,
          },
        ],
      };
      const res = await axios.post(rpc, payload, { timeout: 10000 });
      return res.data;
    } catch (err) {
      this.logger.warn(`starknet call failed: ${String(err)}`);
      // fallback: return a simulated response for dev
      return { result: null, error: 'rpc-unavailable' };
    }
  }

  async invokeContract(
    signerAddress: string,
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = [],
  ) {
    // For dev, we don't perform real invokes; return a placeholder object
    this.logger.debug(
      `invokeContract (dev): ${entrypoint} on ${contractAddress}`,
    );
    return { status: 'submitted', tx_hash: null };
  }

  getProvider(): any | undefined {
    return this.provider;
  }

  /**
   * Estimate fee for an invoke; prefers provider. Returns RPC response or fallback object.
   */
  async estimateFee(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = [],
  ) {
    const rpc = process.env.STARKNET_RPC_URL ?? DEFAULT_STARKNET_RPC;
    try {
      if (this.provider && typeof this.provider.estimateFee === 'function') {
        return await this.provider.estimateFee({
          contractAddress,
          entrypoint,
          calldata,
        });
      }
      const payload = {
        jsonrpc: '2.0',
        method: 'starknet_estimateFee',
        id: 1,
        params: [
          {
            contract_address: contractAddress,
            entry_point_selector: entrypoint,
            calldata,
          },
        ],
      };
      const res = await axios.post(rpc, payload, { timeout: 10000 });
      return res.data;
    } catch (err) {
      this.logger.warn('estimateFee failed: ' + String(err));
      return { error: 'estimate-failed' };
    }
  }
}
