'use client';

import { useZkTlsProof } from '@/hooks/useZkTlsProof';
import { useAppKitAccount } from '@reown/appkit/react';

/**
 * ZkTlsButton Component
 * 
 * A button component that triggers zkTLS proof generation for payroll verification.
 * Integrates with Reclaim Protocol to verify user's income data securely.
 * 
 * Features:
 * - Automatically uses connected Solana wallet address
 * - Shows QR code modal for mobile verification (via Reclaim SDK)
 * - Displays loading state and progress messages during proof generation
 * - Shows error messages
 * - Shows verified proof data after successful verification
 * 
 * How it works:
 * 1. User clicks "Request zkTLS Proof Generation" button
 * 2. QR code modal appears (powered by Reclaim SDK)
 * 3. User scans QR code with mobile device
 * 4. User completes verification in Reclaim app
 * 5. Proof is generated and verified
 * 6. Verified data is displayed on the page
 */
export function ZkTlsButton() {
  const { address, isConnected } = useAppKitAccount();
  const { isGenerating, error, proofData, statusMessage, requestProof, clearError } = useZkTlsProof();

  const handleRequestProof = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    await requestProof(address);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <button
        onClick={handleRequestProof}
        disabled={isGenerating || !isConnected}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isGenerating ? '#666' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isGenerating || !isConnected ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isGenerating || !isConnected ? 0.6 : 1,
        }}
      >
        {isGenerating ? '🔄 Generating zkTLS Proof...' : '🔐 Request zkTLS Proof Generation'}
      </button>

      {!isConnected && (
        <p style={{ color: '#ff9800', marginTop: '10px', fontSize: '14px' }}>
          ⚠️ Please connect your wallet to request proof
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '6px',
            color: '#c62828',
          }}
        >
          <strong>❌ Error:</strong> {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {isGenerating && (
        <div
          style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196F3',
            borderRadius: '6px',
            color: '#1565c0',
          }}
        >
          <strong>🔄 {statusMessage || 'Processing...'}</strong>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            {statusMessage.includes('QR code') 
              ? '📱 Scan the QR code with your mobile device to complete verification'
              : statusMessage.includes('Waiting') || statusMessage.includes('Creating')
              ? '⏳ Setting up your verification session...'
              : '🔐 Completing zkTLS proof generation...'}
          </p>
        </div>
      )}

      {proofData && (
        <div
          style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #4CAF50',
            borderRadius: '6px',
            color: '#2e7d32',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>✅ Proof Verified Successfully!</h3>
          <div style={{ fontSize: '14px' }}>
            <p><strong>User Address:</strong> {proofData.contextAddress}</p>
            {proofData.extractedParameters && (
              <div>
                <strong>Verified Payroll Data:</strong>
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #c8e6c9',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px',
                  }}
                >
                  {JSON.stringify(proofData.extractedParameters, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
