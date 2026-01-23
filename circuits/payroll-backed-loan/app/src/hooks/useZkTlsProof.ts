'use client';

import { useState, useCallback } from 'react';
import { generateProof } from '@/lib/zktls/zktls-operation';

interface UseZkTlsProofReturn {
  isGenerating: boolean;
  error: string | null;
  proofData: any;
  requestProof: (userAddress?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for zkTLS proof generation using Reclaim Protocol
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isGenerating, error, proofData, requestProof } = useZkTlsProof();
 * 
 *   const handleVerify = async () => {
 *     await requestProof(userWalletAddress);
 *   };
 * 
 *   return (
 *     <button onClick={handleVerify} disabled={isGenerating}>
 *       {isGenerating ? 'Generating Proof...' : 'Verify Payroll'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useZkTlsProof(): UseZkTlsProofReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<any>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestProof = useCallback(async (userAddress?: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProofData(null);

      console.log('🔄 Requesting proof from backend...');

      // Step 1: Fetch proof request configuration from backend
      const response = await fetch('/api/reclaim/create-proof-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress || 'anonymous',
          message: 'Payroll verification for loan application',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proof request');
      }

      const { proofRequest } = await response.json();

      if (!proofRequest) {
        throw new Error('No proof request returned from server');
      }

      console.log('✅ Proof request created, initiating zkTLS flow...');

      // Step 2: Generate proof using Reclaim SDK
      await generateProof(
        proofRequest,
        {
          onSuccess: async (proofs) => {
            console.log('✅ Proof generated successfully:', proofs);
            
            // Step 3: Verify proof on backend
            console.log('🔄 Verifying proof on backend...');
            
            try {
              const verifyResponse = await fetch('/api/reclaim/verify-proof', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ proofs }),
              });

              if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                throw new Error(errorData.error || 'Proof verification failed');
              }

              const verificationResult = await verifyResponse.json();

              if (verificationResult.isValid) {
                console.log('✅ Proof verified successfully!');
                console.log('📊 Extracted Data:', verificationResult.data);
                setProofData(verificationResult.data);
              } else {
                throw new Error('Proof verification failed - invalid proof');
              }
            } catch (verifyError) {
              console.error('❌ Verification error:', verifyError);
              setError(verifyError instanceof Error ? verifyError.message : 'Verification failed');
            } finally {
              setIsGenerating(false);
            }
          },
          onError: (err) => {
            console.error('❌ Proof generation error:', err);
            setError(err.message || 'Proof generation failed');
            setIsGenerating(false);
          },
        },
        {
          theme: 'dark',
          modalTitle: 'Verify Your Payroll Data',
          modalSubtitle: 'Scan the QR code with your mobile device to securely verify your income',
          autoCloseModal: true,
          autoCloseDelay: 3000,
          showExtensionPrompt: true,
        }
      );
    } catch (err) {
      console.error('❌ Error requesting proof:', err);
      setError(err instanceof Error ? err.message : 'Failed to request proof');
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    proofData,
    requestProof,
    clearError,
  };
}
