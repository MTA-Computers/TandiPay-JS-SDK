/**
 * Node.js Adapter for TandiPay
 * Handles server-side specific functionality
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class NodeAdapter {
  constructor(tandipayInstance) {
    this.tandipay = tandipayInstance;
    this.isNode = true;
  }

  /**
   * Create a payment intent for server-side processing
   */
  async createPaymentIntent(options) {
    const payment = await this.tandipay.initializePayment({
      ...options,
      serverSide: true
    });
    
    return {
      clientSecret: payment.clientSecret,
      paymentIntentId: payment.transactionId,
      reference: payment.reference
    };
  }

  /**
   * Process webhook with signature verification
   */
  processWebhook(req, secret) {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    if (secret && !this.verifySignature(payload, signature, secret)) {
      throw new Error('Invalid webhook signature');
    }
    
    return this.tandipay.handleWebhook(payload, req.headers);
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expected)
    );
  }

  /**
   * Generate receipt PDF
   */
  async generateReceipt(transactionId, outputPath) {
    const transaction = await this.tandipay.getTransaction(transactionId);
    
    // Simple HTML receipt template
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
          .amount { font-size: 32px; color: #4F46E5; font-weight: bold; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>TandiPay Payment Receipt</h2>
            <p>Transaction ID: ${transaction.transactionId}</p>
          </div>
          <div class="details">
            <div class="row"><strong>Reference:</strong> <span>${transaction.reference}</span></div>
            <div class="row"><strong>Amount:</strong> <span class="amount">${transaction.amount} ${transaction.currency}</span></div>
            <div class="row"><strong>Status:</strong> <span>${transaction.status}</span></div>
            <div class="row"><strong>Customer:</strong> <span>${transaction.customer?.name}</span></div>
            <div class="row"><strong>Phone:</strong> <span>${transaction.customer?.phone}</span></div>
            <div class="row"><strong>Date:</strong> <span>${new Date(transaction.paidAt).toLocaleString()}</span></div>
            <div class="row"><strong>Payment Method:</strong> <span>${transaction.paymentMethod}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Powered by TandiPay</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    if (outputPath) {
      fs.writeFileSync(outputPath, receiptHtml);
      return outputPath;
    }
    
    return receiptHtml;
  }

  /**
   * Bulk payment processing
   */
  async bulkPayments(payments, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 5;
    
    // Process in batches
    for (let i = 0; i < payments.length; i += concurrency) {
      const batch = payments.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(payment => this.tandipay.initializePayment(payment))
      );
      results.push(...batchResults);
    }
    
    return {
      total: payments.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Schedule recurring payment
   */
  async scheduleRecurringPayment(options) {
    const { frequency, startDate, endDate, amount, customer, ...rest } = options;
    
    const schedule = {
      id: crypto.randomBytes(16).toString('hex'),
      frequency, // 'daily', 'weekly', 'monthly'
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      amount,
      customer,
      status: 'active',
      payments: []
    };
    
    // Store schedule (in production, use database)
    if (!global.tandipaySchedules) {
      global.tandipaySchedules = [];
    }
    global.tandipaySchedules.push(schedule);
    
    return schedule;
  }

  /**
   * Process scheduled payments (to be called by cron job)
   */
  async processScheduledPayments() {
    const now = new Date();
    const schedules = global.tandipaySchedules || [];
    const processed = [];
    
    for (const schedule of schedules) {
      if (schedule.status !== 'active') continue;
      if (schedule.endDate && now > schedule.endDate) {
        schedule.status = 'completed';
        continue;
      }
      
      // Check if payment is due
      const lastPayment = schedule.payments[schedule.payments.length - 1];
      let shouldProcess = false;
      
      if (!lastPayment) {
        shouldProcess = now >= schedule.startDate;
      } else {
        const lastDate = new Date(lastPayment.date);
        switch (schedule.frequency) {
          case 'daily':
            shouldProcess = now.getDate() !== lastDate.getDate();
            break;
          case 'weekly':
            shouldProcess = now.getWeek() !== lastDate.getWeek();
            break;
          case 'monthly':
            shouldProcess = now.getMonth() !== lastDate.getMonth();
            break;
        }
      }
      
      if (shouldProcess) {
        try {
          const payment = await this.tandipay.initializePayment({
            amount: schedule.amount,
            customer: schedule.customer,
            reference: `REC_${schedule.id}_${Date.now()}`,
            ...schedule.paymentOptions
          });
          
          schedule.payments.push({
            date: now,
            reference: payment.reference,
            status: 'processed'
          });
          
          processed.push(payment);
        } catch (error) {
          schedule.payments.push({
            date: now,
            error: error.message,
            status: 'failed'
          });
        }
      }
    }
    
    return processed;
  }
}

module.exports = NodeAdapter;