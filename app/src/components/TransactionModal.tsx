import React from 'react';

interface TransactionModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  children: React.ReactNode;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  show,
  onHide,
  title,
  children
}) => {
  if (!show) return null;

  return (
    <>
      <div 
        className="modal-backdrop fade show" 
        onClick={onHide}
        style={{ zIndex: 1050 }}
      />
      <div 
        className="modal fade show d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title" style={{ fontWeight: 600 }}>
                {title}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onHide}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
