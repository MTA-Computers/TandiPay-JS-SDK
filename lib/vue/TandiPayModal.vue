<template>
  <Teleport to="body">
    <div v-if="isOpen" class="tandipay-modal-overlay" @click.self="handleClose">
      <div class="tandipay-modal" :style="modalStyle">
        <div class="tandipay-modal-header">
          <h3>{{ title }}</h3>
          <button class="tandipay-modal-close" @click="handleClose">&times;</button>
        </div>
        <div class="tandipay-modal-body">
          <div v-if="loading" class="tandipay-loading">
            <div class="tandipay-spinner"></div>
            <p>Initializing payment...</p>
          </div>
          <iframe
            v-else
            :src="paymentLink"
            class="tandipay-iframe"
            @load="handleIframeLoad"
            allow="payment"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, watch, computed } from 'vue';
import { useTandiPay } from './composable';

export default {
  name: 'TandiPayModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    paymentOptions: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: 'Complete Payment'
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large', 'full'].includes(value)
    },
    onSuccess: {
      type: Function,
      default: null
    },
    onError: {
      type: Function,
      default: null
    },
    onClose: {
      type: Function,
      default: null
    }
  },
  emits: ['update:isOpen', 'success', 'error', 'close'],
  setup(props, { emit }) {
    const { initializePayment, verifyPayment } = useTandiPay();
    const paymentLink = ref(null);
    const reference = ref(null);
    const loading = ref(false);

    const modalSizes = {
      small: { width: '500px', height: '600px' },
      medium: { width: '700px', height: '700px' },
      large: { width: '900px', height: '800px' },
      full: { width: '95%', height: '95%' }
    };

    const modalStyle = computed(() => modalSizes[props.size] || modalSizes.medium);

    const initializePaymentModal = async () => {
      loading.value = true;
      try {
        const result = await initializePayment({
          ...props.paymentOptions,
          modal: true,
          autoRedirect: false
        });
        paymentLink.value = result.paymentLink;
        reference.value = result.reference;
      } catch (error) {
        if (props.onError) props.onError(error);
        emit('error', error);
        handleClose();
      } finally {
        loading.value = false;
      }
    };

    const handleIframeLoad = () => {
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'payment_completed' && event.data.reference === reference.value) {
          try {
            const verification = await verifyPayment(reference.value);
            if (verification.success && verification.status === 'successful') {
              if (props.onSuccess) props.onSuccess(verification);
              emit('success', verification);
            }
            handleClose();
          } catch (error) {
            if (props.onError) props.onError(error);
            emit('error', error);
          }
        }
      });
    };

    const handleClose = () => {
      emit('update:isOpen', false);
      emit('close');
      if (props.onClose) props.onClose();
      paymentLink.value = null;
      reference.value = null;
    };

    watch(() => props.isOpen, (newVal) => {
      if (newVal && !paymentLink.value) {
        initializePaymentModal();
      }
    });

    return {
      paymentLink,
      loading,
      modalStyle,
      handleIframeLoad,
      handleClose
    };
  }
};
</script>

<style scoped>
.tandipay-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.tandipay-modal {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tandipay-modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tandipay-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.tandipay-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.tandipay-modal-close:hover {
  background-color: #f3f4f6;
}

.tandipay-modal-body {
  flex: 1;
  overflow: auto;
}

.tandipay-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.tandipay-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.tandipay-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #4F46E5;
  border-radius: 50%;
  animation: tandipay-spin 1s linear infinite;
}

@keyframes tandipay-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>