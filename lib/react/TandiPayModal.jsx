import React, { useState, useEffect } from 'react';
import { useTandiPay } from './useTandiPay';

export const TandiPayModal = ({ 
  isOpen, 
  onClose, 
  paymentOptions,
  onSuccess,
  onError,
  title = "Complete Payment",
  size = "medium"
}) => {
  const { initializePayment, verifyPayment } = useTandiPay();
  const [paymentLink, setPaymentLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState(null);

  useEffect(() => {
    if (isOpen && !paymentLink) {
      initializePaymentModal();
    }
  }, [isOpen]);

  const initializePaymentModal = async () => {
    setLoading(true);
    try {
      const result = await initializePayment({
        ...paymentOptions,
        modal: true,
        autoRedirect: false
      });
      setPaymentLink(result.paymentLink);
      setReference(result.reference);
    } catch (error) {
      if (onError) onError(error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleIframeLoad = () => {
    // Listen for payment completion messages
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'payment_completed' && event.data.reference === reference) {
        try {
          const verification = await verifyPayment(reference);
          if (verification.success && onSuccess) {
            onSuccess(verification);
          }
          onClose();
        } catch (error) {
          if (onError) onError(error);
        }
      }
    });
  };

  const modalSizes = {
    small: { width: '500px', height: '600px' },
    medium: { width: '700px', height: '700px' },
    large: { width: '900px', height: '800px' },
    full: { width: '95%', height: '95%' }
  };

  const selectedSize = modalSizes[size] || modalSizes.medium;

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, ...selectedSize }}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>
        <div style={styles.body}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Initializing payment...</p>
            </div>
          ) : (
            <iframe
              src={paymentLink}
              style={styles.iframe}
              title="TandiPay Payment"
              onLoad={handleIframeLoad}
              allow="payment"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px'
  },
  body: {
    flex: 1,
    overflow: 'auto'
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #4F46E5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

// Add keyframes to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}