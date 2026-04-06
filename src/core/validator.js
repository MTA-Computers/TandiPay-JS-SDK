/**
 * Validate phone number
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
}

/**
 * Validate amount
 * @param {number} amount 
 * @returns {boolean}
 */
export function validateAmount(amount) {
  return amount && typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Validate customer info
 * @param {Object} customer 
 * @returns {boolean}
 */
export function validateCustomer(customer) {
  return customer && customer.name && typeof customer.name === 'string' && customer.name.trim().length > 0;
}

/**
 * Validate email
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return true; // Email is optional
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return re.test(email);
}

/**
 * Validate URL
 * @param {string} url 
 * @returns {boolean}
 */
export function validateUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}