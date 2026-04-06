/**
 * React Native Adapter for TandiPay
 * Handles mobile-specific functionality
 */

import { Linking, Platform, AppState } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ReactNativeAdapter {
  constructor(tandipayInstance) {
    this.tandipay = tandipayInstance;
    this.isReactNative = true;
    this.appStateSubscription = null;
  }

  /**
   * Open payment in in-app browser
   */
  async openPaymentInApp(paymentLink, options = {}) {
    if (Platform.OS === 'ios' && !(await InAppBrowser.isAvailable())) {
      // Fallback to Linking
      return Linking.openURL(paymentLink);
    }
    
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(paymentLink, {
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: options.barColor || '#4F46E5',
          preferredControlTintColor: options.controlColor || '#FFFFFF',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          ...options
        });
        
        if (result.type === 'cancel') {
          throw new Error('Payment cancelled by user');
        }
        
        return result;
      } else {
        return Linking.openURL(paymentLink);
      }
    } catch (error) {
      throw new Error(`Failed to open payment page: ${error.message}`);
    }
  }

  /**
   * Deep link handler for payment callbacks
   */
  setupDeepLinkHandler(callback) {
    const handleUrl = (event) => {
      const { url } = event;
      if (url && url.includes('tandipay://')) {
        const params = this.parseDeepLinkParams(url);
        callback(params);
      }
    };
    
    Linking.addEventListener('url', handleUrl);
    
    // Handle initial URL if app opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('tandipay://')) {
        const params = this.parseDeepLinkParams(url);
        callback(params);
      }
    });
    
    return () => {
      Linking.removeEventListener('url', handleUrl);
    };
  }

  /**
   * Parse deep link parameters
   */
  parseDeepLinkParams(url) {
    const params = {};
    const queryString = url.split('?')[1];
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
      });
    }
    return params;
  }

  /**
   * Cache payment data locally
   */
  async cachePaymentData(key, data) {
    try {
      await AsyncStorage.setItem(`tandipay_${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to cache payment data:', error);
      return false;
    }
  }

  /**
   * Get cached payment data
   */
  async getCachedPaymentData(key) {
    try {
      const data = await AsyncStorage.getItem(`tandipay_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get cached payment data:', error);
      return null;
    }
  }

  /**
   * Clear cached payment data
   */
  async clearCachedPaymentData(key) {
    try {
      await AsyncStorage.removeItem(`tandipay_${key}`);
      return true;
    } catch (error) {
      console.error('Failed to clear cached payment data:', error);
      return false;
    }
  }

  /**
   * Monitor app state for payment verification
   */
  monitorAppState(onChange) {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      onChange(nextAppState);
    });
    
    return () => {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }
    };
  }

  /**
   * Generate mobile money paybill number
   */
  getPaybillDetails() {
    return {
      paybill: '123456',
      accountNumber: this.tandipay.business?.accountNumber,
      businessName: this.tandipay.business?.name
    };
  }

  /**
   * Share payment details via SMS
   */
  sharePaymentDetails(phone, amount, reference) {
    const message = `Please complete payment of ${amount} TZS using reference: ${reference}`;
    const smsUrl = Platform.OS === 'ios' 
      ? `sms:${phone}&body=${encodeURIComponent(message)}`
      : `sms:${phone}?body=${encodeURIComponent(message)}`;
    
    return Linking.openURL(smsUrl);
  }
}

export default ReactNativeAdapter;