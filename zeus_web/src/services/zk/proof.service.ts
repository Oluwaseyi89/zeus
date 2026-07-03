import { apiClient } from '../../services/api/client';

export interface GenerateProofParams {
  proofType: 'privacy' | 'compliance' | 'swap' | 'identity';
  data: any;
  circuitId?: string;
}

export interface GenerateProofResponse {
  proof: any;
  publicSignals: any;
  journalBytes?: string;
  seal?: string;
  imageId?: string;
  proofId?: string;
}

export interface VerifyProofParams {
  proof: any;
  publicSignals?: any;
  journalBytes?: string;
  seal?: string;
  imageId?: string;
}

export interface VerifyProofResponse {
  valid: boolean;
  journal?: any;
  verifiedAt?: Date;
}

export interface VerifyStellarProofParams {
  journalBytes: string;
  seal: string;
  imageId: string;
}

export interface VerifyStellarProofResponse {
  valid: boolean;
  journal: any;
}

export const zkProofService = {
  /**
   * Generate a ZK proof off-chain
   * Calls: POST /zk/generate
   */
  generateProof: async (params: GenerateProofParams): Promise<GenerateProofResponse> => {
    try {
      const response = await apiClient.post('/zk/generate', {
        proofType: params.proofType,
        data: params.data,
        circuitId: params.circuitId,
      });

      return {
        proof: response.proof || response.data?.proof,
        publicSignals: response.publicSignals || response.data?.publicSignals,
        journalBytes: response.journalBytes || response.data?.journalBytes,
        seal: response.seal || response.data?.seal,
        imageId: response.imageId || response.data?.imageId,
        proofId: response.proofId || response.data?.proofId,
      };
    } catch (error: any) {
      console.error('ZK proof generation error:', error);
      throw new Error(error.message || 'Failed to generate ZK proof');
    }
  },

  /**
   * Verify a ZK proof
   * Calls: POST /zk/verify
   */
  verifyProof: async (params: VerifyProofParams): Promise<VerifyProofResponse> => {
    try {
      const response = await apiClient.post('/zk/verify', {
        proof: params.proof,
        publicSignals: params.publicSignals,
        journalBytes: params.journalBytes,
        seal: params.seal,
        imageId: params.imageId,
      });

      return {
        valid: response.valid || response.data?.valid || false,
        journal: response.journal || response.data?.journal,
        verifiedAt: new Date(),
      };
    } catch (error: any) {
      console.error('ZK proof verification error:', error);
      throw new Error(error.message || 'Failed to verify ZK proof');
    }
  },

  /**
   * Verify a Stellar ZK proof (RISC Zero)
   * Calls: POST /stellar/verify/proof
   */
  verifyStellarProof: async (
    journalBytes: string,
    seal: string,
    imageId: string
  ): Promise<VerifyStellarProofResponse> => {
    try {
      const response = await apiClient.post('/stellar/verify/proof', {
        journalBytes,
        seal,
        imageId,
      });

      return {
        valid: response.success || response.data?.success || false,
        journal: response.journal || response.data?.journal || {},
      };
    } catch (error: any) {
      console.error('Stellar ZK proof verification error:', error);
      throw new Error(error.message || 'Failed to verify Stellar ZK proof');
    }
  },

  /**
   * Generate a privacy pool proof
   * Uses: /zk/generate with proofType: 'privacy'
   */
  generatePrivacyProof: async (data: {
    amount: number;
    token: string;
    commitment: string;
    nullifier?: string;
  }): Promise<GenerateProofResponse> => {
    return zkProofService.generateProof({
      proofType: 'privacy',
      data,
    });
  },

  /**
   * Generate a compliance proof (identity verification)
   * Uses: /zk/generate with proofType: 'compliance'
   */
  generateComplianceProof: async (data: {
    userId: string;
    identityData: any;
    verifierAddress?: string;
  }): Promise<GenerateProofResponse> => {
    return zkProofService.generateProof({
      proofType: 'compliance',
      data,
    });
  },

  /**
   * Generate a swap proof
   * Uses: /zk/generate with proofType: 'swap'
   */
  generateSwapProof: async (data: {
    swapId: string;
    secret: string;
    amount: number;
    asset: string;
  }): Promise<GenerateProofResponse> => {
    return zkProofService.generateProof({
      proofType: 'swap',
      data,
    });
  },

  /**
   * Generate an identity proof
   * Uses: /zk/generate with proofType: 'identity'
   */
  generateIdentityProof: async (data: {
    identityData: any;
    proofType: string;
  }): Promise<GenerateProofResponse> => {
    return zkProofService.generateProof({
      proofType: 'identity',
      data,
    });
  },

  /**
   * Verify a proof for Stellar swap completion
   * Calls: POST /swap/stellar/verify-proof
   */
  verifySwapProof: async (params: {
    journalBytes: string;
    seal: string;
    imageId: string;
  }): Promise<{ valid: boolean; journal: any }> => {
    try {
      const response = await apiClient.post('/swap/stellar/verify-proof', {
        journalBytes: params.journalBytes,
        seal: params.seal,
        imageId: params.imageId,
      });

      return {
        valid: response.valid || response.data?.valid || false,
        journal: response.journal || response.data?.journal || {},
      };
    } catch (error: any) {
      console.error('Swap proof verification error:', error);
      throw new Error(error.message || 'Failed to verify swap proof');
    }
  },

  /**
   * Complete a Stellar swap with ZK proof
   * Calls: POST /swap/:id/stellar-complete
   */
  completeStellarSwap: async (params: {
    swapId: string;
    escrowAddress: string;
    journalBytes: string;
    seal: string;
    imageId: string;
  }): Promise<{ success: boolean; journal: any }> => {
    try {
      const response = await apiClient.post(`/swap/${params.swapId}/stellar-complete`, {
        escrowAddress: params.escrowAddress,
        journalBytes: params.journalBytes,
        seal: params.seal,
        imageId: params.imageId,
      });

      return {
        success: response.success || response.data?.success || false,
        journal: response.journal || response.data?.journal || {},
      };
    } catch (error: any) {
      console.error('Stellar swap completion error:', error);
      throw new Error(error.message || 'Failed to complete Stellar swap with proof');
    }
  },

  /**
   * Check proof status
   */
  getProofStatus: async (proofId: string): Promise<{
    id: string;
    status: 'pending' | 'generated' | 'verified' | 'failed';
    createdAt: Date;
    verifiedAt?: Date;
  }> => {
    try {
      const response = await apiClient.get(`/zk/proof/${proofId}`);
      return {
        id: response.id || response.data?.id,
        status: response.status || response.data?.status || 'pending',
        createdAt: new Date(response.createdAt || response.data?.createdAt),
        verifiedAt: response.verifiedAt || response.data?.verifiedAt ? new Date(response.data.verifiedAt) : undefined,
      };
    } catch (error: any) {
      console.error('Get proof status error:', error);
      throw new Error(error.message || 'Failed to get proof status');
    }
  },

  /**
   * Get proof history for current user
   */
  getProofHistory: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/zk/proofs/user');
      return response.data || response || [];
    } catch (error: any) {
      console.error('Get proof history error:', error);
      throw new Error(error.message || 'Failed to get proof history');
    }
  },

  /**
   * Generate a RISC Zero proof (for Stellar)
   */
  generateRiscZeroProof: async (program: string, input: any): Promise<{
    journal: string;
    seal: string;
    imageId: string;
  }> => {
    try {
      const response = await apiClient.post('/zk/risc-zero/generate', {
        program,
        input,
      });

      return {
        journal: response.journal || response.data?.journal,
        seal: response.seal || response.data?.seal,
        imageId: response.imageId || response.data?.imageId,
      };
    } catch (error: any) {
      console.error('RISC Zero proof generation error:', error);
      throw new Error(error.message || 'Failed to generate RISC Zero proof');
    }
  },

  /**
   * Generate a Noir proof
   */
  generateNoirProof: async (circuit: string, input: any): Promise<{
    proof: any;
    publicSignals: any;
  }> => {
    try {
      const response = await apiClient.post('/zk/noir/generate', {
        circuit,
        input,
      });

      return {
        proof: response.proof || response.data?.proof,
        publicSignals: response.publicSignals || response.data?.publicSignals,
      };
    } catch (error: any) {
      console.error('Noir proof generation error:', error);
      throw new Error(error.message || 'Failed to generate Noir proof');
    }
  },

  /**
   * Generate a Circom proof
   */
  generateCircomProof: async (circuit: string, input: any): Promise<{
    proof: any;
    publicSignals: any;
  }> => {
    try {
      const response = await apiClient.post('/zk/circom/generate', {
        circuit,
        input,
      });

      return {
        proof: response.proof || response.data?.proof,
        publicSignals: response.publicSignals || response.data?.publicSignals,
      };
    } catch (error: any) {
      console.error('Circom proof generation error:', error);
      throw new Error(error.message || 'Failed to generate Circom proof');
    }
  },

  /**
   * Verify a Groth16 proof (Circom)
   */
  verifyGroth16Proof: async (params: {
    proof: any;
    publicSignals: any;
    verifierAddress?: string;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.post('/zk/groth16/verify', {
        proof: params.proof,
        publicSignals: params.publicSignals,
        verifierAddress: params.verifierAddress,
      });

      return response.valid || response.data?.valid || false;
    } catch (error: any) {
      console.error('Groth16 proof verification error:', error);
      throw new Error(error.message || 'Failed to verify Groth16 proof');
    }
  },

  /**
   * Verify an UltraHonk proof (Noir)
   */
  verifyUltraHonkProof: async (params: {
    proof: any;
    publicSignals: any;
    verifierAddress?: string;
  }): Promise<boolean> => {
    try {
      const response = await apiClient.post('/zk/ultrahonk/verify', {
        proof: params.proof,
        publicSignals: params.publicSignals,
        verifierAddress: params.verifierAddress,
      });

      return response.valid || response.data?.valid || false;
    } catch (error: any) {
      console.error('UltraHonk proof verification error:', error);
      throw new Error(error.message || 'Failed to verify UltraHonk proof');
    }
  },
};

// Export individual methods for convenience
export const {
  generateProof,
  verifyProof,
  verifyStellarProof,
  generatePrivacyProof,
  generateComplianceProof,
  generateSwapProof,
  generateIdentityProof,
  verifySwapProof,
  completeStellarSwap,
  getProofStatus,
  getProofHistory,
  generateRiscZeroProof,
  generateNoirProof,
  generateCircomProof,
  verifyGroth16Proof,
  verifyUltraHonkProof,
} = zkProofService;