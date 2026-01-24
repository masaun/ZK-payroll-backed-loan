/**
 * zkTLS Proof Generation Runner using Reclaim Protocol
 * 
 * This script demonstrates the complete workflow of:
 * 1. Creating a proof request with Reclaim credentials
 * 2. Generating a zkTLS proof via Reclaim Protocol
 * 3. Verifying the generated proof
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  createProofRequest,
  generateProof,
  verifyProofData,
  getVerificationUrl,
  checkBrowserExtension,
  type ReclaimConfig,
  type ProofRequestOptions,
} from './reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration.js';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Main function to run zkTLS proof generation
 */
async function main() {
  console.log('🚀 Starting zkTLS Proof Generation with Reclaim Protocol\n');

  // Step 1: Load configuration from environment variables
  console.log('📋 Loading configuration from .env file...');
  const config: ReclaimConfig = {
    appId: process.env.RECLAIM_APP_ID || '',
    appSecret: process.env.RECLAIM_APP_SECRET || '',
    providerId: process.env.RECLAIM_PROVIDER_ID || '',
  };

  // Validate configuration
  if (!config.appId || !config.appSecret || !config.providerId) {
    console.error('❌ Error: Missing required environment variables!');
    console.error('Please ensure the following are set in your .env file:');
    console.error('  - RECLAIM_APP_ID');
    console.error('  - RECLAIM_APP_SECRET');
    console.error('  - RECLAIM_PROVIDER_ID');
    process.exit(1);
  }

  console.log('✅ Configuration loaded successfully');
  console.log(`   App ID: ${config.appId}`);
  console.log(`   Provider ID: ${config.providerId}`);
  console.log('');

  // Step 2: Create proof request
  console.log('📝 Creating proof request...');
  
  const proofRequestOptions: ProofRequestOptions = {
    context: {
      address: 'user-wallet-address-or-identifier',
      message: 'Payroll verification for loan application',
    },
    params: {
      // Add any expected parameters here
      // For example: { "employmentStatus": "employed", "minimumSalary": "50000" }
    },
  };

  let proofRequestJson: string;
  try {
    proofRequestJson = await createProofRequest(config, proofRequestOptions);
    console.log('✅ Proof request created successfully');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to create proof request:', error);
    process.exit(1);
  }

  // Step 3: Get verification URL
  console.log('🔗 Getting verification URL...');
  try {
    const verificationUrl = await getVerificationUrl(proofRequestJson);
    console.log('✅ Verification URL generated:');
    console.log(`   ${verificationUrl}`);
    console.log('');
    console.log('📱 To generate a proof, scan the QR code or open this URL on your mobile device.');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to get verification URL:', error);
  }

  // Step 4: Generate proof (Node.js environment - polling approach)
  console.log('🔐 Starting proof generation session...');
  console.log('   In a Node.js environment, we use polling instead of UI flow.');
  console.log('   Please scan the QR code or open the verification URL on your mobile device.');
  console.log('');

  try {
    // In Node.js, we need to use startSession directly without triggerReclaimFlow
    // Since triggerReclaimFlow requires a browser environment
    const reclaimProofRequest = await (await import('@reclaimprotocol/js-sdk')).ReclaimProofRequest.fromJsonString(proofRequestJson);
    
    console.log('⏳ Waiting for proof generation...');
    console.log('   Please complete the verification on your mobile device.');
    console.log('');

    await reclaimProofRequest.startSession({
      onSuccess: async (proofs) => {
        console.log('');
        console.log('✅ Proof generated successfully!');
        console.log('');
        console.log('📦 Received proofs:');
        console.log(JSON.stringify(proofs, null, 2));
        console.log('');

        // Step 5: Verify the proof
        console.log('🔍 Verifying proof...');
        try {
          const verificationResult = await verifyProofData(proofs);
          
          if (verificationResult.isValid) {
            console.log('✅ Proof is VALID!');
            console.log('');
            console.log('📊 Verification Results:');
            console.log(`   Context Address: ${verificationResult.contextAddress}`);
            console.log(`   Context Message: ${verificationResult.contextMessage}`);
            
            if (verificationResult.extractedParameters) {
              console.log('   Extracted Parameters:');
              console.log(JSON.stringify(verificationResult.extractedParameters, null, 2));
            }
            console.log('');
            console.log('🎉 zkTLS proof generation and verification completed successfully!');
          } else {
            console.error('❌ Proof verification FAILED!');
            console.error('   The proof is invalid or has been tampered with.');
          }
        } catch (verifyError) {
          console.error('❌ Error during proof verification:', verifyError);
        }

        process.exit(0);
      },
      onError: (error) => {
        console.error('');
        console.error('❌ Proof generation failed!');
        console.error('   Error:', error.message);
        console.error('');
        console.error('Please try again or check your configuration.');
        process.exit(1);
      },
    });
  } catch (error) {
    console.error('❌ Failed to start proof generation session:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
