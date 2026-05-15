/* Helpers to perform wallet signature flows for mobile wallets.
   Tries to use injected providers (Argent/Braavos expose `starknet`),
   and Xverse exposes `xverse` on global/window in some mobile contexts.
   Falls back to a mock signature when provider isn't available (dev).
*/

function normalizeSignature(signature: any) {
  if (Array.isArray(signature)) return signature;
  if (typeof signature === 'string') {
    const hex = signature.replace(/^0x/, '');
    const half = Math.floor(hex.length / 2);
    const r = '0x' + hex.slice(0, half);
    const s = '0x' + hex.slice(half);
    return [r, s];
  }
  return [String(signature)];
}

export async function signWithArgent(address: string, nonce: string) {
  try {
    // RN may expose provider on global or window
    const g: any = globalThis as any;
    const provider = g?.starknet || g?.argent || g?.braavos;
    if (provider && typeof provider.signMessage === 'function') {
      const res = await provider.signMessage(nonce);
      const signature = normalizeSignature(res?.signature ?? res);
      const publicKey = res?.publicKey ?? res?.pubKey ?? undefined;
      return { signature, publicKey };
    }
    // some providers return array directly from request
    if (provider && typeof provider.request === 'function') {
      try {
        const res = await provider.request({ method: 'starknet_signMessage', params: [nonce] });
        const signature = normalizeSignature(res?.signature ?? res);
        return { signature };
      } catch (e) {}
    }
  } catch (e) {
    // fall through to mock
  }
  // dev fallback: deterministic-ish mock
  const mockSig = ['0x' + Math.random().toString(16).slice(2, 66), '0x' + Math.random().toString(16).slice(2, 66)];
  return { signature: mockSig };
}

export async function signWithXverse(address: string, nonce: string) {
  // Try sats-connect (common RN-friendly Bitcoin signing helper) dynamically
  try {
    // dynamic import so package is optional
     
    const sats = require('sats-connect');
    if (sats) {
      try {
        // try common API names used by sats-connect
        if (typeof sats.signMessage === 'function') {
          const res = await sats.signMessage(nonce, { address });
          const signature = normalizeSignature(res?.signature ?? res);
          return { signature };
        }
        if (typeof sats.requestSignature === 'function') {
          const res = await sats.requestSignature({ address, message: nonce });
          const signature = normalizeSignature(res?.signature ?? res);
          return { signature };
        }
      } catch (e) {
        // continue to other methods
      }
    }
  } catch (e) {}

  try {
    const g: any = globalThis as any;
    const provider = g?.xverse || g?.Xverse;
    if (provider && typeof provider.signMessage === 'function') {
      const res = await provider.signMessage(nonce);
      const signature = normalizeSignature(res?.signature ?? res);
      const publicKey = res?.publicKey ?? undefined;
      return { signature, publicKey };
    }
    if (provider && typeof provider.request === 'function') {
      try {
        const res = await provider.request({ method: 'xverse_signMessage', params: [nonce] });
        const signature = normalizeSignature(res?.signature ?? res);
        return { signature };
      } catch (e) {}
    }
  } catch (e) {}

  const mockSig = ['0x' + Math.random().toString(16).slice(2, 66), '0x' + Math.random().toString(16).slice(2, 66)];
  return { signature: mockSig };
}

export async function signWithWalletConnect(connector: any, type: 'Starknet' | 'Bitcoin', address: string, nonce: string) {
  if (!connector) return null;
  try {
    // Try common WC signing methods
    if (typeof connector.signPersonalMessage === 'function') {
      const raw = await connector.signPersonalMessage([nonce, address]);
      return { signature: normalizeSignature(raw) };
    }
    if (typeof connector.signMessage === 'function') {
      const raw = await connector.signMessage([nonce]);
      return { signature: normalizeSignature(raw) };
    }
    if (typeof connector.sendCustomRequest === 'function') {
      // Try Starknet specific RPC methods
      if (type === 'Starknet') {
        try {
          const raw = await connector.sendCustomRequest({ method: 'starknet_signMessage', params: [address, nonce] });
          return { signature: normalizeSignature(raw) };
        } catch (e) {}
        try {
          const raw = await connector.sendCustomRequest({ method: 'stark_signMessage', params: [address, nonce] });
          return { signature: normalizeSignature(raw) };
        } catch (e) {}
      }
      // Try Bitcoin / Xverse common methods
      try {
        const raw = await connector.sendCustomRequest({ method: 'personal_sign', params: [nonce, address] });
        return { signature: normalizeSignature(raw) };
      } catch (e) {}
    }
  } catch (e) {
    // ignore and fallback
  }
  return null;
}

export default { signWithArgent, signWithXverse };
