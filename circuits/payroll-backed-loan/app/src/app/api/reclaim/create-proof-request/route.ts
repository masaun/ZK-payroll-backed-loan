import { NextRequest, NextResponse } from 'next/server';
import { createProofRequest } from '@/lib/zktls/reclaim/reclaim-js-sdk-integration/zktls-reclaim-js-sdk-integration';

/**
 * API Route: Create Proof Request
 * 
 * POST /api/reclaim/create-proof-request
 * 
 * Creates a Reclaim Protocol proof request for payroll verification.
 * This endpoint should be called from the frontend to initiate the zkTLS proof generation flow.
 * 
 * Request Body (optional):
 * {
 *   "userAddress": "string",      // Solana wallet address or user identifier
 *   "message": "string",           // Additional context message
 *   "providerId": "string"         // Optional: Override default provider
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "proofRequest": "string"       // JSON string to be used in frontend
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userAddress, message, providerId } = body;

    // Validate environment variables
    const appId = process.env.RECLAIM_APP_ID;
    const appSecret = process.env.RECLAIM_APP_SECRET;
    const defaultProviderId = process.env.RECLAIM_PROVIDER_ID || 'payroll-provider';

    if (!appId || !appSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reclaim credentials not configured. Please set RECLAIM_APP_ID and RECLAIM_APP_SECRET in environment variables.',
        },
        { status: 500 }
      );
    }

    // Create proof request configuration
    const config = {
      appId,
      appSecret,
      providerId: providerId || defaultProviderId,
    };

    // Create proof request with optional context
    const proofRequest = await createProofRequest(config, {
      context: userAddress ? {
        address: userAddress,
        message: message || 'Payroll verification for loan application',
      } : undefined,
      // Optional: Set callback URL for backend proof processing
      // callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/reclaim/callback`,
      // useJson: true,
    });

    return NextResponse.json({
      success: true,
      proofRequest,
    });
  } catch (error) {
    console.error('Error creating proof request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create proof request',
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
    error: 'Use POST method to create a proof request',
  }, { status: 405 });
}
