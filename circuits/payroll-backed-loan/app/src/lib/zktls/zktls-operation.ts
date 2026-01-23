/**
 * Reclaim Protocol zkTLS Integration for Payroll-Backed Loan
 * 
 * This module provides functionality to:
 * 1. Create proof requests for payroll verification
 * 2. Generate proofs using zkTLS technology
 * 3. Verify proofs to ensure data authenticity
 * 
 * Usage:
 * - Backend: Use createProofRequest() to initialize and configure proof requests
 * - Frontend: Use generateProof() to trigger the proof generation flow
 * - Backend: Use verifyProof() to validate proofs submitted by users
 */

import { ReclaimProofRequest, verifyProof } from '@reclaimprotocol/js-sdk';

/**
 * Configuration interface for Reclaim Protocol
 */
export interface ReclaimConfig {
  appId: string;
  appSecret: string;
  providerId: string;
}

/**
 * Context data for proof requests
 */
export interface ProofContext {
  address: string;      // User identifier (wallet address, email, etc.)
  message?: string;     // Additional context data
}

/**
 * Options for proof request creation
 */
export interface ProofRequestOptions {
  context?: ProofContext;
  params?: Record<string, any>;
  callbackUrl?: string;
  useJson?: boolean;
  redirectUrl?: string;
}

/**
 * Options for proof generation UI
 * Matches ReclaimFlowLaunchOptions from @reclaimprotocol/js-sdk
 */
export interface ProofGenerationUIOptions {
  [key: string]: any;  // Allow any options to be passed through to the SDK
}

/**
 * Proof generation callbacks
 */
export interface ProofGenerationCallbacks {
  onSuccess: (proofs: any) => void | Promise<void>;
  onError: (error: Error) => void;
}

/**
 * Extracted parameters from proof
 */
export interface ExtractedParameters {
  [key: string]: any;
}

/**
 * Verified proof data
 */
export interface VerifiedProofData {
  isValid: boolean;
  contextAddress?: string;
  contextMessage?: string;
  extractedParameters?: ExtractedParameters;
  rawProof?: any;
}

/**
 * Creates a proof request on the backend
 * This should be called server-side to protect APP_SECRET
 */
export async function createProofRequest(
  config: ReclaimConfig,
  options?: ProofRequestOptions
): Promise<string> {
  const reclaimProofRequest = await ReclaimProofRequest.init(
    config.appId,
    config.appSecret,
    config.providerId
  );

  if (options?.context) {
    reclaimProofRequest.setContext(
      options.context.address,
      options.context.message || ''
    );
  }

  if (options?.params) {
    reclaimProofRequest.setParams(options.params);
  }

  if (options?.callbackUrl) {
    reclaimProofRequest.setAppCallbackUrl(
      options.callbackUrl,
      options.useJson ?? true
    );
  }

  if (options?.redirectUrl) {
    reclaimProofRequest.setRedirectUrl(options.redirectUrl);
  }

  return reclaimProofRequest.toJsonString();
}

/**
 * Generates a proof on the frontend
 * This triggers the Reclaim flow (QR code, app clip, or browser extension)
 */
export async function generateProof(
  proofRequestJson: string,
  callbacks: ProofGenerationCallbacks,
  uiOptions?: ProofGenerationUIOptions
): Promise<void> {
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
    proofRequestJson
  );

  await reclaimProofRequest.triggerReclaimFlow(uiOptions);

  await reclaimProofRequest.startSession({
    onSuccess: callbacks.onSuccess,
    onError: callbacks.onError,
  });
}

/**
 * Gets the verification request URL for custom UI implementations
 */
export async function getVerificationUrl(
  proofRequestJson: string
): Promise<string> {
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
    proofRequestJson
  );
  return await reclaimProofRequest.getRequestUrl();
}

/**
 * Checks if browser extension is available for seamless verification
 */
export async function checkBrowserExtension(
  proofRequestJson: string
): Promise<boolean> {
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
    proofRequestJson
  );
  return await reclaimProofRequest.isBrowserExtensionAvailable();
}

/**
 * Gets the status URL for polling proof generation progress
 */
export async function getStatusUrl(
  proofRequestJson: string
): Promise<string> {
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
    proofRequestJson
  );
  return reclaimProofRequest.getStatusUrl();
}

/**
 * Verifies a proof on the backend
 * CRITICAL: Always verify proofs server-side as frontend validation can be bypassed
 */
export async function verifyProofData(
  proofs: any
): Promise<VerifiedProofData> {
  const isValid = await verifyProof(proofs);

  if (!isValid) {
    return { isValid: false };
  }

  const proof = Array.isArray(proofs) ? proofs[0] : proofs;
  
  let contextAddress: string | undefined;
  let contextMessage: string | undefined;
  let extractedParameters: ExtractedParameters | undefined;

  if (proof?.claimData?.context) {
    try {
      const context = JSON.parse(proof.claimData.context);
      contextAddress = context.contextAddress;
      contextMessage = context.contextMessage;
      extractedParameters = context.extractedParameters;
    } catch (error) {
      console.error('Failed to parse proof context:', error);
    }
  }

  return {
    isValid: true,
    contextAddress,
    contextMessage,
    extractedParameters,
    rawProof: proof,
  };
}
