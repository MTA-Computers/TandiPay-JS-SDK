// src/index.js - Simplified working version
const axios = require('axios');

class TandiPay {
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new Error('TandiPay Error: API key is required. Get your API key from https://tandipay.com');
    }

    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.tandipay.com/api';
    this.timeout = config.timeout || 45000;
    this.environment = config.environment || 'production';
    this.business = config.business || null;
  }

  generateReference(orderId = null) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 90000 + 10000);
    if (orderId) {
      const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9]/g, '');
      return `TDP_${cleanOrderId}_${timestamp}_${random}`;
    }
    return `TDP_${timestamp}_${random}`;
  }

  validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 9 && cleanPhone.length <= 15;
  }

  async initializePayment(options) {
    if (!options.phone) {
      throw new Error('Phone number is required');
    }
    if (!this.validatePhone(options.phone)) {
      throw new Error('Invalid phone number format');
    }
    if (!options.amount || options.amount <= 0) {
      throw new Error('Valid amount is required');
    }
    if (!options.customer || !options.customer.name) {
      throw new Error('Customer name is required');
    }
    if (!options.returnUrl && !options.callback_url) {
      throw new Error('Return URL or callback URL is required');
    }

    const reference = options.reference || this.generateReference(options.orderId);

    const paymentData = {
      phone: options.phone.replace(/\D/g, ''),
      amount: parseFloat(options.amount.toFixed(2)),
      reference: reference,
      customer: {
        name: options.customer.name,
        email: options.customer.email || ''
      },
      business: options.business || this.business || {
        name: options.businessName || 'My Business',
        description: options.businessDescription || '',
        logo: options.businessLogo || ''
      },
      callback_url: options.returnUrl || options.callback_url,
      metadata: options.metadata || {}
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/payment/initialize`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: this.timeout
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          paymentLink: response.data.data.payment_link,
          reference: response.data.data.reference || reference,
          message: 'Payment initialized successfully'
        };
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || `API Error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to TandiPay API');
      } else {
        throw error;
      }
    }
  }

  async verifyPayment(reference) {
    if (!reference) {
      throw new Error('Transaction reference is required');
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/payment/verify/${reference}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        status: response.data.status,
        reference: reference,
        transactionId: response.data.transaction_id,
        amount: response.data.amount,
        paidAt: response.data.paid_at,
        customer: response.data.customer
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || `Verification failed: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to verify payment');
      } else {
        throw error;
      }
    }
  }

  async isPaymentSuccessful(reference) {
    const payment = await this.verifyPayment(reference);
    const successfulStatuses = ['successful', 'completed', 'paid'];
    return successfulStatuses.includes(payment.status);
  }

  handleWebhook(rawBody) {
    let data;
    
    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
      data = JSON.parse(bodyString);
    } catch (error) {
      throw new Error('Invalid webhook payload: Unable to parse JSON');
    }

    if (!data.reference) {
      throw new Error('Invalid webhook data: Reference is required');
    }

    if (!data.status) {
      throw new Error('Invalid webhook data: Status is required');
    }

    return {
      reference: data.reference,
      status: data.status,
      transactionId: data.transactionID || data.transaction_id,
      amount: data.amount,
      phone: data.phone,
      customer: data.customer,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata || {}
    };
  }

  extractOrderId(reference) {
    const parts = reference.split('_');
    if (parts.length >= 2 && parts[0] === 'TDP') {
      return parts[1];
    }
    return null;
  }

  async requestRefund(transactionId, amount = null, reason = '') {
    if (!transactionId) {
      throw new Error('Transaction ID is required for refund');
    }

    const refundData = {
      transaction_id: transactionId,
      reason: reason
    };

    if (amount && amount > 0) {
      refundData.amount = parseFloat(amount.toFixed(2));
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/payment/refund`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        transactionId: transactionId,
        amount: response.data.amount,
        status: response.data.status,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || `Refund failed: ${error.response.status}`);
      } else {
        throw new Error(`Refund failed: ${error.message}`);
      }
    }
  }
}

// Export for CommonJS
module.exports = TandiPay;
module.exports.default = TandiPay;
module.exports.TandiPay = TandiPay;