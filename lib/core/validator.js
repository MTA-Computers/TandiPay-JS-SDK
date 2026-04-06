"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateAmount = validateAmount;
exports.validateCustomer = validateCustomer;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validateUrl = validateUrl;
/**
 * Validate phone number
 * @param {string} phone 
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
}

/**
 * Validate amount
 * @param {number} amount 
 * @returns {boolean}
 */
function validateAmount(amount) {
  return amount && typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Validate customer info
 * @param {Object} customer 
 * @returns {boolean}
 */
function validateCustomer(customer) {
  return customer && customer.name && typeof customer.name === 'string' && customer.name.trim().length > 0;
}

/**
 * Validate email
 * @param {string} email 
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email) return true; // Email is optional
  const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return re.test(email);
}

/**
 * Validate URL
 * @param {string} url 
 * @returns {boolean}
 */
function validateUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}