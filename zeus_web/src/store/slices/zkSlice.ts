import { StateCreator } from 'zustand';
import { ZKProof } from '../types';
import { zkProofService } from '../../services/zk/proof.service';

export interface ZKState {
  proofs: ZKProof[];
  currentProof: ZKProof | null;
  isGenerating: boolean;
  isVerifying: boolean;
  error: string | null;
}

export interface ZKActions {
  generateProof: (data: any) => Promise<ZKProof>;
  verifyProof: (proof: ZKProof) => Promise<boolean>;
  verifyStellarProof: (journalBytes: string, seal: string, imageId: string) => Promise<{ valid: boolean; journal: any }>;
  getProofHistory: () => ZKProof[];
  clearError: () => void;
  clearProofs: () => void;
}

export type ZKSlice = ZKState & ZKActions;

export const createZKSlice: StateCreator<ZKSlice> = (set, get) => ({
  // State
  proofs: [],
  currentProof: null,
  isGenerating: false,
  isVerifying: false,
  error: null,

  // Actions
  generateProof: async (data: any) => {
    set({ isGenerating: true, error: null });
    try {
      const proofData = await zkProofService.generateProof(data);
      
      const newProof: ZKProof = {
        id: `proof_${Date.now()}`,
        proof: proofData.proof,
        publicSignals: proofData.publicSignals,
        status: 'generated',
        createdAt: new Date(),
      };

      set((state) => ({
        proofs: [...state.proofs, newProof],
        currentProof: newProof,
        isGenerating: false,
      }));

      return newProof;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to generate proof',
        isGenerating: false,
      });
      throw error;
    }
  },

  verifyProof: async (proof: ZKProof) => {
    set({ isVerifying: true, error: null });
    try {
      const result = await zkProofService.verifyProof(proof.proof);
      
      set((state) => ({
        proofs: state.proofs.map(p =>
          p.id === proof.id
            ? { ...p, status: result.valid ? 'verified' : 'failed', verifiedAt: new Date() }
            : p
        ),
        currentProof: state.currentProof?.id === proof.id
          ? { ...proof, status: result.valid ? 'verified' : 'failed', verifiedAt: new Date() }
          : state.currentProof,
        isVerifying: false,
      }));

      return result.valid;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to verify proof',
        isVerifying: false,
      });
      throw error;
    }
  },

  verifyStellarProof: async (journalBytes: string, seal: string, imageId: string) => {
    set({ isVerifying: true, error: null });
    try {
      const result = await zkProofService.verifyStellarProof(journalBytes, seal, imageId);
      set({ isVerifying: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to verify Stellar proof',
        isVerifying: false,
      });
      throw error;
    }
  },

  getProofHistory: () => {
    return get().proofs;
  },

  clearError: () => set({ error: null }),
  
  clearProofs: () => set({ proofs: [], currentProof: null }),
});