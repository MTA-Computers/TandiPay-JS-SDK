/**
 * Browser Adapter for TandiPay
 * Handles browser-specific functionality
 */

class BrowserAdapter {
  constructor(tandipayInstance) {
    this.tandipay = tandipayInstance;
    this.isBrowser = true;
    this.storage = window.localStorage;
  }

  /**
   * Save payment method for future use
   */
  savePaymentMethod(paymentMethod, userId) {
    const key = `tandipay_payment_method_${userId}`;
    const data = {
      method: paymentMethod,
      savedAt: new Date().toISOString(),
      lastUsed: null
    };
    this.storage.setItem(key, JSON.stringify(data));
    return data;
  }

  /**
   * Get saved payment method
   */
  getSavedPaymentMethod(userId) {
    const key = `tandipay_payment_method_${userId}`;
    const data = this.storage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cache transaction for offline support
   */
  cacheTransaction(transaction) {
    const cacheKey = 'tandipay_pending_transactions';
    let pending = JSON.parse(this.storage.getItem(cacheKey) || '[]');
    pending.push({
      ...transaction,
      cachedAt: new Date().toISOString(),
      synced: false
    });
    this.storage.setItem(cacheKey, JSON.stringify(pending));
  }

  /**
   * Sync cached transactions when online
   */
  async syncCachedTransactions() {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    
    const cacheKey = 'tandipay_pending_transactions';
    let pending = JSON.parse(this.storage.getItem(cacheKey) || '[]');
    const results = { synced: 0, failed: 0 };
    
    for (const transaction of pending) {
      if (transaction.synced) continue;
      
      try {
        const verification = await this.tandipay.verifyPayment(transaction.reference);
        if (verification.success) {
          transaction.synced = true;
          transaction.verifiedAt = new Date().toISOString();
          results.synced++;
        }
      } catch (error) {
        results.failed++;
      }
    }
    
    this.storage.setItem(cacheKey, JSON.stringify(pending));
    return results;
  }

  /**
   * Create payment widget
   */
  createPaymentWidget(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container element not found');
    
    const widgetHtml = `
      <div class="tandipay-widget" style="font-family: Arial, sans-serif;">
        <div class="tandipay-header">
          <h3>${options.title || 'Complete Payment'}</h3>
        </div>
        <div class="tandipay-body">
          <div class="amount-display" style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; color: #4F46E5;">${options.currency || 'TZS'} ${options.amount}</span>
          </div>
          <form id="tandipay-payment-form">
            <div class="form-group" style="margin-bottom: 15px;">
              <label>Phone Number</label>
              <input type="tel" id="phone" required placeholder="e.g., 254712345678" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <label>Customer Name</label>
              <input type="text" id="customerName" required 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
              <label>Email (Optional)</label>
              <input type="email" id="customerEmail" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button type="submit" id="pay-now-btn" 
                    style="width: 100%; padding: 12px; background: #4F46E5; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">
              Pay Now
            </button>
          </form>
        </div>
        <div class="tandipay-footer" style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
          <p>Secure payment powered by TandiPay</p>
        </div>
      </div>
    `;
    
    container.innerHTML = widgetHtml;
    
    // Add event listeners
    const form = document.getElementById('tandipay-payment-form');
    const payBtn = document.getElementById('pay-now-btn');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      payBtn.disabled = true;
      payBtn.textContent = 'Processing...';
      
      const phone = document.getElementById('phone').value;
      const customerName = document.getElementById('customerName').value;
      const customerEmail = document.getElementById('customerEmail').value;
      
      try {
        const result = await this.tandipay.initializePayment({
          phone,
          amount: options.amount,
          customer: {
            name: customerName,
            email: customerEmail
          },
          returnUrl: options.returnUrl || window.location.href,
          popup: options.popup !== false,
          metadata: options.metadata
        });
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      } catch (error) {
        if (options.onError) {
          options.onError(error);
        }
      } finally {
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
      }
    });
    
    return {
      destroy: () => {
        container.innerHTML = '';
      }
    };
  }

  /**
   * Add floating payment button
   */
  addFloatingButton(options) {
    const button = document.createElement('div');
    button.id = 'tandipay-floating-btn';
    button.innerHTML = options.text || 'Pay Now';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4F46E5;
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: Arial, sans-serif;
      font-weight: bold;
      transition: all 0.3s ease;
    `;
    
    button.onmouseenter = () => {
      button.style.transform = 'scale(1.05)';
    };
    
    button.onmouseleave = () => {
      button.style.transform = 'scale(1)';
    };
    
    button.onclick = async () => {
      if (options.onClick) {
        await options.onClick(this.tandipay);
      }
    };
    
    document.body.appendChild(button);
    
    return {
      remove: () => {
        button.remove();
      }
    };
  }

  /**
   * Listen for payment events
   */
  onPaymentEvent(callback) {
    window.addEventListener('message', (event) => {
      if (event.origin === this.tandipay.apiUrl) {
        if (event.data.type === 'payment_completed') {
          callback(event.data);
        }
      }
    });
  }
}

export default BrowserAdapter;