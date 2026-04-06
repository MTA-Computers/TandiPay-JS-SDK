const TandiPay = require('../../src/core/TandiPay');

describe('TandiPay SDK', () => {
  let tandipay;

  beforeEach(() => {
    tandipay = new TandiPay({
      apiKey: 'test-api-key',
      apiUrl: 'https://test-api.tandipay.com/api'
    });
  });

  describe('constructor', () => {
    it('should throw error if apiKey is missing', () => {
      expect(() => new TandiPay()).toThrow('API key is required');
    });

    it('should create instance with valid config', () => {
      expect(tandipay.apiKey).toBe('test-api-key');
      expect(tandipay.apiUrl).toBe('https://test-api.tandipay.com/api');
    });
  });

  describe('generateReference', () => {
    it('should generate unique reference', () => {
      const ref1 = tandipay.generateReference();
      const ref2 = tandipay.generateReference();
      expect(ref1).not.toBe(ref2);
      expect(ref1).toMatch(/^TDP_\d+_\d+$/);
    });

    it('should include orderId if provided', () => {
      const ref = tandipay.generateReference('ORD123');
      expect(ref).toMatch(/^TDP_ORD123_\d+_\d+$/);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(tandipay.validatePhone('254712345678')).toBe(true);
      expect(tandipay.validatePhone('0712345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(tandipay.validatePhone('123')).toBe(false);
      expect(tandipay.validatePhone('')).toBe(false);
    });
  });

  describe('verifyPayment', () => {
    it('should throw error if reference is missing', async () => {
      await expect(tandipay.verifyPayment()).rejects.toThrow('Transaction reference is required');
    });
  });

  describe('extractOrderId', () => {
    it('should extract orderId from reference', () => {
      const ref = 'TDP_ORD123_1234567890_1234';
      expect(tandipay.extractOrderId(ref)).toBe('ORD123');
    });

    it('should return null for invalid reference', () => {
      expect(tandipay.extractOrderId('invalid')).toBe(null);
    });
  });
});