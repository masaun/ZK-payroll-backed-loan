import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
  variant?: 'primary' | 'success' | 'info' | 'warning';
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subValue, 
  className = '',
  variant = 'primary' 
}) => {
  const variantClass = {
    primary: 'border-primary',
    success: 'border-success',
    info: 'border-info',
    warning: 'border-warning'
  }[variant];

  return (
    <div className={`card ${variantClass} ${className}`} style={{ borderWidth: '2px' }}>
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {title}
        </h6>
        <h3 className="card-title mb-1" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
          {value}
        </h3>
        {subValue && (
          <p className="card-text text-muted mb-0" style={{ fontSize: '0.875rem' }}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};
