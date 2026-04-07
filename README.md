# TandiPay Payment Gateway SDK

[![npm version](https://img.shields.io/npm/v/tandipay-sdk.svg)](https://www.npmjs.com/package/tandipay-sdk)
[![license](https://img.shields.io/npm/l/tandipay-sdk.svg)](https://github.com/yourusername/tandipay-sdk/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/tandipay-sdk.svg)](https://www.npmjs.com/package/tandipay-sdk)

Official TandiPay Payment Gateway SDK for Node.js, React, Vue, React Native, and Vanilla JavaScript. Accept mobile money payments seamlessly across all platforms.

## Features

- **Cross-Platform** - Works with Node.js, React, Vue, React Native, and Vanilla JS
- **Multiple Payment Methods** - Mobile Money and Bank Transfers
- **Secure** - Built-in webhook signature verification and secure token handling
- **Mobile Ready** - Deep linking, in-app browser support for React Native
- **Customizable** - Popup, Modal, Redirect, and Iframe payment modes
- **Lightweight** - Optimized bundle size with tree-shaking support
- **Recurring Payments** - Support for subscriptions and recurring billing
- **Analytics** - Transaction tracking and reporting
- **TypeScript Ready** - Full TypeScript definitions included

## Requirements

### For Node.js / Backend
- Node.js >= 14.0.0
- npm or yarn package manager
- Axios (automatically installed with SDK)

### For React / Next.js
- React >= 16.8.0 (for Hooks support)
- Next.js >= 12.0.0 (optional)

### For Vue.js
- Vue >= 3.0.0 (for Composition API)
- Vue CLI or Vite (recommended)

### For React Native
- React Native >= 0.64.0
- react-native-inappbrowser-reborn (for in-app browser)
- @react-native-async-storage/async-storage (for caching)

### For Vanilla JavaScript
- Modern web browser (Chrome, Firefox, Safari, Edge)
- ES6 support required

### General Requirements
- Valid TandiPay API Key (Get from [https://tandipay.com](https://tandipay.com))
- SSL/HTTPS for production environments
- Webhook endpoint URL (for payment notifications)

## Installation

### Node.js / Backend

```bash
# Using npm
npm install tandipay-sdk

# Using yarn
yarn add tandipay-sdk

# Using pnpm
pnpm add tandipay-sdk
```

### React / Next.js

```bash
# Using npm
npm install tandipay-sdk axios

# Using yarn
yarn add tandipay-sdk axios

# Using pnpm
pnpm add tandipay-sdk axios
```

### Vue.js 3

```bash
# Using npm
npm install tandipay-sdk axios

# Using yarn
yarn add tandipay-sdk axios

# Using pnpm
pnpm add tandipay-sdk axios
```

### React Native

```bash
# Using npm
npm install tandipay-sdk axios react-native-inappbrowser-reborn @react-native-async-storage/async-storage

# Using yarn
yarn add tandipay-sdk axios react-native-inappbrowser-reborn @react-native-async-storage/async-storage

# iOS only - install pods
cd ios && pod install
```

### Vanilla JavaScript (CDN)

```html
<!-- Include Axios first -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- Include TandiPay SDK -->
<script src="https://cdn.jsdelivr.net/npm/tandipay-sdk/dist/index.umd.js"></script>

<!-- Or download and host locally -->
<script src="/path/to/tandipay-sdk/dist/index.umd.js"></script>
```

## Quick Start Examples

### 1. Node.js (Express)

```javascript
const express = require('express');
const TandiPay = require('tandipay-sdk');

const app = express();
app.use(express.json());

// Initialize TandiPay
const tandipay = new TandiPay({
  apiKey: process.env.TANDIPAY_API_KEY,
  environment: 'production', // or 'sandbox' for testing
  timeout: 30000,
  business: {
    name: 'My Online Store',
    description: 'Quality products',
    logo: 'https://example.com/logo.png'
  }
});

// Create payment endpoint
app.post('/api/create-payment', async (req, res) => {
  try {
    const { phone, amount, customerName, customerEmail } = req.body;
    
    const payment = await tandipay.initializePayment({
      phone: phone,
      amount: amount,
      customer: {
        name: customerName,
        email: customerEmail
      },
      returnUrl: 'https://yourdomain.com/payment-callback',
      metadata: {
        orderId: 'ORD-' + Date.now(),
        productId: req.body.productId
      }
    });
    
    res.json({
      success: true,
      paymentLink: payment.paymentLink,
      reference: payment.reference
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook endpoint for payment notifications
app.post('/api/webhook/tandipay', async (req, res) => {
  try {
    const webhookData = tandipay.handleWebhook(
      JSON.stringify(req.body),
      req.headers
    );
    
    console.log('Payment webhook received:', webhookData);
    
    // Update order status in your database
    if (webhookData.status === 'successful') {
      await updateOrderStatus(webhookData.reference, 'paid');
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify payment endpoint
app.get('/api/verify-payment/:reference', async (req, res) => {
  try {
    const payment = await tandipay.verifyPayment(req.params.reference);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. React / Next.js

#### Using Hooks

```jsx
// App.jsx
import React, { useState } from 'react';
import { TandiPayProvider, useTandiPay, TandiPayButton, TandiPayModal } from 'tandipay-sdk/react';

// Payment component with hooks
function PaymentForm() {
  const { initializePayment, verifyPayment, loading, error } = useTandiPay();
  const [paymentResult, setPaymentResult] = useState(null);

  const handleDirectPayment = async () => {
    try {
      const result = await initializePayment({
        phone: '256712345678',
        amount: 1500,
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        returnUrl: window.location.href,
        metadata: { orderId: 'ORD-12345' }
      });
      
      // Open payment popup
      window.open(result.paymentLink, '_blank');
      
      // Poll for payment status
      const interval = setInterval(async () => {
        const verification = await verifyPayment(result.reference);
        if (verification.status === 'successful') {
          clearInterval(interval);
          setPaymentResult(verification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDirectPayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {paymentResult && (
        <div>
          <h3>Payment Successful!</h3>
          <p>Transaction ID: {paymentResult.transactionId}</p>
          <p>Amount: {paymentResult.amount} UGX</p>
        </div>
      )}
    </div>
  );
}

// Using pre-built components
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const paymentOptions = {
    phone: '256712345678',
    amount: 2500,
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    metadata: { cartId: 'CART-789' }
  };
  
  const handleSuccess = (result) => {
    console.log('Payment success:', result);
    // Redirect to success page or update UI
  };
  
  const handleError = (error) => {
    console.error('Payment error:', error);
  };
  
  return (
    <TandiPayProvider config={{ 
      apiKey: process.env.REACT_APP_TANDIPAY_API_KEY,
      environment: 'production'
    }}>
      <div style={{ padding: '40px' }}>
        <h1>Checkout</h1>
        
        {/* Button Component */}
        <TandiPayButton
          paymentOptions={paymentOptions}
          onSuccess={handleSuccess}
          onError={handleError}
          buttonText="Pay with TandiPay"
          variant="primary"
          size="large"
        />
        
        {/* Or use Modal */}
        <button onClick={() => setIsModalOpen(true)}>
          Open Payment Modal
        </button>
        
        <TandiPayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          paymentOptions={paymentOptions}
          onSuccess={handleSuccess}
          onError={handleError}
          title="Complete Your Payment"
          size="medium"
        />
        
        {/* Custom payment form */}
        <PaymentForm />
      </div>
    </TandiPayProvider>
  );
}

export default App;
```

#### Next.js API Route

```javascript
// pages/api/tandipay/create-payment.js
import TandiPay from 'tandipay-sdk';

const tandipay = new TandiPay({
  apiKey: process.env.TANDIPAY_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { phone, amount, customerName, customerEmail, orderId } = req.body;
    
    const payment = await tandipay.initializePayment({
      phone,
      amount,
      customer: {
        name: customerName,
        email: customerEmail
      },
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tandipay/webhook`,
      metadata: { orderId }
    });
    
    res.status(200).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

### 3. Vue.js 3

#### Using Composition API

```vue
<!-- PaymentComponent.vue -->
<template>
  <div class="payment-container">
    <h2>Complete Payment</h2>
    
    <form @submit.prevent="processPayment">
      <div class="form-group">
        <label>Phone Number</label>
        <input v-model="form.phone" type="tel" required />
      </div>
      
      <div class="form-group">
        <label>Amount (UGX)</label>
        <input v-model.number="form.amount" type="number" required />
      </div>
      
      <div class="form-group">
        <label>Customer Name</label>
        <input v-model="form.customerName" type="text" required />
      </div>
      
      <div class="form-group">
        <label>Customer Email</label>
        <input v-model="form.customerEmail" type="email" />
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Processing...' : 'Pay Now' }}
      </button>
    </form>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="result" class="success">
      <h3>Payment Successful!</h3>
      <p>Transaction ID: {{ result.transactionId }}</p>
      <p>Amount: {{ result.amount }} UGX</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useTandiPay } from 'tandipay-sdk/vue';

const { initializePayment, verifyPayment, loading, error } = useTandiPay();

const form = reactive({
  phone: '256712345678',
  amount: 1000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com'
});

const result = ref(null);

const processPayment = async () => {
  try {
    const payment = await initializePayment({
      phone: form.phone,
      amount: form.amount,
      customer: {
        name: form.customerName,
        email: form.customerEmail
      },
      popup: true, // Open in popup
      autoRedirect: false,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
    // Monitor popup closure
    const popupInterval = setInterval(async () => {
      if (window.tandipayPopup && window.tandipayPopup.closed) {
        clearInterval(popupInterval);
        
        const verification = await verifyPayment(payment.reference);
        if (verification.status === 'successful') {
          result.value = verification;
        }
      }
    }, 2000);
    
  } catch (err) {
    console.error('Payment error:', err);
  }
};
</script>

<style scoped>
.payment-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
}

.success {
  margin-top: 20px;
  padding: 15px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}
</style>
```

#### Using Pre-built Components

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <h1>TandiPay Vue Integration</h1>
    
    <!-- Pre-built Button Component -->
    <TandiPayButton
      :payment-options="paymentOptions"
      @success="handleSuccess"
      @error="handleError"
      button-text="Pay with TandiPay"
      variant="primary"
      size="large"
    />
    
    <!-- Modal Component -->
    <button @click="openModal">Open Payment Modal</button>
    
    <TandiPayModal
      v-model:is-open="modalOpen"
      :payment-options="paymentOptions"
      @success="handleSuccess"
      @error="handleError"
      title="Complete Payment"
      size="medium"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { TandiPayButton, TandiPayModal } from 'tandipay-sdk/vue';

const modalOpen = ref(false);
const paymentOptions = {
  phone: '256712345678',
  amount: 1500,
  customer: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  },
  metadata: {
    orderId: 'ORD-12345'
  }
};

const handleSuccess = (result) => {
  console.log('Payment successful:', result);
  // Update order status, show success message, etc.
};

const handleError = (error) => {
  console.error('Payment failed:', error);
  // Show error message to user
};

const openModal = () => {
  modalOpen.value = true;
};
</script>
```

### 4. React Native

```jsx
// App.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import TandiPay from 'tandipay-sdk';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const App = () => {
  const [tandipay, setTandiPay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phone: '256712345678',
    amount: '1000',
    customerName: 'John Doe',
    customerEmail: 'john@example.com'
  });

  useEffect(() => {
    // Initialize TandiPay
    const client = new TandiPay({
      apiKey: 'your-api-key-here',
      environment: 'sandbox'
    });
    setTandiPay(client);
  }, []);

  const handlePayment = async () => {
    if (!tandipay) return;
    
    setLoading(true);
    try {
      // Initialize payment
      const payment = await tandipay.initializePayment({
        phone: form.phone,
        amount: parseFloat(form.amount),
        customer: {
          name: form.customerName,
          email: form.customerEmail
        },
        callback_url: 'yourapp://payment-callback',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      // Open in-app browser
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(payment.paymentLink, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#4F46E5',
          preferredControlTintColor: '#FFFFFF',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen'
        });
        
        if (result.type === 'cancel') {
          Alert.alert('Payment Cancelled', 'You cancelled the payment process');
        } else {
          // Verify payment
          const verification = await tandipay.verifyPayment(payment.reference);
          if (verification.status === 'successful') {
            Alert.alert(
              'Payment Successful',
              `Transaction ID: ${verification.transactionId}\nAmount: ${verification.amount} UGX`
            );
          }
        }
      } else {
        // Fallback to Linking
        Linking.openURL(payment.paymentLink);
      }
      
    } catch (error) {
      Alert.alert('Payment Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TandiPay Payment</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(text) => setForm({...form, phone: text})}
          placeholder="256712345678"
          keyboardType="phone-pad"
        />
        
        <Text style={styles.label}>Amount (UGX)</Text>
        <TextInput
          style={styles.input}
          value={form.amount}
          onChangeText={(text) => setForm({...form, amount: text})}
          placeholder="1000"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={form.customerName}
          onChangeText={(text) => setForm({...form, customerName: text})}
          placeholder="John Doe"
        />
        
        <Text style={styles.label}>Customer Email</Text>
        <TextInput
          style={styles.input}
          value={form.customerEmail}
          onChangeText={(text) => setForm({...form, customerEmail: text})}
          placeholder="john@example.com"
          keyboardType="email-address"
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default App;
```

### 5. Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TandiPay Payment Integration</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }
        
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        
        .result.show {
            display: block;
        }
        
        .result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-text {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 TandiPay Payment</h1>
        <p class="subtitle">Secure Mobile Money Payments</p>
        
        <form id="paymentForm">
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="phone" placeholder="256712345678" required>
            </div>
            
            <div class="form-group">
                <label>Amount (UGX) *</label>
                <input type="number" id="amount" placeholder="1000" required>
            </div>
            
            <div class="form-group">
                <label>Customer Name *</label>
                <input type="text" id="customerName" placeholder="John Doe" required>
            </div>
            
            <div class="form-group">
                <label>Customer Email</label>
                <input type="email" id="customerEmail" placeholder="john@example.com">
            </div>
            
            <div class="form-group">
                <label>Payment Mode</label>
                <select id="paymentMode">
                    <option value="popup">Popup Window</option>
                    <option value="redirect">Redirect to Page</option>
                    <option value="modal">Modal (Iframe)</option>
                </select>
            </div>
            
            <button type="submit" id="payButton">
                Pay Now
            </button>
        </form>
        
        <div id="result" class="result"></div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tandipay-sdk/dist/index.umd.js"></script>
    
    <script>
        // Initialize TandiPay
        const tandipay = new TandiPay({
            apiKey: 'your-api-key-here',
            environment: 'sandbox',
            business: {
                name: 'My Online Store',
                description: 'Quality products at affordable prices',
                logo: 'https://example.com/logo.png'
            }
        });
        
        const form = document.getElementById('paymentForm');
        const payButton = document.getElementById('payButton');
        const resultDiv = document.getElementById('result');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const phone = document.getElementById('phone').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const customerName = document.getElementById('customerName').value;
            const customerEmail = document.getElementById('customerEmail').value;
            const paymentMode = document.getElementById('paymentMode').value;
            
            // Validate inputs
            if (!phone || !amount || !customerName) {
                showResult('Please fill in all required fields', 'error');
                return;
            }
            
            // Disable button and show loading
            payButton.disabled = true;
            payButton.innerHTML = '<div class="loading-text"><div class="spinner"></div>Processing...</div>';
            
            try {
                // Initialize payment
                const payment = await tandipay.initializePayment({
                    phone: phone,
                    amount: amount,
                    customer: {
                        name: customerName,
                        email: customerEmail
                    },
                    returnUrl: window.location.href,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    }
                });
                
                // Handle based on payment mode
                if (paymentMode === 'redirect') {
                    // Redirect to payment page
                    window.location.href = payment.paymentLink;
                } else if (paymentMode === 'popup') {
                    // Open popup window
                    const popup = window.open(payment.paymentLink, 'TandiPayPayment', 'width=600,height=700,center=yes');
                    
                    // Monitor popup closure
                    const checkInterval = setInterval(async () => {
                        if (popup && popup.closed) {
                            clearInterval(checkInterval);
                            
                            try {
                                const verification = await tandipay.verifyPayment(payment.reference);
                                if (verification.status === 'successful') {
                                    showResult(`
                                        <strong>Payment Successful!</strong><br>
                                        Transaction ID: ${verification.transactionId}<br>
                                        Amount: ${verification.amount} UGX<br>
                                        Customer: ${verification.customer?.name}
                                    `, 'success');
                                } else {
                                    showResult('Payment was not completed successfully', 'error');
                                }
                            } catch (error) {
                                showResult(error.message, 'error');
                            }
                        }
                    }, 1000);
                    
                } else if (paymentMode === 'modal') {
                    // Create modal
                    const modalHtml = `
                        <div id="tandipay-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;">
                            <div style="position:relative;width:90%;max-width:600px;margin:50px auto;background:white;border-radius:12px;overflow:hidden;">
                                <div style="padding:15px;background:#f5f5f5;display:flex;justify-content:space-between;">
                                    <h3>Complete Payment</h3>
                                    <button id="closeModal" style="background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
                                </div>
                                <iframe src="${payment.paymentLink}" style="width:100%;height:600px;border:none;"></iframe>
                            </div>
                        </div>
                    `;
                    
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                    
                    document.getElementById('closeModal').onclick = () => {
                        document.getElementById('tandipay-modal').remove();
                    };
                    
                    // Listen for payment completion messages
                    window.addEventListener('message', async (event) => {
                        if (event.data.type === 'payment_completed') {
                            document.getElementById('tandipay-modal')?.remove();
                            
                            const verification = await tandipay.verifyPayment(payment.reference);
                            if (verification.status === 'successful') {
                                showResult(`
                                    <strong>Payment Successful!</strong><br>
                                    Transaction ID: ${verification.transactionId}<br>
                                    Amount: ${verification.amount} UGX
                                `, 'success');
                            }
                        }
                    });
                }
                
                // Show success message for non-redirect modes
                if (paymentMode !== 'redirect') {
                    showResult('Payment initiated! Please complete the payment process.', 'success');
                }
                
            } catch (error) {
                console.error('Payment error:', error);
                showResult(error.message, 'error');
            } finally {
                // Reset button
                payButton.disabled = false;
                payButton.innerHTML = 'Pay Now';
            }
        });
        
        function showResult(message, type) {
            resultDiv.innerHTML = message;
            resultDiv.className = `result ${type} show`;
            
            // Auto hide after 10 seconds
            setTimeout(() => {
                resultDiv.classList.remove('show');
            }, 10000);
        }
        
        // Example: Generate reference
        console.log('Generated reference:', tandipay.generateReference('ORDER123'));
        
        // Example: Check if payment is successful
        async function checkPaymentStatus(reference) {
            const isSuccessful = await tandipay.isPaymentSuccessful(reference);
            console.log('Payment successful:', isSuccessful);
        }
    </script>
</body>
</html>
```

## Advanced Examples

### Recurring Payments / Subscriptions

```javascript
// Node.js - Setup recurring billing
const TandiPay = require('tandipay-sdk');

const tandipay = new TandiPay({
  apiKey: process.env.TANDIPAY_API_KEY
});

// Create subscription
async function createSubscription(customerId, planDetails) {
  const subscription = await tandipay.createSubscription({
    customer_id: customerId,
    amount: 50000, // Monthly amount
    currency: 'UGX',
    frequency: 'monthly',
    start_date: new Date(),
    plan_name: 'Premium Plan',
    metadata: {
      features: ['feature1', 'feature2']
    }
  });
  
  return subscription;
}

// Process recurring payment
async function processRecurringPayment(subscriptionId) {
  const payment = await tandipay.processRecurringPayment({
    subscription_id: subscriptionId,
    amount: 50000,
    reference: `SUB_${subscriptionId}_${Date.now()}`
  });
  
  return payment;
}
```

### Bulk Payments

```javascript
// Process multiple payments at once
const payments = [
  {
    phone: '256712345678',
    amount: 1000,
    customer: { name: 'John Doe' }
  },
  {
    phone: '256798765432',
    amount: 2000,
    customer: { name: 'Jane Smith' }
  }
];

const bulkResult = await tandipay.bulkPayments(payments, {
  concurrency: 5, // Process 5 at a time
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
});

console.log(`Successful: ${bulkResult.successful}, Failed: ${bulkResult.failed}`);
```

### Payment Webhook Handler (Express)

```javascript
app.post('/webhook/tandipay', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  try {
    const event = tandipay.handleWebhook(req.body, {
      'x-webhook-signature': signature
    });
    
    switch (event.event) {
      case 'payment.completed':
        await handleSuccessfulPayment(event);
        break;
      case 'payment.failed':
        await handleFailedPayment(event);
        break;
      case 'payment.refunded':
        await handleRefundedPayment(event);
        break;
      default:
        console.log('Unhandled event:', event.event);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});
```

## API Reference

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| apiKey | string | Yes | - | Your TandiPay API key |
| apiUrl | string | No | https://api.tandipay.com/api | API endpoint URL |
| timeout | number | No | 45000 | Request timeout in milliseconds |
| environment | string | No | production | 'sandbox' or 'production' |
| business | object | No | null | Default business details |
| webhookSecret | string | No | null | Secret for webhook verification |

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| initializePayment(options) | Initialize a new payment | Promise\<PaymentResult\> |
| verifyPayment(reference) | Verify payment status | Promise\<VerificationResult\> |
| isPaymentSuccessful(reference) | Check if payment is successful | Promise\<boolean\> |
| requestRefund(transactionId, amount, reason) | Request a refund | Promise\<RefundResult\> |
| getTransaction(transactionId) | Get transaction details | Promise\<Transaction\> |
| listTransactions(filters) | List transactions with filters | Promise\<TransactionList\> |
| generateReference(orderId) | Generate unique reference | string |
| handleWebhook(payload, headers) | Parse and verify webhook | WebhookEvent |

### Payment Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| phone | string | Yes | Customer phone number |
| amount | number | Yes | Payment amount |
| customer | object | Yes | Customer information |
| customer.name | string | Yes | Customer full name |
| customer.email | string | No | Customer email |
| reference | string | No | Custom transaction reference |
| returnUrl | string | Yes* | URL to redirect after payment |
| callback_url | string | Yes* | Webhook URL for notifications |
| metadata | object | No | Additional data to store |
| currency | string | No | Currency (default: UGX) |
| expires_in | number | No | Payment expiry in seconds |

*Either returnUrl or callback_url is required

## Error Handling

```javascript
try {
  const payment = await tandipay.initializePayment(options);
} catch (error) {
  if (error.message.includes('Network error')) {
    // Handle network issues
  } else if (error.message.includes('API Error: 401')) {
    // Invalid API key
  } else if (error.message.includes('Invalid phone number')) {
    // Validation error
  } else {
    // Other errors
  }
}
```

## Testing

### Sandbox Environment

Use sandbox environment for testing:

```javascript
const tandipay = new TandiPay({
  apiKey: 'sandbox-api-key',
  environment: 'sandbox'
});
```

### Test Phone Numbers

- Success: `256712345678`
- Failed: `256798765432`
- Pending: `256711223344`

## Best Practices

1. **Security**: Always store API keys in environment variables, never in client-side code
2. **Webhooks**: Implement idempotency handling for webhook endpoints
3. **Validation**: Always validate payment status server-side before fulfilling orders
4. **Timeouts**: Set appropriate timeouts based on your use case
5. **Logging**: Log all payment transactions for auditing
6. **Retry Logic**: Implement retry logic for failed payment verifications

## Support

- 📧 Email: support@tandipay.com
- 🌐 Website: [https://tandipay.com](https://tandipay.com)
- 📚 Documentation: [https://docs.tandipay.com](https://tandipay/apidocs.com)

## License

MIT © [TandiPay](https://tandipay.com)

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

---

**Made with ❤️ by TandiPay Team**
