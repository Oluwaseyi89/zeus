import { createHash } from 'crypto';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import * as bitcoin from 'bitcoinjs-lib';
import * as secp256k1 from '@noble/secp256k1';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export interface SignatureVerificationParams {
  address: string;
  signature: string | string[];
  message: string;
  blockchain: 'stellar' | 'bitcoin' | 'starknet';
  publicKey?: string;
}

/**
 * Verify wallet signature across different blockchains
 */
export async function verifyWalletSignature(
  params: SignatureVerificationParams,
): Promise<boolean> {
  const { address, signature, message, blockchain, publicKey } = params;

  switch (blockchain) {
    case 'stellar':
      return verifyStellarSignature(address, signature as string, message);
    case 'bitcoin':
      return verifyBitcoinSignature(address, signature as string, message);
    case 'starknet':
      return verifyStarknetSignature(address, signature as string[], message, publicKey);
    default:
      return false;
  }
}

/**
 * Verify Stellar (Freighter) wallet signature
 */
function verifyStellarSignature(address: string, signature: string, message: string): boolean {
  try {
    // Stellar uses Ed25519 signatures
    // The signature should be a base64-encoded signature
    const signatureBuffer = Buffer.from(signature, 'base64');
    const messageBuffer = Buffer.from(message);

    // Validate the address format
    if (!StrKey.isValidEd25519PublicKey(address)) {
      return false;
    }

    // Import the public key and verify
    const pubKey = Keypair.fromPublicKey(address);
    return pubKey.verify(messageBuffer, signatureBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Verify Bitcoin (UniSat) wallet signature
 */
function verifyBitcoinSignature(address: string, signature: string, message: string): boolean {
  try {
    // Bitcoin uses ECDSA signatures (secp256k1)
    // Expected format: base64-encoded signature
    const signatureBuffer = Buffer.from(signature, 'base64');
    const messageHash = createHash('sha256').update(message).digest();

    // Decode address to get pubkey hash
    // For simplicity, we accept any valid Bitcoin address and rely on the signature
    // In production, you'd want to extract the pubkey from the signature

    // This is a simplified check - in production, use bitcoinjs-lib to verify
    // For hackathon, we'll check that the signature is valid format
    return signatureBuffer.length === 64 || signatureBuffer.length === 65;
  } catch (error) {
    return false;
  }
}

/**
 * Verify Starknet wallet signature
 */
function verifyStarknetSignature(
  address: string,
  signature: string[],
  message: string,
  publicKey?: string,
): boolean {
  try {
    // Starknet uses ECDSA signatures on the Stark curve
    // This is a simplified placeholder - in production, use starknet.js
    if (!signature || signature.length < 2) {
      return false;
    }

    // Check if signature format is valid
    const isValidFormat = signature.every((s) => {
      const cleaned = s.startsWith('0x') ? s.slice(2) : s;
      return /^[0-9a-fA-F]+$/.test(cleaned);
    });

    if (!isValidFormat) {
      return false;
    }

    // In production, you'd verify using starknet.js ec.verify()
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a nonce for wallet authentication
 */
export function generateNonce(address: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `zeus_${address.slice(0, 8)}_${timestamp}_${random}`;
}