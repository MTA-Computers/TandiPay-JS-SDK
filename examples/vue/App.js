<template>
  <div class="app">
    <h1>TandiPay Vue Integration</h1>
    
    <div class="section">
      <h2>Button Mode</h2>
      <TandiPayButton
        :payment-options="paymentOptions"
        @success="handleSuccess"
        @error="handleError"
        button-text="Pay with TandiPay"
        variant="primary"
        size="large"
      />
    </div>

    <div class="section">
      <h2>Modal Mode</h2>
      <button @click="openModal" class="open-modal-btn">
        Open Payment Modal
      </button>
    </div>

    <div v-if="paymentResult" class="result">
      <h3>Payment Result</h3>
      <pre>{{ JSON.stringify(paymentResult, null, 2) }}</pre>
    </div>

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
import TandiPayButton from '../../src/vue/TandiPayButton.vue';
import TandiPayModal from '../../src/vue/TandiPayModal.vue';

const modalOpen = ref(false);
const paymentResult = ref(null);

const paymentOptions = {
  phone: '254712345678',
  amount: 1500,
  customer: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  metadata: {
    orderId: 'ORD-12345'
  }
};

const handleSuccess = (result) => {
  console.log('Payment successful:', result);
  paymentResult.value = result;
  alert(`Payment successful! Transaction ID: ${result.transactionId}`);
};

const handleError = (error) => {
  console.error('Payment failed:', error);
  alert(`Payment failed: ${error.message}`);
};

const openModal = () => {
  modalOpen.value = true;
};
</script>

<style scoped>
.app {
  padding: 40px;
  font-family: Arial, sans-serif;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.open-modal-btn {
  padding: 10px 20px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.open-modal-btn:hover {
  background: #059669;
}

.result {
  margin-top: 30px;
  padding: 20px;
  background: #F3F4F6;
  border-radius: 8px;
}

.result pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>