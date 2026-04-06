"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractOrderId = extractOrderId;
exports.generateReference = generateReference;
exports.validateReference = validateReference;
/**
 * Generate unique transaction reference
 * @param {string|number} orderId - Optional order ID
 * @returns {string}
 */
function generateReference(orderId = null) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 90000 + 10000);
  const uniqueId = `${timestamp}${random}`;
  if (orderId) {
    const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9]/g, '');
    return `TDP_${cleanOrderId}_${uniqueId}`;
  }
  return `TDP_${uniqueId}`;
}

/**
 * Extract order ID from reference
 * @param {string} reference 
 * @returns {string|null}
 */
function extractOrderId(reference) {
  const parts = reference.split('_');
  if (parts.length >= 2 && parts[0] === 'TDP') {
    return parts[1];
  }
  return null;
}

/**
 * Validate reference format
 * @param {string} reference 
 * @returns {boolean}
 */
function validateReference(reference) {
  if (!reference) return false;
  return reference.startsWith('TDP_') && reference.length >= 10;
}