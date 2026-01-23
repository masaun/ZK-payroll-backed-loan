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
 * Allows any options to be passed through to the SDK
 */
export interface ProofGenerationUIOptions {
  [key: string]: any;
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
 * 
 * @param config - Reclaim configuration with APP_ID, APP_SECRET, and PROVIDER_ID
 * @param options - Optional configuration for the proof request
 * @returns JSON string representation of the proof request
 * 
 * @example
 * ```typescript
 * const config = {
 *   appId: process.env.RECLAIM_APP_ID!,
 *   appSecret: process.env.RECLAIM_APP_SECRET!,
 *   providerId: 'payroll-provider-id'
 * };
 * 
 * const proofRequest = await createProofRequest(config, {
 *   context: {
 *     address: userWalletAddress,
 *     message: 'Payroll verification request'
 *   },
 *   callbackUrl: 'https://yourapp.com/api/verify-proof',
 *   useJson: true
 * });
 * ```
 */
export async function createProofRequest(
  config: ReclaimConfig,
  options?: ProofRequestOptions
): Promise<string> {
  // Initialize the proof request with credentials
  const reclaimProofRequest = await ReclaimProofRequest.init(
    config.appId,
    config.appSecret,
    config.providerId
  );

  // Set context if provided (helps identify the request in callbacks)
  if (options?.context) {
    reclaimProofRequest.setContext(
      options.context.address,
      options.context.message || ''
    );
  }

  // Set expected parameters if provided
  if (options?.params) {
    reclaimProofRequest.setParams(options.params);
  }

  // Set callback URL if provided (for backend proof processing)
  if (options?.callbackUrl) {
    reclaimProofRequest.setAppCallbackUrl(
      options.callbackUrl,
      options.useJson ?? true
    );
  }

  // Set redirect URL if provided
  if (options?.redirectUrl) {
    reclaimProofRequest.setRedirectUrl(options.redirectUrl);
  }

  // Convert to JSON string for frontend consumption
  return reclaimProofRequest.toJsonString();
}

/**
 * Generates a proof on the frontend
 * This triggers the Reclaim flow (QR code, app clip, or browser extension)
 * 
 * @param proofRequestJson - JSON string from createProofRequest()
 * @param callbacks - Success and error callbacks
 * @param uiOptions - Optional UI customization
 * 
 * @example
 * ```typescript
 * // Fetch proof request from backend
 * const response = await fetch('/api/reclaim/create-proof-request');
 * const { proofRequest } = await response.json();
 * 
 * // Generate proof
 * await generateProof(proofRequest, {
 *   onSuccess: async (proofs) => {
 *     console.log('Proof generated:', proofs);
 *     // Upload proofs to backend for verification
 *     await fetch('/api/reclaim/verify-proof', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ proofs })
 *     });
 *   },
 *   onError: (error) => {
 *     console.error('Proof generation failed:', error);
 *   }
 * }, {
 *   theme: 'dark',
 *   modalTitle: 'Verify Your Payroll',
 *   autoCloseModal: true
 * });
 * ```
 */
export async function generateProof(
  proofRequestJson: string,
  callbacks: ProofGenerationCallbacks,
  uiOptions?: ProofGenerationUIOptions
): Promise<void> {
  // Reconstruct the ReclaimProofRequest from JSON
  const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
    proofRequestJson
  );

  // Trigger the appropriate verification flow based on user's platform
  // This will show QR code on desktop, use app clip on mobile, or browser extension if available
  await reclaimProofRequest.triggerReclaimFlow(uiOptions);

  // Start the proof generation session with callbacks
  await reclaimProofRequest.startSession({
    onSuccess: callbacks.onSuccess,
    onError: callbacks.onError,
  });
}

/**
 * Gets the verification request URL for custom UI implementations
 * 
 * @param proofRequestJson - JSON string from createProofRequest()
 * @returns URL that needs to be opened on the user's mobile device
 * 
 * @example
 * ```typescript
 * const requestUrl = await getVerificationUrl(proofRequest);
 * // Display QR code with this URL or open it in a new window
 * ```
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
 * 
 * @param proofRequestJson - JSON string from createProofRequest()
 * @returns true if browser extension is installed
 * 
 * @example
 * ```typescript
 * const hasExtension = await checkBrowserExtension(proofRequest);
 * if (hasExtension) {
 *   // Use browser extension for verification
 * } else {
 *   // Fall back to QR code or app flow
 * }
 * ```
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
 * 
 * @param proofRequestJson - JSON string from createProofRequest()
 * @returns Status URL for polling
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
 * 
 * @param proofs - Proof object received from onSuccess callback or POST endpoint
 * @returns Verified proof data including validity and extracted parameters
 * 
 * @example
 * ```typescript
 * // In your backend API endpoint
 * app.post('/api/verify-proof', async (req, res) => {
 *   const { proofs } = req.body;
 *   
 *   const result = await verifyProofData(proofs);
 *   
 *   if (result.isValid) {
 *     // Extract payroll data
 *     const { extractedParameters } = result;
 *     console.log('Payroll data:', extractedParameters);
 *     
 *     // Process loan application with verified data
 *     // ...
 *     
 *     res.json({ success: true, data: extractedParameters });
 *   } else {
 *     res.status(400).json({ success: false, error: 'Invalid proof' });
 *   }
 * });
 * ```
 */
export async function verifyProofData(
  proofs: any
): Promise<VerifiedProofData> {
  // Verify the proof cryptographically
  const isValid = await verifyProof(proofs);

  if (!isValid) {
    return { isValid: false };
  }

  // Extract context and parameters from the first proof
  // (Multiple proofs may be returned, but typically we use the first one)
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

/**
 * Example: Complete workflow for payroll-backed loan verification
 * 
 * @example Backend Setup (Node.js/Express)
 * ```typescript
 * import express from 'express';
 * import { createProofRequest, verifyProofData } from './zktls-operation';
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * // Endpoint to create proof request
 * app.get('/api/reclaim/create-proof-request', async (req, res) => {
 *   try {
 *     const config = {
 *       appId: process.env.RECLAIM_APP_ID!,
 *       appSecret: process.env.RECLAIM_APP_SECRET!,
 *       providerId: 'payroll-provider-id',
 *     };
 * 
 *     const proofRequest = await createProofRequest(config, {
 *       context: {
 *         address: req.user.walletAddress,
 *         message: JSON.stringify({ loanAmount: 50000 })
 *       },
 *       callbackUrl: 'https://yourapp.com/api/reclaim/callback',
 *       useJson: true
 *     });
 * 
 *     res.json({ success: true, proofRequest });
 *   } catch (error) {
 *     res.status(500).json({ success: false, error: error.message });
 *   }
 * });
 * 
 * // Endpoint to verify proof
 * app.post('/api/reclaim/verify-proof', async (req, res) => {
 *   try {
 *     const { proofs } = req.body;
 *     const result = await verifyProofData(proofs);
 * 
 *     if (result.isValid) {
 *       // Process the verified payroll data
 *       const payrollData = result.extractedParameters;
 *       // ... business logic for loan approval
 *       
 *       res.json({ success: true, data: payrollData });
 *     } else {
 *       res.status(400).json({ success: false, error: 'Invalid proof' });
 *     }
 *   } catch (error) {
 *     res.status(500).json({ success: false, error: error.message });
 *   }
 * });
 * ```
 * 
 * @example Frontend Usage (React/TypeScript)
 * ```typescript
 * import { generateProof } from './zktls-operation';
 * 
 * function PayrollVerification() {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 * 
 *   const handleVerifyPayroll = async () => {
 *     try {
 *       setLoading(true);
 *       setError(null);
 * 
 *       // Fetch proof request from backend
 *       const response = await fetch('/api/reclaim/create-proof-request');
 *       const { proofRequest } = await response.json();
 * 
 *       // Generate proof
 *       await generateProof(proofRequest, {
 *         onSuccess: async (proofs) => {
 *           console.log('Proof generated successfully');
 *           
 *           // Upload to backend for verification
 *           const verifyResponse = await fetch('/api/reclaim/verify-proof', {
 *             method: 'POST',
 *             headers: { 'Content-Type': 'application/json' },
 *             body: JSON.stringify({ proofs })
 *           });
 * 
 *           const result = await verifyResponse.json();
 *           if (result.success) {
 *             // Proceed with loan application
 *             console.log('Verified payroll data:', result.data);
 *           }
 *           
 *           setLoading(false);
 *         },
 *         onError: (err) => {
 *           setError(err.message);
 *           setLoading(false);
 *         }
 *       }, {
 *         theme: 'dark',
 *         modalTitle: 'Verify Your Payroll Data',
 *         modalSubtitle: 'Scan the QR code to verify your income',
 *         autoCloseModal: true,
 *         autoCloseDelay: 3000
 *       });
 *     } catch (err) {
 *       setError(err.message);
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleVerifyPayroll} disabled={loading}>
 *         {loading ? 'Verifying...' : 'Verify Payroll'}
 *       </button>
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
