import { inject, ref } from 'vue';
import { TandiPaySymbol } from './plugin';

export function useTandiPay() {
  const tandipay = inject(TandiPaySymbol);
  const loading = ref(false);
  const error = ref(null);

  if (!tandipay) {
    throw new Error('TandiPay not installed. Use app.use(TandiPayPlugin)');
  }

  const initializePayment = async (options) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await tandipay.initializePayment(options);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const verifyPayment = async (reference) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await tandipay.verifyPayment(reference);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    initializePayment,
    verifyPayment,
    requestRefund: tandipay.requestRefund.bind(tandipay),
    isPaymentSuccessful: tandipay.isPaymentSuccessful.bind(tandipay),
    generateReference: tandipay.generateReference.bind(tandipay),
    loading,
    error
  };
}