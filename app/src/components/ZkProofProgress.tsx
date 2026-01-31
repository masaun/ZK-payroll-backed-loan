import React from 'react';

interface ZkProofProgressProps {
  stage: string;
  progress: number;
  show: boolean;
}

export const ZkProofProgress: React.FC<ZkProofProgressProps> = ({ stage, progress, show }) => {
  if (!show) return null;

  return (
    <div className="mb-4">
      <div className="alert alert-info" role="alert">
        <div className="d-flex align-items-center mb-2">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <strong>Generating ZK Proof</strong>
        </div>
        
        <div className="mb-2">
          <small className="text-muted">{stage}</small>
        </div>
        
        <div className="progress" style={{ height: '8px' }}>
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        
        <div className="mt-2">
          <small className="text-muted">{Math.round(progress)}% complete</small>
        </div>
      </div>
    </div>
  );
};
