import { NextRequest, NextResponse } from 'next/server';
import { verifyProofData } from '@/lib/zktls/reclaim/reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration';

/**
 * API Route: Verify Proof
 * 
 * POST /api/reclaim/verify-proof
 * 
 * Verifies a Reclaim Protocol proof submitted by the user.
 * This is a critical security endpoint that validates the proof cryptographically
 * and extracts the verified payroll data.
 * 
 * IMPORTANT: Always verify proofs on the backend as frontend validation can be bypassed.
 * 
 * Request Body:
 * {
 *   "proofs": any  // Proof object received from Reclaim SDK onSuccess callback
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "isValid": true,
 *   "data": {
 *     "contextAddress": "string",
 *     "contextMessage": "string",
 *     "extractedParameters": {
 *       // Verified payroll data extracted from the proof
 *     }
 *   }
 * }
 * 
 * Response (Invalid Proof):
 * {
 *   "success": false,
 *   "isValid": false,
 *   "error": "Invalid proof"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofs } = body;

    if (!proofs) {
      return NextResponse.json(
        {
          success: false,
          error: 'No proofs provided in request body',
        },
        { status: 400 }
      );
    }

    // Verify the proof cryptographically
    const result = await verifyProofData(proofs);

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          error: 'Invalid proof - verification failed',
        },
        { status: 400 }
      );
    }

    // Extract verified data
    const verifiedData = {
      contextAddress: result.contextAddress,
      contextMessage: result.contextMessage,
      extractedParameters: result.extractedParameters,
    };

    // Here you can add additional business logic:
    // - Store verified payroll data in database
    // - Calculate loan eligibility based on income
    // - Update user's verification status
    // - Trigger loan approval workflow

    console.log('✅ Proof verified successfully');
    console.log('User Address:', result.contextAddress);
    console.log('Extracted Data:', result.extractedParameters);

    return NextResponse.json({
      success: true,
      isValid: true,
      data: verifiedData,
    });
  } catch (error) {
    console.error('Error verifying proof:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify proof',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 */
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Use POST method to verify a proof',
  }, { status: 405 });
}
