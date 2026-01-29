'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { TransactionModal } from '@/components/TransactionModal';
import { ConnectButton } from '@/components/ConnectButton';

interface CollateralPool {
  address: string;
  collateralMint: string;
  totalCollateral: string;
  collateralRatio: string;
  liquidationThreshold: string;
  borrowAPY: string;
}

export default function BorrowPage() {
  const [connected, setConnected] = useState(false);
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

  const [pools, setPools] = useState<CollateralPool[]>([
    {
      address: 'Pool1...',
      collateralMint: 'SOL',
      totalCollateral: '2,100,000',
      collateralRatio: '150',
      liquidationThreshold: '120',
      borrowAPY: '3.8'
    }
  ]);

  useEffect(() => {
    // Check wallet connection
    setConnected(false); // TODO: Replace with actual wallet check
  }, []);

  const handleDepositCollateral = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call deposit_into_collateral_pool from the contract
      console.log('Depositing collateral:', collateralAmount);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .depositIntoCollateralPool(new BN(collateralAmount))
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Collateral deposited successfully!');
      setShowDepositCollateralModal(false);
      setCollateralAmount('');
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
    try {
      // TODO: Call borrow_against_collateral from the contract
      console.log('Borrowing:', borrowAmount);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .borrowAgainstCollateral(new BN(borrowAmount), lendingPoolPubkey)
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Borrow successful!');
      setShowBorrowModal(false);
      setBorrowAmount('');
    } catch (error) {
      console.error('Borrow error:', error);
      alert('Borrow failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call repay_loan from the contract
      console.log('Repaying:', repayAmount);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .repayLoan(new BN(repayAmount))
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Repayment successful!');
      setShowRepayModal(false);
      setRepayAmount('');
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
      // TODO: Call withdraw_from_collateral_pool from the contract
      console.log('Withdrawing collateral:', withdrawCollateralAmount);
      
      // Placeholder for contract call
      // const tx = await program.methods
      //   .withdrawFromCollateralPool(new BN(withdrawCollateralAmount))
      //   .accounts({ ... })
      //   .rpc();
      
      alert('Collateral withdrawal successful!');
      setShowWithdrawCollateralModal(false);
      setWithdrawCollateralAmount('');
    } catch (error) {
      console.error('Withdraw collateral error:', error);
      alert('Withdrawal failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
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
