/**
 * zkTLS Reclaim Prover
 * 
 * This module provides high-level functions for zkTLS proof generation
 * using Reclaim Protocol in browser/Next.js environment.
 * 
 * Features:
 * - Creates proof requests with user context
 * - Triggers QR code display for mobile verification
 * - Handles proof generation callbacks
 * - Integrates with useZkTlsProof hook
 */

import {
  createProofRequest,
  generateProof,
  verifyProofData,
  type ReclaimConfig,
  type ProofRequestOptions,
  type ProofGenerationCallbacks,
  type ProofGenerationUIOptions,
  type VerifiedProofData,
} from './reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration';

/**
 * Configuration for zkTLS proof generation
 */
export interface ZkTlsProverConfig {
  appId: string;
  appSecret: string;
  providerId: string;
}

/**
 * User context for proof generation
 */
export interface UserContext {
  address?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Proof generation result
 */
export interface ProofGenerationResult {
  success: boolean;
  proofData?: VerifiedProofData;
  error?: string;
}

/**
 * Initiates zkTLS proof generation with QR code display
 * 
 * This function:
 * 1. Creates a proof request with user context
 * 2. Displays QR code modal via Reclaim SDK
 * 3. Waits for user to scan and complete verification
 * 4. Returns the verified proof data
 * 
 * @param config - Reclaim Protocol credentials
 * @param userContext - User information (wallet address, etc.)
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with proof generation result
 * 
 * @example
 * ```typescript
 * const result = await initiateZkTlsProofGeneration(
 *   {
 *     appId: process.env.NEXT_PUBLIC_RECLAIM_APP_ID!,
 *     appSecret: process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET!,
 *     providerId: process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID!,
 *   },
 *   {
 *     address: userWalletAddress,
 *     message: 'Payroll verification for loan application',
 *   },
 *   (status) => console.log('Status:', status)
 * );
 * 
 * if (result.success) {
 *   console.log('Proof data:', result.proofData);
 * }
 * ```
 */
export async function initiateZkTlsProofGeneration(
  config: ZkTlsProverConfig,
  userContext: UserContext = {},
  onProgress?: (status: string) => void
): Promise<ProofGenerationResult> {
  return new Promise(async (resolve) => {
    try {
      onProgress?.('Creating proof request...');

      // Step 1: Create proof request
      const proofRequestOptions: ProofRequestOptions = {
        context: userContext.address ? {
          address: userContext.address,
          message: userContext.message || 'Payroll verification request',
        } : undefined,
        params: userContext.metadata,
      };

      const proofRequestJson = await createProofRequest(
        {
          appId: config.appId,
          appSecret: config.appSecret,
          providerId: config.providerId,
        },
        proofRequestOptions
      );

      onProgress?.('Proof request created. Displaying QR code...');

      // Step 2: Generate proof with QR code display
      const uiOptions: ProofGenerationUIOptions = {
        theme: 'dark',
        modalTitle: 'Verify Your Payroll Data',
        modalSubtitle: 'Scan the QR code with your mobile device to securely verify your income',
        autoCloseModal: true,
        autoCloseDelay: 3000,
        showExtensionPrompt: true,
      };

      const callbacks: ProofGenerationCallbacks = {
        onSuccess: async (proofs) => {
          onProgress?.('Proof generated successfully. Verifying...');
          
          try {
            // Verify the proof
            const verificationResult = await verifyProofData(proofs);
            
            if (verificationResult.isValid) {
              onProgress?.('Proof verified successfully!');
              resolve({
                success: true,
                proofData: verificationResult,
              });
            } else {
              onProgress?.('Proof verification failed');
              resolve({
                success: false,
                error: 'Proof verification failed - invalid proof',
              });
            }
          } catch (verifyError) {
            const errorMessage = verifyError instanceof Error 
              ? verifyError.message 
              : 'Proof verification failed';
            onProgress?.(`Verification error: ${errorMessage}`);
            resolve({
              success: false,
              error: errorMessage,
            });
          }
        },
        onError: (error) => {
          const errorMessage = error.message || 'Proof generation failed';
          onProgress?.(`Error: ${errorMessage}`);
          resolve({
            success: false,
            error: errorMessage,
          });
        },
      };

      // This will display the QR code modal and handle the proof generation
      await generateProof(proofRequestJson, callbacks, uiOptions);
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to initiate proof generation';
      onProgress?.(`Error: ${errorMessage}`);
      resolve({
        success: false,
        error: errorMessage,
      });
    }
  });
}

/**
 * Gets the Reclaim configuration from environment variables
 * 
 * @returns Reclaim configuration or null if not properly configured
 */
export function getReclaimConfigFromEnv(): ZkTlsProverConfig | null {
  const appId = process.env.NEXT_PUBLIC_RECLAIM_APP_ID;
  const appSecret = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET;
  const providerId = process.env.NEXT_PUBLIC_RECLAIM_PROVIDER_ID;

  if (!appId || !appSecret || !providerId) {
    console.error('Missing Reclaim Protocol environment variables');
    console.error('Required: NEXT_PUBLIC_RECLAIM_APP_ID, NEXT_PUBLIC_RECLAIM_APP_SECRET, NEXT_PUBLIC_RECLAIM_PROVIDER_ID');
    return null;
  }

  return {
    appId,
    appSecret,
    providerId,
  };
}

/**
 * Helper function to request zkTLS proof with environment config
 * Simplified version that uses environment variables automatically
 * 
 * @param userAddress - User's wallet address or identifier
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with proof generation result
 * 
 * @example
 * ```typescript
 * const result = await requestZkTlsProof(
 *   walletAddress,
 *   (status) => setStatusMessage(status)
 * );
 * ```
 */
export async function requestZkTlsProof(
  userAddress?: string,
  onProgress?: (status: string) => void
): Promise<ProofGenerationResult> {
  const config = getReclaimConfigFromEnv();
  
  if (!config) {
    return {
      success: false,
      error: 'Reclaim Protocol is not properly configured. Please check environment variables.',
    };
  }

  return initiateZkTlsProofGeneration(
    config,
    {
      address: userAddress,
      message: 'Payroll verification for loan application',
    },
    onProgress
  );
}
