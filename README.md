# TandiPay SDK

**Unified payment gateway SDK for Web & Mobile**
Accept **Mobile Money and Bank Payments** seamlessly across your stack.

[![npm version](https://img.shields.io/npm/v/tandipay-sdk.svg)](https://www.npmjs.com/package/tandipay-sdk)
[![license](https://img.shields.io/npm/l/tandipay-sdk.svg)](LICENSE)
[![downloads](https://img.shields.io/npm/dm/tandipay-sdk.svg)](https://www.npmjs.com/package/tandipay-sdk)

---

## Why TandiPay?

TandiPay simplifies payments for developers building in **Africa-first ecosystems**, with a strong focus on **Mobile Money (MTN, Airtel)** and modern frontend frameworks.

* **One SDK, Multiple Platforms**
* **Mobile Money + Bank Transfers**
* **Secure by Default (Webhook Signing, Token Handling)**
* **Simple API, Fast Integration**
* **Lightweight + Tree-shakable**
* **Subscriptions & Recurring Billing**
* **Built-in Transaction Tracking**

---

## Supported Platforms

* Node.js (Express, NestJS, etc.)
* React / Next.js
* Vue 3
* React Native
* Vanilla JavaScript (CDN)

---

## Installation

### Node.js / Backend

```bash
npm install tandipay-sdk
```

### Frontend (React / Vue)

```bash
npm install tandipay-sdk axios
```

### React Native

```bash
npm install tandipay-sdk axios react-native-inappbrowser-reborn @react-native-async-storage/async-storage
cd ios && pod install
```

### CDN (Vanilla JS)

```html
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tandipay-sdk/dist/index.umd.js"></script>
```

---

## Quick Start

### 1. Initialize SDK

```js
import TandiPay from 'tandipay-sdk';

const tandipay = new TandiPay({
  apiKey: process.env.TANDIPAY_API_KEY,
  environment: 'sandbox', // or 'production'
});
```

---

### 2. Create Payment

```js
const payment = await tandipay.initializePayment({
  phone: '256712345678',
  amount: 1500,
  customer: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  returnUrl: 'https://yourdomain.com/callback',
});
```

```js
window.open(payment.paymentLink);
```

---

### 3. Verify Payment

```js
const result = await tandipay.verifyPayment(payment.reference);

if (result.status === 'successful') {
  console.log('Payment complete');
}
```

---

### 4. Handle Webhooks (Recommended)

```js
app.post('/webhook/tandipay', async (req, res) => {
  try {
    const event = tandipay.handleWebhook(
      JSON.stringify(req.body),
      req.headers
    );

    if (event.status === 'successful') {
      // update order
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

---

## Frontend Example (React)

```jsx
import { TandiPayProvider, TandiPayButton } from 'tandipay-sdk/react';

export default function App() {
  return (
    <TandiPayProvider config={{ apiKey: 'your-key' }}>
      <TandiPayButton
        paymentOptions={{
          phone: '256712345678',
          amount: 2000,
          customer: { name: 'Jane Doe' }
        }}
        onSuccess={(res) => console.log(res)}
        onError={(err) => console.error(err)}
      />
    </TandiPayProvider>
  );
}
```

---

## Advanced Features

### Subscriptions

```js
await tandipay.createSubscription({
  customer_id: 'cus_123',
  amount: 50000,
  frequency: 'monthly'
});
```

---

### Bulk Payments

```js
await tandipay.bulkPayments([
  { phone: '2567...', amount: 1000 },
  { phone: '2567...', amount: 2000 }
]);
```

---

## API Overview

### Core Methods

| Method            | Description        |
| ----------------- | ------------------ |
| initializePayment | Start a payment    |
| verifyPayment     | Confirm payment    |
| handleWebhook     | Verify webhook     |
| generateReference | Create unique ref  |
| requestRefund     | Refund transaction |

---

### Payment Object

```js
{
  phone: string,
  amount: number,
  customer: {
    name: string,
    email?: string
  },
  reference?: string,
  returnUrl?: string,
  callback_url?: string,
  metadata?: object
}
```

---

## Testing

Use sandbox mode:

```js
environment: 'sandbox'
```

### Test Numbers

| Scenario | Number       |
| -------- | ------------ |
| Success  | 256712345678 |
| Failed   | 256798765432 |
| Pending  | 256711223344 |

---

## Best Practices

* Never expose API keys in frontend
* Always verify payments server-side
* Use webhooks (don’t rely on polling only)
* Implement idempotency for webhook handling
* Log transactions for audit

---

## Support

* Email: [support@tandipay.com](mailto:support@tandipay.com)
* Docs: [https://docs.tandipay.com](https://docs.tandipay.com)
* Website: [https://tandipay.com](https://tandipay.com)

---

## License

MIT License © TandiPay

---

## Contributing

PRs are welcome. Please follow the contribution guidelines.

---

## Built for African Payments

TandiPay is optimized for real-world payment flows across **Mobile Money ecosystems**, enabling developers to build reliable fintech products faster.# TandiPay-JS-SDK
