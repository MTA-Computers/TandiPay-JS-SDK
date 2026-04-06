import { useState, useCallback } from 'react';
import { useTandiPayContext } from './TandiPayProvider';

export const useTandiPay = () => {
  const tandipay = useTandiPayContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializePayment = useCallback(async (options) => {
    setLoading(true);
    setError(null);
    try {
      const result = await tandipay.initializePayment(options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tandipay]);

  const verifyPayment = useCallback(async (reference) => {
    setLoading(true);
    setError(null);
    try {
      const result = await tandipay.verifyPayment(reference);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tandipay]);

  const requestRefund = useCallback(async (transactionId, amount, reason) => {
    setLoading(true);
    setError(null);
    try {
      const result = await tandipay.requestRefund(transactionId, amount, reason);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tandipay]);

  return {
    initializePayment,
    verifyPayment,
    requestRefund,
    isPaymentSuccessful: tandipay.isPaymentSuccessful.bind(tandipay),
    generateReference: tandipay.generateReference.bind(tandipay),
    loading,
    error
  };
};