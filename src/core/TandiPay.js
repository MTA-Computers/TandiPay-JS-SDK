import HttpClient from './httpClient';
import { validatePhone, validateAmount, validateCustomer } from './validator';
import { generateReference, extractOrderId } from './reference';

/**
 * TandiPay Payment Gateway SDK - Core Class
 * @version 2.1.0
 */
class TandiPay {
  constructor(config = {}) {
    if (!config || !config.apiKey) {
      throw new Error('TandiPay Error: API key is required. Get your API key from https://tandipay.com');
    }

    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.tandipay.com/api';
    this.timeout = config.timeout || 45000;
    this.environment = config.environment || 'production';
    this.business = config.business || null;
    this.webhookSecret = config.webhookSecret || null;
    
    // Initialize HTTP client
    this.httpClient = new HttpClient({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'X-API-Key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Browser detection
    this.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    this.isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
    
    // Popup management
    this.popupWindow = null;
    this.popupInterval = null;
  }

  /**
   * Initialize a payment
   * @param {Object} options - Payment options
   * @returns {Promise<Object>}
   */
  async initializePayment(options = {}) {
    // Validate required fields
    if (!options.phone) {
      throw new Error('Phone number is required');
    }
    if (!validatePhone(options.phone)) {
      throw new Error('Invalid phone number format. Must be 9-15 digits');
    }
    if (!validateAmount(options.amount)) {
      throw new Error('Valid amount greater than 0 is required');
    }
    if (!validateCustomer(options.customer)) {
      throw new Error('Customer name is required');
    }
    if (!options.returnUrl && !options.callback_url && !options.popup && !options.modal) {
      throw new Error('Return URL, callback URL, popup, or modal mode is required');
    }

    // Generate reference if not provided
    const reference = options.reference || generateReference(options.orderId);

    // Prepare payment data
    const paymentData = {
      phone: options.phone.replace(/\D/g, ''),
      amount: parseFloat(options.amount.toFixed(2)),
      reference: reference,
      currency: options.currency || 'TZS',
      customer: {
        name: options.customer.name,
        email: options.customer.email || '',
        phone: options.customer.phone || options.phone
      },
      business: options.business || this.business,
      callback_url: options.returnUrl || options.callback_url,
      metadata: {
        ...options.metadata,
        sdk_version: '2.1.0',
        environment: this.environment
      },
      expires_in: options.expiresIn || 3600 // 1 hour default
    };

    try {
      const response = await this.httpClient.post('/payment/initialize', paymentData);

      if (response.data && response.data.success) {
        const result = {
          success: true,
          paymentLink: response.data.data.payment_link,
          reference: response.data.data.reference || reference,
          transactionId: response.data.data.transaction_id,
          message: 'Payment initialized successfully',
          expiresAt: response.data.data.expires_at
        };

        // Handle different payment modes
        if (this.isBrowser || this.isReactNative) {
          await this.handlePaymentMode(result, options);
        }

        return result;
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle different payment modes (popup, modal, redirect)
   */
  async handlePaymentMode(paymentResult, options) {
    if (options.popup) {
      this.openPaymentPopup(paymentResult.paymentLink, options.popupConfig);
    } else if (options.modal) {
      this.openPaymentModal(paymentResult.paymentLink, options.modalConfig);
    } else if (options.autoRedirect) {
      window.location.href = paymentResult.paymentLink;
    } else if (options.returnUrl) {
      // Will redirect after payment completion
      return paymentResult;
    }
  }

  /**
   * Open payment in popup window
   */
  openPaymentPopup(paymentLink, config = {}) {
    if (!this.isBrowser) return null;

    const width = config.width || 600;
    const height = config.height || 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popupConfig = `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,directories=no,status=no,menubar=no,scrollbars=yes`;
    
    this.popupWindow = window.open(paymentLink, 'TandiPayPayment', popupConfig);
    
    if (config.monitorClosure !== false) {
      this.monitorPopupClosure(config.onClose, config.onComplete);
    }
    
    return this.popupWindow;
  }

  /**
   * Monitor popup window closure
   */
  monitorPopupClosure(onClose, onComplete) {
    if (this.popupInterval) clearInterval(this.popupInterval);
    
    this.popupInterval = setInterval(async () => {
      if (this.popupWindow && this.popupWindow.closed) {
        clearInterval(this.popupInterval);
        this.popupInterval = null;
        
        if (onClose && typeof onClose === 'function') {
          await onClose();
        }
        
        if (onComplete && typeof onComplete === 'function') {
          await onComplete();
        }
      }
    }, 500);
  }

  /**
   * Open payment in modal (iframe)
   */
  openPaymentModal(paymentLink, config = {}) {
    if (!this.isBrowser) return;
    
    const modalHtml = `
      <div id="tandipay-modal-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;">
        <div id="tandipay-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:${config.width || '90%'};max-width:${config.maxWidth || '600px'};height:${config.height || '80%'};background:white;border-radius:8px;z-index:99999;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="padding:16px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;">${config.title || 'Complete Payment'}</h3>
            <button id="tandipay-modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
          </div>
          <iframe src="${paymentLink}" style="width:100%;height:calc(100% - 60px);border:none;"></iframe>
        </div>
      </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv);
    
    const closeBtn = document.getElementById('tandipay-modal-close');
    const overlay = document.getElementById('tandipay-modal-overlay');
    
    const closeModal = () => {
      modalDiv.remove();
      if (config.onClose) config.onClose();
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  }

  /**
   * Verify payment status
   * @param {string} reference - Transaction reference
   * @returns {Promise<Object>}
   */
  async verifyPayment(reference) {
    if (!reference) {
      throw new Error('Transaction reference is required');
    }

    try {
      const response = await this.httpClient.get(`/payment/verify/${reference}`);

      return {
        success: true,
        status: response.data.status,
        reference: reference,
        transactionId: response.data.transaction_id,
        amount: response.data.amount,
        currency: response.data.currency,
        paidAt: response.data.paid_at,
        customer: response.data.customer,
        paymentMethod: response.data.payment_method,
        metadata: response.data.metadata
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check if payment is successful
   * @param {string} reference - Transaction reference
   * @returns {Promise<boolean>}
   */
  async isPaymentSuccessful(reference) {
    const payment = await this.verifyPayment(reference);
    const successfulStatuses = ['successful', 'completed', 'paid', 'approved'];
    return successfulStatuses.includes(payment.status?.toLowerCase());
  }

  /**
   * Wait for payment completion (polling)
   * @param {string} reference - Transaction reference
   * @param {Object} options - Polling options
   * @returns {Promise<Object>}
   */
  async waitForPayment(reference, options = {}) {
    const maxAttempts = options.maxAttempts || 30;
    const interval = options.interval || 2000;
    let attempts = 0;

    return new Promise(async (resolve, reject) => {
      const checkPayment = async () => {
        try {
          const payment = await this.verifyPayment(reference);
          
          if (payment.status === 'successful' || payment.status === 'completed') {
            resolve(payment);
          } else if (payment.status === 'failed' || payment.status === 'cancelled') {
            reject(new Error(`Payment ${payment.status}`));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Payment verification timeout'));
          } else {
            attempts++;
            setTimeout(checkPayment, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkPayment();
    });
  }

  /**
   * Request a refund
   * @param {string} transactionId - Transaction ID
   * @param {number} amount - Refund amount (optional)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>}
   */
  async requestRefund(transactionId, amount = null, reason = '') {
    if (!transactionId) {
      throw new Error('Transaction ID is required for refund');
    }

    const refundData = {
      transaction_id: transactionId,
      reason: reason || 'Customer request'
    };

    if (amount && amount > 0) {
      refundData.amount = parseFloat(amount.toFixed(2));
    }

    try {
      const response = await this.httpClient.post('/payment/refund', refundData);

      return {
        success: true,
        refundId: response.data.refund_id,
        transactionId: transactionId,
        amount: response.data.amount,
        status: response.data.status,
        message: 'Refund processed successfully',
        processedAt: response.data.processed_at
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>}
   */
  async getTransaction(transactionId) {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    try {
      const response = await this.httpClient.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List transactions with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>}
   */
  async listTransactions(filters = {}) {
    try {
      const response = await this.httpClient.get('/transactions', { params: filters });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle webhook callback
   * @param {string|Buffer} rawBody - Raw webhook body
   * @param {Object} headers - Request headers
   * @returns {Object}
   */
  handleWebhook(rawBody, headers = {}) {
    let data;
    
    try {
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
      data = JSON.parse(bodyString);
    } catch (error) {
      throw new Error('Invalid webhook payload: Unable to parse JSON');
    }

    // Verify webhook signature if secret is provided
    if (this.webhookSecret && headers['x-webhook-signature']) {
      const isValid = this.verifyWebhookSignature(bodyString, headers['x-webhook-signature']);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    if (!data.reference) {
      throw new Error('Invalid webhook data: Reference is required');
    }

    if (!data.status) {
      throw new Error('Invalid webhook data: Status is required');
    }

    return {
      event: data.event || 'payment.completed',
      reference: data.reference,
      status: data.status,
      transactionId: data.transactionID || data.transaction_id,
      amount: data.amount,
      currency: data.currency,
      phone: data.phone,
      customer: data.customer,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata || {},
      raw: data
    };
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Signature from headers
   * @returns {boolean}
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) return true;
    
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate payment QR code
   * @param {string} reference - Transaction reference
   * @returns {Promise<string>} - QR code as base64
   */
  async generateQRCode(reference) {
    if (!reference) {
      throw new Error('Transaction reference is required');
    }

    try {
      const response = await this.httpClient.get(`/payment/qr/${reference}`);
      return response.data.qr_code;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || `API Error: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error: Unable to connect to TandiPay API');
    } else {
      // Something else happened
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.popupInterval) {
      clearInterval(this.popupInterval);
      this.popupInterval = null;
    }
    
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
      this.popupWindow = null;
    }
  }
}

export default TandiPay;