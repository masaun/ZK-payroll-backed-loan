'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { PoolCard } from '@/components/PoolCard';
import { ConnectButton } from '@/components/ConnectButton';
import Link from 'next/link';

interface UserStats {
  totalSupplied: string;
  totalBorrowed: string;
  netAPY: string;
  healthFactor: string;
}

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSupplied: '0.00',
    totalBorrowed: '0.00',
    netAPY: '0.00',
    healthFactor: '∞'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check wallet connection status
    // TODO: Integrate with actual wallet adapter
    const checkConnection = () => {
      // Placeholder - replace with actual wallet check
      setConnected(false);
    };
    checkConnection();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch user's lending and borrowing data from Solana
      // This is placeholder data
      setUserStats({
        totalSupplied: '0.00',
        totalBorrowed: '0.00',
        netAPY: '0.00',
        healthFactor: '∞'
      });
    } catch (error) {
      console.error('Error loading user data:', error);
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
                <h1 className="mb-4" style={{ fontWeight: 700 }}>
                  Welcome to ZK Payroll-Backed Loan
                </h1>
                <p className="lead mb-4 text-muted">
                  Privacy-preserving payroll-backed lending platform
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
            <h1 style={{ fontWeight: 700, fontSize: '2rem' }}>Dashboard</h1>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatsCard 
            title="Total Supplied" 
            value={`$${userStats.totalSupplied}`}
            variant="success"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Total Borrowed" 
            value={`$${userStats.totalBorrowed}`}
            variant="warning"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Net APY" 
            value={`${userStats.netAPY}%`}
            variant="info"
          />
        </div>
        <div className="col-md-3">
          <StatsCard 
            title="Health Factor" 
            value={userStats.healthFactor}
            variant="primary"
          />
        </div>
      </div>

      {/* Your Positions */}
      <div className="row mb-4">
        <div className="col-12">
          <h3 className="mb-3" style={{ fontWeight: 600 }}>Your Positions</h3>
        </div>
      </div>

      {/* Lending Positions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Lending Positions
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
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
                          No lending positions yet.{' '}
                          <Link href="/lend" className="text-decoration-none">
                            Start lending
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Borrowing Positions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0" style={{ fontWeight: 600 }}>
                Borrowing Positions
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Borrowed</th>
                      <th>APY</th>
                      <th>Collateral</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No borrowing positions yet.{' '}
                        <Link href="/borrow" className="text-decoration-none">
                          Start borrowing
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Markets */}
      <div className="row mb-4">
        <div className="col-12">
          <h3 className="mb-3" style={{ fontWeight: 600 }}>Available Markets</h3>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <PoolCard
            title="USDC Lending Pool"
            apy="5.2%"
            totalValue="$1,250,000"
            available="$850,000"
            utilization="32%"
            actionText="Lend USDC"
            onAction={() => window.location.href = '/lend'}
          />
        </div>
        <div className="col-md-6 col-lg-4">
          <PoolCard
            title="SOL Collateral Pool"
            apy="3.8%"
            totalValue="$2,100,000"
            available="$1,500,000"
            utilization="28%"
            actionText="Borrow with SOL"
            onAction={() => window.location.href = '/borrow'}
          />
        </div>
        <div className="col-md-6 col-lg-4">
          <PoolCard
            title="ZK Credentials"
            apy="—"
            totalValue="152 Verified"
            actionText="Manage Credentials"
            onAction={() => window.location.href = '/credential'}
          />
        </div>
      </div>
    </div>
  );
}
