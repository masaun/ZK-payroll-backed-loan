'use client';

import { useState, useCallback } from 'react';
import { requestZkTlsProof } from '@/lib/zktls/reclaim/zktls-reclaim-prover';
import type { VerifiedProofData } from '@/lib/zktls/reclaim/reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration';

interface UseZkTlsProofReturn {
  isGenerating: boolean;
  error: string | null;
  proofData: VerifiedProofData | null;
  statusMessage: string;
  requestProof: (userAddress?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for zkTLS proof generation using Reclaim Protocol
 * 
 * This hook integrates with the zktls-reclaim-prover module to:
 * - Create proof requests with user context
 * - Display QR code modal for mobile verification
 * - Handle proof generation and verification
 * - Manage loading and error states
 * 
 * The QR code is displayed automatically by the Reclaim SDK when the user
 * clicks the button. Users can scan it with their mobile device to complete
 * the zkTLS proof generation.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isGenerating, error, proofData, statusMessage, requestProof } = useZkTlsProof();
 * 
 *   const handleVerify = async () => {
 *     await requestProof(userWalletAddress);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleVerify} disabled={isGenerating}>
 *         {isGenerating ? 'Generating Proof...' : 'Verify Payroll'}
 *       </button>
 *       {statusMessage && <p>{statusMessage}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useZkTlsProof(): UseZkTlsProofReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<VerifiedProofData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestProof = useCallback(async (userAddress?: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProofData(null);
      setStatusMessage('Initializing zkTLS proof generation...');

      console.log('🔄 Requesting zkTLS proof generation with QR code display...');

      // Use the prover module which handles:
      // 1. Creating the proof request
      // 2. Displaying the QR code modal
      // 3. Waiting for user to scan and verify
      // 4. Verifying the proof
      const result = await requestZkTlsProof(
        userAddress,
        (status) => {
          console.log('📊 Status:', status);
          setStatusMessage(status);
        }
      );

      if (result.success && result.proofData) {
        console.log('✅ Proof generated and verified successfully!');
        console.log('📊 Proof Data:', result.proofData);
        setProofData(result.proofData);
        setStatusMessage('Proof verified successfully!');
      } else {
        console.error('❌ Proof generation failed:', result.error);
        setError(result.error || 'Proof generation failed');
        setStatusMessage('');
      }
    } catch (err) {
      console.error('❌ Error requesting proof:', err);
      setError(err instanceof Error ? err.message : 'Failed to request proof');
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    proofData,
    statusMessage,
    requestProof,
    clearError,
  };
}
