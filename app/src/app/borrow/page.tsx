'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { TransactionModal } from '@/components/TransactionModal';
import { ConnectButton } from '@/components/ConnectButton';
import { ZkProofProgress } from '@/components/ZkProofProgress';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBorrowing } from '@/hooks/useBorrowing';
import { PROGRAM_IDS, TOKEN_MINTS } from '@/config';
import { 
  generateAndVerifyPayrollBackedLoanProof, 
  createSamplePayrollBackedLoanInputs,
} from '@/lib/circuits/payroll-backed-loan/zk-proof-generation-and-verification';

export default function BorrowPage() {
  const { address, isConnected } = useAppKitAccount();
  const borrowing = useBorrowing();
  const [loading, setLoading] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  
  // Payroll-based loan states (non-collateral)
  const [payrollAmount, setPayrollAmount] = useState('0.00'); // From zkTLS proof
  const [userBorrowed, setUserBorrowed] = useState('0.00');
  const [availableToBorrow, setAvailableToBorrow] = useState('0.00');
  // const [borrowerState, setBorrowerState] = useState<BorrowerState | null>(null);
  
  // ZK proof states
  const [zkProofStage, setZkProofStage] = useState('Initializing');
  const [zkProofProgress, setZkProofProgress] = useState(0);
  const [showZkProofProgress, setShowZkProofProgress] = useState(false);

  // Step 1: Retrieve Payroll Proof via zkTLS (dummy for now)
  const retrievePayrollProof = async () => {
    try {
      console.log('Retrieving payroll proof via zkTLS (Reclaim Protocol)...');
      
      // TODO: Replace with actual zkTLS/Reclaim Protocol integration
      // const reclaimProof = await getReclaimPayrollProof();
      // const payrollAmount = reclaimProof.publicOutput.payrollAmount;
      
      // DUMMY: For now, use a sample payroll amount
      const dummyPayrollAmount = 5000; // $5000 per month
      const repaymentRatio = 2; // Can borrow up to 2x monthly payroll
      
      setPayrollAmount(dummyPayrollAmount.toFixed(2));
      setAvailableToBorrow((dummyPayrollAmount * repaymentRatio).toFixed(2));
      
      console.log('Dummy payroll amount retrieved:', dummyPayrollAmount);
      console.log('Available to borrow (2x payroll):', dummyPayrollAmount * repaymentRatio);
    } catch (error) {
      console.error('Error retrieving payroll proof:', error);
    }
  };

  const loadBorrowerState = async () => {
    try {
      console.log('Loading borrower state from contract:', PROGRAM_IDS.borrowing);
      const state = await borrowing.loadBorrowerState(PROGRAM_IDS.borrowing);
      // setBorrowerState(state);
      if (state) {
        setUserBorrowed((parseFloat(state.borrowedAmount) / 1e9).toFixed(2));
      }
    } catch (error) {
      console.error('Error loading borrower state:', error);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadBorrowerState();
      // TODO: In production, fetch actual payroll from zkTLS proof
      retrievePayrollProof();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Validate borrow amount against available to borrow (based on payroll)
    if (parseFloat(borrowAmount) > parseFloat(availableToBorrow)) {
      alert(`Cannot borrow more than $${availableToBorrow} (2x your monthly payroll of $${payrollAmount})`);
      return;
    }

    setLoading(true);
    setShowZkProofProgress(true);
    
    try {
      // Step 1: Retrieve Payroll Proof via zkTLS (Reclaim Protocol)
      console.log('Step 1: Retrieving payroll proof via zkTLS...');
      setZkProofStage('Retrieving payroll proof via zkTLS');
      setZkProofProgress(10);
      
      // TODO: Replace with actual zkTLS/Reclaim Protocol integration
      // const reclaimProof = await getReclaimPayrollProof();
      const dummyPayrollAmount = 5000; // Dummy value - will be replaced with actual zkTLS proof
      console.log('Payroll amount from zkTLS proof:', dummyPayrollAmount);
      
      // Step 2: Generate ZK Payroll Backed Loan Proof
      console.log('Step 2: Generating ZK Payroll Backed Loan Proof...');
      setZkProofStage('Generating ZK proof');
      setZkProofProgress(20);
      
      // Create proof inputs using the payroll amount from zkTLS
      const proofInputs = await createSamplePayrollBackedLoanInputs();
      // TODO: Update proof inputs with actual payroll amount from zkTLS
      // proofInputs.private_inputs.payroll_amount = dummyPayrollAmount.toString();
      
      // Generate and verify proof with progress tracking
      const proofResult = await generateAndVerifyPayrollBackedLoanProof(
        proofInputs,
        (stage, progress) => {
          setZkProofStage(stage);
          // Map progress from 20-80% range
          setZkProofProgress(20 + (progress * 0.6));
        }
      );
      
      if (!proofResult.success) {
        const errorMsg = proofResult.error || 'ZK proof generation or verification failed';
        console.error('Proof generation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Step 3: ZK Proof Verified
      console.log('Step 3: ZK Payroll Backed Loan Proof verified successfully ✓');
      console.log('Proof:', proofResult.proof);
      console.log('Public inputs:', proofResult.publicInputs);
      setZkProofStage('Proof verified successfully');
      setZkProofProgress(90);
      
      setShowZkProofProgress(false);
      
      // Step 4: Transfer funds from lending pool to borrower
      console.log('Step 4: Transferring Test USDC from lending pool to borrower...');
      setZkProofStage('Executing loan transfer');
      setZkProofProgress(95);
      
      const signature = await borrowing.borrow(
        PROGRAM_IDS.borrowing,
        PROGRAM_IDS.lending,
        parseFloat(borrowAmount),
        TOKEN_MINTS.testUsdc
      );
      
      setZkProofProgress(100);
      alert(
        `Loan approved! ✓\n\n` +
        `Payroll verified: $${dummyPayrollAmount}/month\n` +
        `ZK Proof verified: ✓\n` +
        `Loan amount: $${borrowAmount} Test USDC\n` +
        `Transaction: ${signature}`
      );
      setShowBorrowModal(false);
      setBorrowAmount('');
      loadBorrowerState();
    } catch (error) {
      console.error('Borrow error:', error);
      alert('Loan request failed: ' + (error as Error).message);
      setShowZkProofProgress(false);
    } finally {
      setLoading(false);
      setZkProofProgress(0);
      setZkProofStage('Initializing');
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(repayAmount) > parseFloat(userBorrowed)) {
      alert(`Cannot repay more than your borrowed amount of $${userBorrowed}`);
      return;
    }

    setLoading(true);
    try {
      console.log('Repaying to contracts:', PROGRAM_IDS.borrowing, PROGRAM_IDS.lending);
      const signature = await borrowing.repay(
        PROGRAM_IDS.borrowing,
        PROGRAM_IDS.lending,
        parseFloat(repayAmount)
      );
      
      alert(`Repayment successful!\nTransaction: ${signature}`);
      setShowRepayModal(false);
      setRepayAmount('');
      loadBorrowerState();
    } catch (error) {
      console.error('Repay error:', error);
      alert('Repayment failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container">
        <div className="row justify-content-center mt-5">
          <div className="col-md-6 text-center">
            <div className="card shadow">
              <div className="card-body p-5">
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Connect Wallet to Borrow</h2>
                <p className="text-muted mb-4">
                  Connect your wallet to deposit collateral and borrow assets
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
              <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>Payroll-Backed Loans</h1>
              <p className="text-muted mb-0">Non-collateral loans based on verified payroll income</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Your Borrowing Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatsCard 
            title="Monthly Payroll" 
            value={`$${payrollAmount}`}
            variant="info"
            subValue="From zkTLS Proof"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Total Borrowed" 
            value={`$${userBorrowed}`}
            variant="warning"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Available to Borrow" 
            value={`$${availableToBorrow}`}
            variant="success"
            subValue="2x Monthly Payroll"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Loan Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <button 
                    className="btn btn-success w-100 btn-lg"
                    onClick={() => setShowBorrowModal(true)}
                    disabled={!isConnected || parseFloat(availableToBorrow) <= 0}
                  >
                    <i className="bi bi-cash-coin me-2"></i>
                    Request Loan
                  </button>
                  {parseFloat(availableToBorrow) <= 0 && (
                    <small className="text-muted d-block mt-2">
                      Connect wallet to view available loan amount
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <button 
                    className="btn btn-warning w-100 btn-lg"
                    onClick={() => setShowRepayModal(true)}
                    disabled={!isConnected || parseFloat(userBorrowed) <= 0}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Repay Loan
                  </button>
                  {parseFloat(userBorrowed) <= 0 && isConnected && (
                    <small className="text-muted d-block mt-2">
                      No active loans to repay
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Loan Status */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Your Active Loans
              </h5>
            </div>
            <div className="card-body">
              {parseFloat(userBorrowed) > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Loan Type</th>
                        <th>Monthly Payroll</th>
                        <th>Borrowed Amount</th>
                        <th>APY</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-shield-check text-success me-2"></i>
                            <span className="fw-semibold">Payroll-Backed Loan</span>
                          </div>
                        </td>
                        <td>${payrollAmount}</td>
                        <td className="fw-semibold">${userBorrowed}</td>
                        <td>3.8%</td>
                        <td>
                          <span className="badge bg-success">Active</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox display-4 d-block mb-3"></i>
                  <p>No active loans yet. Request a loan above to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm bg-light">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                How Payroll-Backed Loans Work
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                      1
                    </div>
                    <h6 className="fw-semibold">Verify Payroll</h6>
                    <p className="text-muted small">
                      Connect your payroll data via zkTLS proof (Reclaim Protocol)
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                      2
                    </div>
                    <h6 className="fw-semibold">Generate ZK Proof</h6>
                    <p className="text-muted small">
                      Privacy-preserving proof of your payroll income
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                      3
                    </div>
                    <h6 className="fw-semibold">Get Approved</h6>
                    <p className="text-muted small">
                      Borrow up to 2x your monthly payroll without collateral
                    </p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                         style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                      4
                    </div>
                    <h6 className="fw-semibold">Receive Funds</h6>
                    <p className="text-muted small">
                      Instant transfer from lending pool to your wallet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Borrow Modal */}
      <TransactionModal
        show={showBorrowModal}
        onHide={() => setShowBorrowModal(false)}
        title="Request Payroll-Backed Loan"
      >
        {/* ZK Proof Progress */}
        <ZkProofProgress 
          stage={zkProofStage}
          progress={zkProofProgress}
          show={showZkProofProgress}
        />
        
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Loan Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">USDC</span>
          </div>
          <div className="form-text">
            Available to borrow: ${availableToBorrow} (based on ${payrollAmount} monthly payroll)
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-info" role="alert" style={{ fontSize: '0.875rem' }}>
            <strong>How it works:</strong>
            <ol className="mb-0 mt-2 ps-3">
              <li>Retrieve your payroll proof via zkTLS</li>
              <li>Generate ZK proof for privacy-preserving verification</li>
              <li>Verify proof on-chain</li>
              <li>Receive funds instantly (no collateral needed)</li>
            </ol>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Monthly Payroll</span>
            <span style={{ fontWeight: 600 }}>${payrollAmount}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Loan APY</span>
            <span style={{ fontWeight: 600 }}>3.8%</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Loan Type</span>
            <span style={{ fontWeight: 600 }}>Non-Collateral</span>
          </div>
        </div>

        <button 
          className="btn btn-success w-100 btn-lg"
          onClick={handleBorrow}
          disabled={loading || !borrowAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Request Loan with ZK Proof'}
        </button>
      </TransactionModal>

      {/* Repay Modal */}
      <TransactionModal
        show={showRepayModal}
        onHide={() => setShowRepayModal(false)}
        title="Repay Loan"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Repayment Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">USDC</span>
          </div>
          <div className="form-text">
            Outstanding balance: ${userBorrowed} USDC
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-success" role="alert" style={{ fontSize: '0.875rem' }}>
            Repaying your loan on time helps maintain your credit profile for future loans.
          </div>
        </div>

        <button 
          className="btn btn-warning w-100 btn-lg"
          onClick={handleRepay}
          disabled={loading || !repayAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Repay Loan'}
        </button>
      </TransactionModal>
    </div>
  );
}
