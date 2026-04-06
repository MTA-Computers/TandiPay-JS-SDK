<template>
  <button
    :class="buttonClasses"
    :style="buttonStyles"
    :disabled="disabled || loading"
    @click="handlePayment"
  >
    <span v-if="loading" class="tandipay-spinner"></span>
    {{ loading ? loadingText : buttonText }}
  </button>
</template>

<script>
import { ref } from 'vue';
import { useTandiPay } from './composable';

export default {
  name: 'TandiPayButton',
  props: {
    paymentOptions: {
      type: Object,
      required: true
    },
    buttonText: {
      type: String,
      default: 'Pay Now'
    },
    loadingText: {
      type: String,
      default: 'Processing...'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    popupMode: {
      type: Boolean,
      default: true
    }
  },
  emits: ['success', 'error', 'close'],
  setup(props, { emit }) {
    const { initializePayment, verifyPayment, loading } = useTandiPay();
    const localLoading = ref(false);

    const variantStyles = {
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

    const sizeStyles = {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '10px 20px', fontSize: '14px' },
      large: { padding: '14px 28px', fontSize: '16px' }
    };

    const buttonClasses = [
      'tandipay-button',
      `tandipay-button-${props.variant}`,
      `tandipay-button-${props.size}`,
      { 'tandipay-button-loading': loading.value || localLoading.value }
    ];

    const buttonStyles = {
      ...variantStyles[props.variant],
      ...sizeStyles[props.size],
      borderRadius: '6px',
      cursor: (props.disabled || loading.value || localLoading.value) ? 'not-allowed' : 'pointer',
      opacity: (props.disabled || loading.value || localLoading.value) ? 0.6 : 1,
      transition: 'all 0.3s ease',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    };

    const handlePayment = async () => {
      localLoading.value = true;
      try {
        const result = await initializePayment({
          ...props.paymentOptions,
          popup: props.popupMode,
          autoRedirect: false
        });

        if (props.popupMode) {
          // Open popup window
          const popup = window.open(result.paymentLink, 'TandiPayPayment', 'width=600,height=700,center=yes');
          
          // Monitor popup closure
          const checkPopup = setInterval(async () => {
            if (popup && popup.closed) {
              clearInterval(checkPopup);
              try {
                const verification = await verifyPayment(result.reference);
                if (verification.success && verification.status === 'successful') {
                  emit('success', verification);
                } else {
                  emit('error', new Error('Payment was not successful'));
                }
              } catch (error) {
                emit('error', error);
              }
              emit('close');
            }
          }, 1000);
        } else {
          emit('success', result);
        }
      } catch (error) {
        emit('error', error);
      } finally {
        localLoading.value = false;
      }
    };

    return {
      handlePayment,
      loading: localLoading,
      buttonClasses,
      buttonStyles
    };
  }
};
</script>

<style scoped>
.tandipay-button {
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tandipay-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tandipay-button:active:not(:disabled) {
  transform: translateY(0);
}

.tandipay-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: tandipay-spin 0.6s linear infinite;
}

@keyframes tandipay-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>