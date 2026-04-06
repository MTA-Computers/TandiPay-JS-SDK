/**
 * TandiPay Browser Global Build
 * Include this file in your HTML for vanilla JS usage
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['axios'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('axios'));
  } else {
    root.TandiPay = factory(root.axios);
  }
}(typeof self !== 'undefined' ? self : this, function(axios) {
  
  // Core class implementation (same as TandiPay.js but with browser enhancements)
  class TandiPay {
    constructor(config) {
      if (!config || !config.apiKey) {
        throw new Error('TandiPay Error: API key is required');
      }

      this.apiKey = config.apiKey;
      this.apiUrl = config.apiUrl || 'https://api.tandipay.com/api';
      this.timeout = config.timeout || 45000;
      this.business = config.business || null;
      this.httpClient = axios.create({
        baseURL: this.apiUrl,
        timeout: this.timeout,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    generateReference(orderId = null) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 90000 + 10000);
      if (orderId) {
        return `TDP_${orderId}_${timestamp}_${random}`;
      }
      return `TDP_${timestamp}_${random}`;
    }

    async initializePayment(options) {
      if (!options.phone) throw new Error('Phone number is required');
      if (!options.amount || options.amount <= 0) throw new Error('Valid amount is required');
      if (!options.customer || !options.customer.name) throw new Error('Customer name is required');

      const reference = options.reference || this.generateReference(options.orderId);

      const paymentData = {
        phone: options.phone.replace(/\D/g, ''),
        amount: parseFloat(options.amount.toFixed(2)),
        reference: reference,
        customer: {
          name: options.customer.name,
          email: options.customer.email || ''
        },
        business: options.business || this.business,
        callback_url: options.returnUrl || options.callback_url,
        metadata: options.metadata || {}
      };

      try {
        const response = await this.httpClient.post('/payment/initialize', paymentData);

        if (response.data && response.data.success) {
          const result = {
            success: true,
            paymentLink: response.data.data.payment_link,
            reference: response.data.data.reference || reference,
            message: 'Payment initialized successfully'
          };

          if (options.autoRedirect !== false && result.paymentLink) {
            window.location.href = result.paymentLink;
          }

          return result;
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
      if (!reference) throw new Error('Transaction reference is required');

      try {
        const response = await this.httpClient.get(`/payment/verify/${reference}`);
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

    // Browser helper methods
    renderButton(selector, options) {
      const container = document.querySelector(selector);
      if (!container) throw new Error('Container element not found');

      const button = document.createElement('button');
      button.textContent = options.text || 'Pay Now';
      button.className = options.className || 'tandipay-pay-button';
      button.style.cssText = options.style || `
        background-color: #4F46E5;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
      `;

      button.onclick = async () => {
        button.disabled = true;
        button.textContent = 'Processing...';
        
        try {
          const result = await this.initializePayment(options.paymentOptions);
          if (options.onSuccess) options.onSuccess(result);
        } catch (error) {
          if (options.onError) options.onError(error);
        } finally {
          button.disabled = false;
          button.textContent = options.text || 'Pay Now';
        }
      };

      container.appendChild(button);
      return button;
    }
  }

  // Auto-initialize if data attributes exist
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      const elements = document.querySelectorAll('[data-tandipay-api-key]');
      elements.forEach(element => {
        const apiKey = element.getAttribute('data-tandipay-api-key');
        const amount = element.getAttribute('data-tandipay-amount');
        const phone = element.getAttribute('data-tandipay-phone');
        
        if (apiKey && amount && phone) {
          const tandipay = new TandiPay({ apiKey });
          const customerName = element.getAttribute('data-tandipay-customer-name') || 'Customer';
          
          element.addEventListener('click', async () => {
            try {
              await tandipay.initializePayment({
                phone,
                amount: parseFloat(amount),
                customer: { name: customerName },
                returnUrl: window.location.href
              });
            } catch (error) {
              console.error('TandiPay Error:', error);
            }
          });
        }
      });
    });
  }

  return TandiPay;
}));