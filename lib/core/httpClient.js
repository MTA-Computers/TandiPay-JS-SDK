"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
class HttpClient {
  constructor(config) {
    this.config = config;
    this.isBrowser = typeof window !== 'undefined';
    this.isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

    // Load appropriate HTTP client
    if (this.isBrowser || this.isReactNative) {
      this.loadBrowserClient();
    } else {
      this.loadNodeClient();
    }
  }
  async loadNodeClient() {
    // Node.js environment
    const axios = await Promise.resolve().then(() => _interopRequireWildcard(require('axios')));
    this.client = axios.default;
  }
  loadBrowserClient() {
    // Browser environment - check for axios or use fetch
    if (typeof axios !== 'undefined') {
      this.client = axios;
    } else {
      // Fallback to fetch API
      this.useFetch = true;
    }
  }
  async request(method, url, data = null, options = {}) {
    const fullUrl = `${this.config.baseURL}${url}`;
    if (this.useFetch) {
      return this.fetchRequest(method, fullUrl, data, options);
    } else {
      return this.axiosRequest(method, fullUrl, data, options);
    }
  }
  async axiosRequest(method, url, data, options) {
    const config = {
      method,
      url,
      headers: this.config.headers,
      timeout: this.config.timeout,
      ...options
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    if (options.params) {
      config.params = options.params;
    }
    const response = await this.client(config);
    return response;
  }
  async fetchRequest(method, url, data, options) {
    const fetchOptions = {
      method,
      headers: {
        ...this.config.headers,
        ...options.headers
      },
      timeout: this.config.timeout
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(data);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    fetchOptions.signal = controller.signal;
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      const responseData = await response.json();
      return {
        data: responseData,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  get(url, options = {}) {
    return this.request('GET', url, null, options);
  }
  post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }
  put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }
  delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }
}
var _default = exports.default = HttpClient;