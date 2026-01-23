'use client';

import { useState, useCallback } from 'react';
import { createProofRequest, generateProof } from '@/lib/zktls/reclaim/reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration';

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
 * CLIENT-SIDE proof generation:
 * - Creates proof request directly on client
 * - Generates proof using Reclaim SDK
 * - Verifies proof on backend (server-side for security)
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

      console.log('🔄 Creating proof request on client-side...');

      // Get credentials from environment (public)
      const appId = process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET;
      const providerId = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID || 'payroll-provider';

      if (!appId || !appSecret) {
        throw new Error('Reclaim credentials not configured. Please set NEXT_PUBLIC_RECLAIM_APP_ID and NEXT_PUBLIC_RECLAIM_APP_SECRET in environment variables.');
      }

      // Step 1: Create proof request CLIENT-SIDE
      const proofRequest = await createProofRequest(
        {
          appId,
          appSecret,
          providerId,
        },
        {
          context: userAddress ? {
            address: userAddress,
            message: 'Payroll verification for loan application',
          } : undefined,
        }
      );

      console.log('✅ Proof request created, initiating zkTLS flow...');

      // Step 2: Generate proof using Reclaim SDK
      await generateProof(
        proofRequest,
        {
          onSuccess: async (proofs) => {
            console.log('✅ Proof generated successfully:', proofs);
            
            // @dev - [TODO]: Step 3 (Verifying a proof) will be done via the on-chain verification. (rather than backend/server-side verification)

            // // Step 3: Verify proof on backend (ALWAYS server-side for security)
            // console.log('🔄 Verifying proof on backend...');
            
            // try {
            //   const verifyResponse = await fetch('/api/reclaim/verify-proof', {
            //     method: 'POST',
            //     headers: {
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ proofs }),
            //   });

            //   if (!verifyResponse.ok) {
            //     const errorData = await verifyResponse.json();
            //     throw new Error(errorData.error || 'Proof verification failed');
            //   }

            //   const verificationResult = await verifyResponse.json();

            //   if (verificationResult.isValid) {
            //     console.log('✅ Proof verified successfully!');
            //     console.log('📊 Extracted Data:', verificationResult.data);
            //     setProofData(verificationResult.data);
            //   } else {
            //     throw new Error('Proof verification failed - invalid proof');
            //   }
            // } catch (verifyError) {
            //   console.error('❌ Verification error:', verifyError);
            //   setError(verifyError instanceof Error ? verifyError.message : 'Verification failed');
            // } finally {
            //   setIsGenerating(false);
            // }
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
