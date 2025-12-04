# 🔐 Stripe Paywall Implementation Guide for SlabSnap

## Overview
Your SlabSnap app already has a payment UI (`PurchaseAdCreditsScreen.tsx`) but uses simulated payments. This guide shows how to implement real Stripe payments.

## 1. Install Stripe Dependencies

```bash
# Run this in your project directory
bun add @stripe/stripe-react-native
bun add stripe  # For server-side operations

# For iOS (if building locally)
cd ios && pod install
```

## 2. Add Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_publishable_key
STRIPE_SECRET_KEY=sk_test_...your_secret_key  # Keep this secret!

# Stripe Webhook Secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret
```

## 3. Create Stripe Provider

Create `src/providers/StripeProvider.tsx`:

```tsx
import React from 'react';
import { StripeProvider as StripeProviderLib } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  children: React.ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error('Stripe publishable key is required');
  }

  return (
    <StripeProviderLib publishableKey={publishableKey}>
      {children}
    </StripeProviderLib>
  );
}
```

## 4. Update Your App.tsx

```tsx
import StripeProvider from './src/providers/StripeProvider';

export default function App() {
  return (
    <StripeProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <SafeAreaProvider>
          <RootNavigator key="v44-cutstone-rebrand" />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}
```

## 5. Create Payment Service

Create `src/services/stripeService.ts`:

```typescript
import { Stripe } from 'stripe';

// Server-side Stripe instance (for creating payment intents)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export interface PaymentIntentData {
  amount: number; // in cents
  currency: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}
```

## 6. Update PurchaseAdCreditsScreen

Replace the simulated payment in `src/screens/PurchaseAdCreditsScreen.tsx`:

```tsx
import { useStripe } from '@stripe/stripe-react-native';

// Add this inside your component
const { initPaymentSheet, presentPaymentSheet } = useStripe();

// Replace the handlePurchase function
const handlePurchase = async () => {
  if (!selectedPackage) return;

  setIsProcessing(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  try {
    // Step 1: Create payment intent on your server
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: selectedPackage.price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          packageId: selectedPackage.id,
          credits: selectedPackage.credits.toString(),
          bonus: selectedPackage.bonus?.toString() || '0',
        },
      }),
    });

    const { clientSecret } = await response.json();

    // Step 2: Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'SlabSnap',
      style: 'automatic',
    });

    if (initError) {
      throw new Error(initError.message);
    }

    // Step 3: Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      throw new Error(presentError.message);
    }

    // Step 4: Payment successful
    purchaseCredits(selectedPackage.id);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Purchase Successful!",
      `${selectedPackage.credits + (selectedPackage.bonus || 0)} ad credits have been added to your account.`,
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );

  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Purchase Failed", error.message || "Please try again or contact support.");
  } finally {
    setIsProcessing(false);
  }
};
```

## 7. Create Backend API Endpoint

Create `api/create-payment-intent.ts` (if using Expo with API routes):

```typescript
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 8. Testing Stripe Integration

### Test Cards (Stripe Test Mode):
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## 9. Production Checklist

- [ ] Replace test keys with live keys
- [ ] Set up webhooks for payment confirmation
- [ ] Implement proper error handling
- [ ] Add payment receipt emails
- [ ] Test with real payment methods
- [ ] Ensure PCI compliance

## 10. Security Best Practices

1. **Never store payment info** - Let Stripe handle it
2. **Use webhooks** - Verify payments server-side
3. **Validate amounts** - Server-side validation
4. **Log transactions** - For audit trails
5. **Handle failures** - Graceful error handling

## Cost Estimates

Stripe charges:
- **2.9% + 30¢** per successful card transaction
- **No monthly fees** for basic plan
- **Additional fees** for international cards

For your $9.99 package: $0.59 Stripe fee = $9.40 net revenue