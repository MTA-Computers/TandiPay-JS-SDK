import React, { useState } from 'react';
import { useTandiPay } from './useTandiPay';

export const TandiPayButton = ({ 
  paymentOptions, 
  onSuccess, 
  onError,
  onClose,
  buttonText = "Pay Now",
  loadingText = "Processing...",
  className = "",
  style = {},
  disabled = false,
  variant = "primary",
  size = "medium"
}) => {
  const { initializePayment, verifyPayment, loading } = useTandiPay();
  const [localLoading, setLocalLoading] = useState(false);

  const handlePayment = async () => {
    setLocalLoading(true);
    try {
      const result = await initializePayment({
        ...paymentOptions,
        popup: true,
        autoRedirect: false
      });
      
      // Open popup for payment
      window.tandipayPopup = window.open(result.paymentLink, 'TandiPayPayment', 'width=600,height=700,center=yes');
      
      // Monitor popup closure
      const checkPopup = setInterval(async () => {
        if (window.tandipayPopup && window.tandipayPopup.closed) {
          clearInterval(checkPopup);
          
          try {
            const verification = await verifyPayment(result.reference);
            if (verification.success && verification.status === 'successful') {
              if (onSuccess) onSuccess(verification);
            } else {
              if (onError) onError(new Error('Payment was not successful'));
            }
          } catch (error) {
            if (onError) onError(error);
          }
          
          if (onClose) onClose();
        }
      }, 1000);
      
    } catch (error) {
      if (onError) onError(error);
    } finally {
      setLocalLoading(false);
    }
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: '#4F46E5',
        color: 'white',
        border: 'none'
      },
      secondary: {
        backgroundColor: 'white',
        color: '#4F46E5',
        border: '1px solid #4F46E5'
      },
      danger: {
        backgroundColor: '#DC2626',
        color: 'white',
        border: 'none'
      }
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '10px 20px', fontSize: '14px' },
      large: { padding: '14px 28px', fontSize: '16px' }
    };
    return sizes[size] || sizes.medium;
  };

  const buttonStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: '6px',
    cursor: (disabled || loading || localLoading) ? 'not-allowed' : 'pointer',
    opacity: (disabled || loading || localLoading) ? 0.6 : 1,
    transition: 'all 0.3s ease',
    fontWeight: '600',
    ...style
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading || localLoading}
      className={className}
      style={buttonStyles}
    >
      {(loading || localLoading) ? loadingText : buttonText}
    </button>
  );
};