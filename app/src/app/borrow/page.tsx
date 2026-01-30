'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { TransactionModal } from '@/components/TransactionModal';
import { ConnectButton } from '@/components/ConnectButton';
import { ZkProofProgress } from '@/components/ZkProofProgress';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBorrowing, type CollateralPool, type BorrowerState } from '@/hooks/useBorrowing';
import { PROGRAM_IDS } from '@/config';
import { 
  generateAndVerifyPayrollBackedLoanProof, 
  createSamplePayrollBackedLoanInputs,
  type PayrollBackedLoanProofInputs 
} from '@/lib/circuits/payroll-backed-loan/zk-proof-generation-and-verification';

export default function BorrowPage() {
  const { address, isConnected } = useAppKitAccount();
  const borrowing = useBorrowing();
  const [loading, setLoading] = useState(false);
  const [showDepositCollateralModal, setShowDepositCollateralModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showWithdrawCollateralModal, setShowWithdrawCollateralModal] = useState(false);
  
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawCollateralAmount, setWithdrawCollateralAmount] = useState('');
  
  const [userCollateral, setUserCollateral] = useState('0.00');
  const [userBorrowed, setUserBorrowed] = useState('0.00');
  const [healthFactor, setHealthFactor] = useState('∞');
  const [availableToBorrow, setAvailableToBorrow] = useState('0.00');
  const [borrowerState, setBorrowerState] = useState<BorrowerState | null>(null);
  
  // ZK proof states
  const [zkProofStage, setZkProofStage] = useState('Initializing');
  const [zkProofProgress, setZkProofProgress] = useState(0);
  const [showZkProofProgress, setShowZkProofProgress] = useState(false);

  const [pools, setPools] = useState<CollateralPool[]>([
    {
      address: PROGRAM_IDS.borrowing,
      collateralMint: 'SOL',
      totalCollateral: '2,100,000',
      collateralRatio: '150',
      liquidationThreshold: '120',
      borrowAPY: '3.8'
    }
  ]);

  useEffect(() => {
    if (isConnected && address) {
      loadBorrowerState();
    }
  }, [isConnected, address]);

  const loadBorrowerState = async () => {
    try {
      console.log('Loading borrower state from contract:', PROGRAM_IDS.borrowing);
      const state = await borrowing.loadBorrowerState(PROGRAM_IDS.borrowing);
      setBorrowerState(state);
      if (state) {
        setUserCollateral((parseFloat(state.collateralAmount) / 1e9).toFixed(2));
        setUserBorrowed((parseFloat(state.borrowedAmount) / 1e9).toFixed(2));
      }
    } catch (error) {
      console.error('Error loading borrower state:', error);
    }
  };

  const handleDepositCollateral = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Depositing collateral to contract:', PROGRAM_IDS.borrowing);
      const signature = await borrowing.depositCollateral(
        PROGRAM_IDS.borrowing,
        parseFloat(collateralAmount)
      );
      
      alert(`Collateral deposited successfully!\nTransaction: ${signature}`);
      setShowDepositCollateralModal(false);
      setCollateralAmount('');
      loadBorrowerState();
    } catch (error) {
      console.error('Deposit collateral error:', error);
      alert('Deposit failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setShowZkProofProgress(true);
    
    try {
      // Step 1: Generate and verify ZK proof
      console.log('Generating ZK proof for payroll verification...');
      
      // Create sample inputs (in production, this would come from zkTLS or other sources)
      const proofInputs = createSamplePayrollBackedLoanInputs(
        `nullifier_${Date.now()}_${Math.random()}`
      );
      
      // Generate and verify proof with progress tracking
      const proofResult = await generateAndVerifyPayrollBackedLoanProof(
        proofInputs,
        (stage, progress) => {
          setZkProofStage(stage);
          setZkProofProgress(progress);
        }
      );
      
      if (!proofResult.success) {
        throw new Error('ZK proof generation or verification failed');
      }
      
      console.log('ZK proof generated and verified successfully');
      console.log('Proof:', proofResult.proof);
      console.log('Public inputs:', proofResult.publicInputs);
      
      setShowZkProofProgress(false);
      
      // Step 2: Execute borrow transaction with the proof
      console.log('Borrowing from contracts:', PROGRAM_IDS.borrowing, PROGRAM_IDS.lending);
      const signature = await borrowing.borrow(
        PROGRAM_IDS.borrowing,
        PROGRAM_IDS.lending,
        parseFloat(borrowAmount)
      );
      
      alert(`Borrow successful!\nZK Proof verified ✓\nTransaction: ${signature}`);
      setShowBorrowModal(false);
      setBorrowAmount('');
      loadBorrowerState();
    } catch (error) {
      console.error('Borrow error:', error);
      alert('Borrow failed: ' + (error as Error).message);
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

  const handleWithdrawCollateral = async () => {
    if (!withdrawCollateralAmount || parseFloat(withdrawCollateralAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Withdrawing collateral from contract:', PROGRAM_IDS.borrowing);
      const signature = await borrowing.withdrawCollateral(
        PROGRAM_IDS.borrowing,
        parseFloat(withdrawCollateralAmount)
      );
      
      alert(`Collateral withdrawal successful!\nTransaction: ${signature}`);
      setShowWithdrawCollateralModal(false);
      setWithdrawCollateralAmount('');
      loadBorrowerState();
    } catch (error) {
      console.error('Withdraw collateral error:', error);
      alert('Withdrawal failed: ' + (error as Error).message);
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
              <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>Borrow</h1>
              <p className="text-muted mb-0">Deposit collateral and borrow assets</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Your Borrowing Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatsCard 
            title="Your Collateral" 
            value={`$${userCollateral}`}
            variant="info"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Total Borrowed" 
            value={`$${userBorrowed}`}
            variant="warning"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Available to Borrow" 
            value={`$${availableToBorrow}`}
            variant="success"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Health Factor" 
            value={healthFactor}
            variant="primary"
            subValue={parseFloat(healthFactor) < 1.2 ? 'At risk' : 'Safe'}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6 col-lg-3">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => setShowDepositCollateralModal(true)}
                  >
                    Deposit Collateral
                  </button>
                </div>
                <div className="col-md-6 col-lg-3">
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => setShowBorrowModal(true)}
                  >
                    Borrow
                  </button>
                </div>
                <div className="col-md-6 col-lg-3">
                  <button 
                    className="btn btn-warning w-100"
                    onClick={() => setShowRepayModal(true)}
                  >
                    Repay
                  </button>
                </div>
                <div className="col-md-6 col-lg-3">
                  <button 
                    className="btn btn-outline-primary w-100"
                    onClick={() => setShowWithdrawCollateralModal(true)}
                  >
                    Withdraw Collateral
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Positions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Your Borrowing Positions
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Collateral</th>
                      <th>Borrowed Asset</th>
                      <th>Borrowed Amount</th>
                      <th>Collateral Amount</th>
                      <th>APY</th>
                      <th>Health Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No borrowing positions yet. Deposit collateral below to start borrowing.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Collateral Pools */}
      <div className="row mb-4">
        <div className="col-12">
          <h3 className="mb-3" style={{ fontWeight: 600 }}>Available Collateral Pools</h3>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Collateral Asset</th>
                      <th>Total Collateral</th>
                      <th>Collateral Ratio</th>
                      <th>Liquidation Threshold</th>
                      <th>Borrow APY</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((pool, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                 style={{ width: '32px', height: '32px', fontSize: '0.875rem', fontWeight: 600 }}>
                              {pool.collateralMint.substring(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{pool.collateralMint}</div>
                            </div>
                          </div>
                        </td>
                        <td>${pool.totalCollateral}</td>
                        <td>{pool.collateralRatio}%</td>
                        <td>{pool.liquidationThreshold}%</td>
                        <td>
                          <span className="badge bg-warning text-dark" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {pool.borrowAPY}%
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => setShowDepositCollateralModal(true)}
                          >
                            Use as Collateral
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Collateral Modal */}
      <TransactionModal
        show={showDepositCollateralModal}
        onHide={() => setShowDepositCollateralModal(false)}
        title="Deposit Collateral"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">SOL</span>
          </div>
          <div className="form-text">
            Available: 10.00 SOL
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-info" role="alert" style={{ fontSize: '0.875rem' }}>
            <strong>Collateral Ratio:</strong> 150%<br />
            You can borrow up to {collateralAmount ? (parseFloat(collateralAmount) / 1.5).toFixed(2) : '0.00'} USD worth of assets.
          </div>
        </div>

        <button 
          className="btn btn-primary w-100 btn-lg"
          onClick={handleDepositCollateral}
          disabled={loading || !collateralAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Deposit Collateral'}
        </button>
      </TransactionModal>

      {/* Borrow Modal */}
      <TransactionModal
        show={showBorrowModal}
        onHide={() => setShowBorrowModal(false)}
        title="Borrow Assets"
      >
        {/* ZK Proof Progress */}
        <ZkProofProgress 
          stage={zkProofStage}
          progress={zkProofProgress}
          show={showZkProofProgress}
        />
        
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
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
            Available to borrow: {availableToBorrow} USDC
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Borrow APY</span>
            <span style={{ fontWeight: 600 }}>3.8%</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Health Factor (after borrow)</span>
            <span style={{ fontWeight: 600 }}>
              {borrowAmount && parseFloat(userCollateral) > 0
                ? ((parseFloat(userCollateral) * 1.2) / (parseFloat(userBorrowed) + parseFloat(borrowAmount))).toFixed(2)
                : '∞'}
            </span>
          </div>
        </div>

        <button 
          className="btn btn-success w-100 btn-lg"
          onClick={handleBorrow}
          disabled={loading || !borrowAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Borrow'}
        </button>
      </TransactionModal>

      {/* Repay Modal */}
      <TransactionModal
        show={showRepayModal}
        onHide={() => setShowRepayModal(false)}
        title="Repay Loan"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
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
            Borrowed: {userBorrowed} USDC
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-success" role="alert" style={{ fontSize: '0.875rem' }}>
            Repaying your loan will improve your health factor and free up collateral.
          </div>
        </div>

        <button 
          className="btn btn-warning w-100 btn-lg"
          onClick={handleRepay}
          disabled={loading || !repayAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Repay'}
        </button>
      </TransactionModal>

      {/* Withdraw Collateral Modal */}
      <TransactionModal
        show={showWithdrawCollateralModal}
        onHide={() => setShowWithdrawCollateralModal(false)}
        title="Withdraw Collateral"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={withdrawCollateralAmount}
              onChange={(e) => setWithdrawCollateralAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">SOL</span>
          </div>
          <div className="form-text">
            Deposited: {userCollateral} SOL
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-warning" role="alert" style={{ fontSize: '0.875rem' }}>
            <strong>Warning:</strong> Withdrawing collateral may decrease your health factor. Make sure you maintain sufficient collateral.
          </div>
        </div>

        <button 
          className="btn btn-primary w-100 btn-lg"
          onClick={handleWithdrawCollateral}
          disabled={loading || !withdrawCollateralAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </TransactionModal>
    </div>
  );
}
