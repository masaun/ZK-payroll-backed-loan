import React from 'react';

interface PoolCardProps {
  title: string;
  apy: string;
  totalValue: string;
  available?: string;
  utilization?: string;
  onAction?: () => void;
  actionText?: string;
  className?: string;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  title,
  apy,
  totalValue,
  available,
  utilization,
  onAction,
  actionText = 'View',
  className = ''
}) => {
  return (
    <div className={`card h-100 shadow-sm ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="card-title mb-0" style={{ fontWeight: 600 }}>
            {title}
          </h5>
          <span className="badge bg-success fs-6" style={{ fontWeight: 500 }}>
            {apy} APY
          </span>
        </div>
        
        <div className="mb-3">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Value</div>
          <div className="fs-4" style={{ fontWeight: 600 }}>{totalValue}</div>
        </div>

        {available && (
          <div className="mb-2">
            <div className="d-flex justify-content-between">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Available</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{available}</span>
            </div>
          </div>
        )}

        {utilization && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Utilization</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{utilization}</span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: utilization }}
                aria-valuenow={parseFloat(utilization)} 
                aria-valuemin={0} 
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {onAction && (
          <button 
            className="btn btn-primary w-100 mt-2" 
            onClick={onAction}
            style={{ fontWeight: 500 }}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
