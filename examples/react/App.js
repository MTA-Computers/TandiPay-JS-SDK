import React, { useState } from 'react';
import { TandiPayProvider, TandiPayButton, TandiPayModal } from '../../src/react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const paymentConfig = {
    apiKey: 'your-api-key-here',
    environment: 'sandbox',
    business: {
      name: 'My Store',
      description: 'Quality products',
      logo: 'https://example.com/logo.png'
    }
  };

  const paymentOptions = {
    phone: '254712345678',
    amount: 1500,
    customer: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    metadata: {
      orderId: 'ORD-12345',
      items: ['Item 1', 'Item 2']
    }
  };

  const handleSuccess = (result) => {
    console.log('Payment successful:', result);
    setPaymentResult(result);
    alert(`Payment successful! Transaction ID: ${result.transactionId}`);
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message}`);
  };

  return (
    <TandiPayProvider config={paymentConfig}>
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <h1>TandiPay Payment Integration</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h2>Button Mode</h2>
          <TandiPayButton
            paymentOptions={paymentOptions}
            onSuccess={handleSuccess}
            onError={handleError}
            buttonText="Pay Now"
            variant="primary"
            size="large"
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>Modal Mode</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 20px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Open Payment Modal
          </button>
        </div>

        {paymentResult && (
          <div style={{ marginTop: '30px', padding: '20px', background: '#F3F4F6', borderRadius: '8px' }}>
            <h3>Payment Result</h3>
            <pre>{JSON.stringify(paymentResult, null, 2)}</pre>
          </div>
        )}

        <TandiPayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          paymentOptions={paymentOptions}
          onSuccess={handleSuccess}
          onError={handleError}
          title="Complete Your Payment"
          size="medium"
        />
      </div>
    </TandiPayProvider>
  );
}

export default App;