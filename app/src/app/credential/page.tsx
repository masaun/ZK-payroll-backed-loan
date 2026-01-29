'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { TransactionModal } from '@/components/TransactionModal';
import { ConnectButton } from '@/components/ConnectButton';
import { ZkTlsButton } from '@/components/ZkTlsButton';

interface Credential {
  proofHash: string;
  timestamp: number;
  isVerified: boolean;
  owner: string;
  proofType: string;
}

export default function CredentialPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [proofData, setProofData] = useState('');
  const [publicOutput, setPublicOutput] = useState('');
  
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [totalCredentials, setTotalCredentials] = useState(0);
  const [verifiedCredentials, setVerifiedCredentials] = useState(0);

  useEffect(() => {
    // Check wallet connection
    setConnected(false); // TODO: Replace with actual wallet check
  }, []);

  useEffect(() => {
    if (connected) {
      loadCredentials();
    }
  }, [connected]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      // TODO: Fetch credentials from Solana
      // Placeholder data
      setCredentials([]);
      setTotalCredentials(0);
      setVerifiedCredentials(0);
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreProof = async () => {
    if (!proofData || !publicOutput) {
      alert('Please provide both proof data and public output');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call store_zk_tls_proof_and_public_output from the contract
      console.log('Storing proof...');
      
      // Create proof hash (placeholder - should use actual hash function)
      const proofHash = new Array(32).fill(0);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .storeZkTlsProofAndPublicOutput(
      //     Array.from(Buffer.from(proofData)),
      //     Array.from(Buffer.from(publicOutput)),
      //     proofHash
      //   )
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Credential stored successfully!');
      setShowUploadModal(false);
      setProofData('');
      setPublicOutput('');
      loadCredentials();
    } catch (error) {
      console.error('Store proof error:', error);
      alert('Failed to store credential: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredential = async (proofHash: string) => {
    setLoading(true);
    try {
      // TODO: Call verify_credential from the contract
      console.log('Verifying credential:', proofHash);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .verifyCredential()
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Credential verified successfully!');
      loadCredentials();
    } catch (error) {
      console.error('Verify credential error:', error);
      alert('Verification failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCredential = async (proofHash: string) => {
    if (!confirm('Are you sure you want to revoke this credential?')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Call revoke_credential from the contract
      console.log('Revoking credential:', proofHash);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .revokeCredential()
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Credential revoked successfully!');
      loadCredentials();
    } catch (error) {
      console.error('Revoke credential error:', error);
      alert('Revocation failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  if (!connected) {
    return (
      <div className="container">
        <div className="row justify-content-center mt-5">
          <div className="col-md-6 text-center">
            <div className="card shadow">
              <div className="card-body p-5">
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Connect Wallet</h2>
                <p className="text-muted mb-4">
                  Connect your wallet to manage your ZK credentials
                </p>
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>ZK Credentials</h1>
              <p className="text-muted mb-0">Manage your zero-knowledge verifiable credentials</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatsCard 
            title="Total Credentials" 
            value={totalCredentials.toString()}
            variant="primary"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Verified Credentials" 
            value={verifiedCredentials.toString()}
            variant="success"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Pending Verification" 
            value={(totalCredentials - verifiedCredentials).toString()}
            variant="warning"
          />
        </div>
      </div>

      {/* ZK-TLS Proof Generation */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-primary" style={{ borderWidth: '2px' }}>
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                🔐 Generate ZK-TLS Proof
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Prove your payroll income using zkTLS without revealing sensitive data.
                This generates a zero-knowledge proof of your employment and salary.
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <ZkTlsButton />
                </div>
                <div className="col-md-6">
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload Existing Proof
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ fontWeight: 600 }}>
                  Your Credentials
                </h5>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={loadCredentials}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <svg width="64" height="64" fill="currentColor" className="text-muted" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </div>
                  <h5 className="text-muted mb-2">No credentials yet</h5>
                  <p className="text-muted">
                    Generate a ZK-TLS proof using the button above to get started
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Proof Hash</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.map((credential, index) => (
                        <tr key={index}>
                          <td>
                            <code style={{ fontSize: '0.875rem' }}>
                              {truncateHash(credential.proofHash)}
                            </code>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {credential.proofType}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>
                            {formatDate(credential.timestamp)}
                          </td>
                          <td>
                            {credential.isVerified ? (
                              <span className="badge bg-success">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark">
                                Pending
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {!credential.isVerified && (
                                <button 
                                  className="btn btn-success"
                                  onClick={() => handleVerifyCredential(credential.proofHash)}
                                  disabled={loading}
                                >
                                  Verify
                                </button>
                              )}
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => handleRevokeCredential(credential.proofHash)}
                                disabled={loading}
                              >
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                How ZK Credentials Work
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                      1
                    </div>
                    <div>
                      <h6 style={{ fontWeight: 600 }}>Generate Proof</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        Create a zero-knowledge proof of your payroll data using zkTLS
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      <h6 style={{ fontWeight: 600 }}>Store On-Chain</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        Your proof is stored securely on Solana blockchain
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="d-flex">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      <h6 style={{ fontWeight: 600 }}>Use for Lending</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        Verified credentials enable better loan terms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Proof Modal */}
      <TransactionModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        title="Upload ZK Proof"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Proof Data (JSON)</label>
          <textarea
            className="form-control font-monospace"
            rows={5}
            placeholder='{"proof": "...", "inputs": "..."}'
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
            disabled={loading}
            style={{ fontSize: '0.875rem' }}
          />
        </div>

        <div className="mb-4">
          <label className="form-label" style={{ fontWeight: 500 }}>Public Output (JSON)</label>
          <textarea
            className="form-control font-monospace"
            rows={3}
            placeholder='{"salary": "...", "employer": "..."}'
            value={publicOutput}
            onChange={(e) => setPublicOutput(e.target.value)}
            disabled={loading}
            style={{ fontSize: '0.875rem' }}
          />
        </div>

        <div className="alert alert-info mb-4" role="alert" style={{ fontSize: '0.875rem' }}>
          <strong>Note:</strong> The proof data should be in JSON format containing your ZK proof and public inputs.
        </div>

        <button 
          className="btn btn-primary w-100 btn-lg"
          onClick={handleStoreProof}
          disabled={loading || !proofData || !publicOutput}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Storing...' : 'Store Credential'}
        </button>
      </TransactionModal>
    </div>
  );
}
