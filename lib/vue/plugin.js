import TandiPay from '../core/TandiPay';

export const TandiPaySymbol = Symbol('tandipay');

export default {
  install(app, options) {
    const tandipay = new TandiPay(options);
    app.provide(TandiPaySymbol, tandipay);
    app.config.globalProperties.$tandipay = tandipay;
  }
};