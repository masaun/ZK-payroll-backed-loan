'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { TransactionModal } from '@/components/TransactionModal';
import { ConnectButton } from '@/components/ConnectButton';
import { useAppKitAccount } from '@reown/appkit/react';
import { useLending, type LendingPool, type DepositorAccount } from '@/hooks/useLending';
import { PROGRAM_IDS } from '@/config';

export default function LendPage() {
  const { address, isConnected } = useAppKitAccount();
  const lending = useLending();
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [userDeposit, setUserDeposit] = useState('0.00');
  const [earnedInterest, setEarnedInterest] = useState('0.00');
  const [depositorAccount, setDepositorAccount] = useState<DepositorAccount | null>(null);

  const [pools, setPools] = useState<LendingPool[]>([
    {
      address: PROGRAM_IDS.lending,
      tokenMint: 'USDC',
      totalDeposits: '1,250,000',
      totalBorrowed: '400,000',
      interestRate: '520',
      utilization: '32',
      apy: '5.2',
      minDeposit: '100'
    }
  ]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserDeposits();
    }
  }, [isConnected, address]);

  const loadUserDeposits = async () => {
    try {
      console.log('Loading user deposits from contract:', PROGRAM_IDS.lending);
      const account = await lending.loadUserDeposits(PROGRAM_IDS.lending);
      setDepositorAccount(account);
      if (account) {
        setUserDeposit((parseFloat(account.depositedAmount) / 1e9).toFixed(2));
      }
    } catch (error) {
      console.error('Error loading deposits:', error);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Depositing to contract:', PROGRAM_IDS.lending);
      const signature = await lending.deposit(PROGRAM_IDS.lending, parseFloat(depositAmount));
      
      alert(`Deposit successful!\nTransaction: ${signature}`);
      setShowDepositModal(false);
      setDepositAmount('');
      loadUserDeposits();
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      console.log('Withdrawing from contract:', PROGRAM_IDS.lending);
      const signature = await lending.withdraw(PROGRAM_IDS.lending, parseFloat(withdrawAmount));
      
      alert(`Withdrawal successful!\nTransaction: ${signature}`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      loadUserDeposits();
    } catch (error) {
      console.error('Withdraw error:', error);
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
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Connect Wallet to Lend</h2>
                <p className="text-muted mb-4">
                  Connect your wallet to start lending and earning interest
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
              <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>Lend</h1>
              <p className="text-muted mb-0">Supply assets to earn interest</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Your Lending Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatsCard 
            title="Your Total Supplied" 
            value={`$${userDeposit}`}
            variant="success"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Earned Interest" 
            value={`$${earnedInterest}`}
            variant="info"
          />
        </div>
        <div className="col-md-4">
          <StatsCard 
            title="Average APY" 
            value="5.2%"
            variant="primary"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Lending Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <button 
                    className="btn btn-primary w-100 btn-lg"
                    onClick={() => setShowDepositModal(true)}
                    disabled={!isConnected}
                  >
                    <i className="bi bi-wallet2 me-2"></i>
                    Lend Now
                  </button>
                  {!isConnected && (
                    <small className="text-muted d-block mt-2">
                      Connect wallet to start lending
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <button 
                    className="btn btn-outline-primary w-100 btn-lg"
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!isConnected || parseFloat(userDeposit) <= 0}
                  >
                    <i className="bi bi-arrow-down-circle me-2"></i>
                    Withdraw
                  </button>
                  {parseFloat(userDeposit) <= 0 && isConnected && (
                    <small className="text-muted d-block mt-2">
                      No deposits to withdraw
                    </small>
                  )}
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
                Your Lending Positions
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>APY</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No positions yet. Supply assets below to start earning.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Lending Pools */}
      <div className="row mb-4">
        <div className="col-12">
          <h3 className="mb-3" style={{ fontWeight: 600 }}>Available Lending Pools</h3>
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
                      <th>Asset</th>
                      <th>Total Supplied</th>
                      <th>Total Borrowed</th>
                      <th>Utilization</th>
                      <th>APY</th>
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
                              {pool.tokenMint.substring(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{pool.tokenMint}</div>
                            </div>
                          </div>
                        </td>
                        <td>${pool.totalDeposits}</td>
                        <td>${pool.totalBorrowed}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: '8px', width: '100px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{ width: `${pool.utilization}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.875rem' }}>{pool.utilization}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {pool.apy}%
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-primary"
                              onClick={() => setShowDepositModal(true)}
                            >
                              Supply
                            </button>
                            <button 
                              className="btn btn-outline-primary"
                              onClick={() => setShowWithdrawModal(true)}
                            >
                              Withdraw
                            </button>
                          </div>
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

      {/* Deposit Modal */}
      <TransactionModal
        show={showDepositModal}
        onHide={() => setShowDepositModal(false)}
        title="Supply to Lending Pool"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">USDC</span>
          </div>
          <div className="form-text">
            Available: 1,000.00 USDC
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">APY</span>
            <span style={{ fontWeight: 600 }}>5.2%</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Estimated earnings (yearly)</span>
            <span style={{ fontWeight: 600 }}>
              {depositAmount ? (parseFloat(depositAmount) * 0.052).toFixed(2) : '0.00'} USDC
            </span>
          </div>
        </div>

        <button 
          className="btn btn-primary w-100 btn-lg"
          onClick={handleDeposit}
          disabled={loading || !depositAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Supply'}
        </button>
      </TransactionModal>

      {/* Withdraw Modal */}
      <TransactionModal
        show={showWithdrawModal}
        onHide={() => setShowWithdrawModal(false)}
        title="Withdraw from Lending Pool"
      >
        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }}>Amount</label>
          <div className="input-group input-group-lg">
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-group-text">USDC</span>
          </div>
          <div className="form-text">
            Deposited: {userDeposit} USDC
          </div>
        </div>

        <div className="mb-4">
          <div className="alert alert-info" role="alert" style={{ fontSize: '0.875rem' }}>
            You can withdraw your supplied assets at any time, subject to available liquidity in the pool.
          </div>
        </div>

        <button 
          className="btn btn-primary w-100 btn-lg"
          onClick={handleWithdraw}
          disabled={loading || !withdrawAmount}
          style={{ fontWeight: 500 }}
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </TransactionModal>
    </div>
  );
}
