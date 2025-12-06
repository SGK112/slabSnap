/**
 * Stripe Subscription Routes for REMODELY.AI
 * Handles subscription management, checkout, and webhooks
 */

import express from 'express';
import Stripe from 'stripe';
import pool from '../db/index.js';
import { protect as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs - these need to be created in Stripe Dashboard
const PRICE_IDS = {
  // Vendor Plans
  vendor_starter_monthly: process.env.STRIPE_VENDOR_STARTER_MONTHLY,
  vendor_starter_yearly: process.env.STRIPE_VENDOR_STARTER_YEARLY,
  vendor_pro_monthly: process.env.STRIPE_VENDOR_PRO_MONTHLY,
  vendor_pro_yearly: process.env.STRIPE_VENDOR_PRO_YEARLY,
  vendor_enterprise_monthly: process.env.STRIPE_VENDOR_ENTERPRISE_MONTHLY,
  vendor_enterprise_yearly: process.env.STRIPE_VENDOR_ENTERPRISE_YEARLY,
  // Pro Plans
  pro_starter_monthly: process.env.STRIPE_PRO_STARTER_MONTHLY,
  pro_starter_yearly: process.env.STRIPE_PRO_STARTER_YEARLY,
  pro_business_monthly: process.env.STRIPE_PRO_BUSINESS_MONTHLY,
  pro_business_yearly: process.env.STRIPE_PRO_BUSINESS_YEARLY,
  pro_enterprise_monthly: process.env.STRIPE_PRO_ENTERPRISE_MONTHLY,
  pro_enterprise_yearly: process.env.STRIPE_PRO_ENTERPRISE_YEARLY,
  // Credits
  credits_10: process.env.STRIPE_CREDITS_10,
  credits_25: process.env.STRIPE_CREDITS_25,
  credits_50: process.env.STRIPE_CREDITS_50,
  credits_100: process.env.STRIPE_CREDITS_100,
};

/**
 * Create Stripe Checkout Session for subscription
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType, planTier, billingCycle, userType } = req.body;
    const userId = req.user.userId;

    // Construct price ID key
    const priceKey = `${userType}_${planTier}_${billingCycle}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return res.status(400).json({
        error: 'Invalid plan configuration',
        details: `No price found for: ${priceKey}`
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    const userResult = await pool.query(
      'SELECT stripe_customer_id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0]?.stripe_customer_id) {
      stripeCustomerId = userResult.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userResult.rows[0]?.email,
        metadata: { userId: userId.toString() },
      });
      stripeCustomerId = customer.id;

      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, userId]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
        planType,
        planTier,
        billingCycle,
        userType,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Create checkout session for credit purchase
 */
router.post('/purchase-credits', authenticateToken, async (req, res) => {
  try {
    const { creditAmount } = req.body;
    const userId = req.user.userId;

    const priceKey = `credits_${creditAmount}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    const userResult = await pool.query(
      'SELECT stripe_customer_id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0]?.stripe_customer_id) {
      stripeCustomerId = userResult.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userResult.rows[0]?.email,
        metadata: { userId: userId.toString() },
      });
      stripeCustomerId = customer.id;

      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, userId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/credits/cancel`,
      metadata: {
        userId: userId.toString(),
        creditAmount: creditAmount.toString(),
        type: 'credit_purchase',
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Credit purchase error:', error);
    res.status(500).json({ error: 'Failed to create credit purchase session' });
  }
});

/**
 * Get current subscription status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT
        s.*,
        u.stripe_customer_id
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (!result.rows[0]) {
      return res.json({
        subscription: null,
        plan: 'free',
        credits: 0,
      });
    }

    const subscription = result.rows[0];

    // Get credit balance
    const creditsResult = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    res.json({
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        plan: subscription.plan_tier,
        userType: subscription.user_type,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      },
      credits: creditsResult.rows[0]?.balance || 0,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (!result.rows[0]?.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(result.rows[0].stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE user_id = $2 AND status = $3',
      ['canceling', userId, 'active']
    );

    res.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Create customer portal session for managing subscription
 */
router.post('/customer-portal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: result.rows[0].stripe_customer_id,
      return_url: `${process.env.APP_URL}/profile`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
});

/**
 * Stripe Webhook Handler
 * Receives events from Stripe and updates database accordingly
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        if (session.mode === 'subscription') {
          // Handle subscription creation
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          await pool.query(`
            INSERT INTO subscriptions (
              user_id, stripe_subscription_id, stripe_customer_id,
              plan_tier, user_type, billing_cycle, status,
              current_period_start, current_period_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id)
            DO UPDATE SET
              stripe_subscription_id = $2,
              plan_tier = $4,
              user_type = $5,
              billing_cycle = $6,
              status = $7,
              current_period_start = $8,
              current_period_end = $9,
              updated_at = NOW()
          `, [
            session.metadata.userId,
            subscription.id,
            session.customer,
            session.metadata.planTier,
            session.metadata.userType,
            session.metadata.billingCycle,
            'active',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
          ]);
        } else if (session.metadata?.type === 'credit_purchase') {
          // Handle credit purchase
          const creditAmount = parseInt(session.metadata.creditAmount);

          await pool.query(`
            INSERT INTO user_credits (user_id, balance)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET balance = user_credits.balance + $2
          `, [session.metadata.userId, creditAmount]);

          // Log the transaction
          await pool.query(`
            INSERT INTO credit_transactions (user_id, amount, type, description)
            VALUES ($1, $2, $3, $4)
          `, [session.metadata.userId, creditAmount, 'purchase', `Purchased ${creditAmount} credits`]);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          // Renew subscription
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

          await pool.query(`
            UPDATE subscriptions
            SET status = $1,
                current_period_start = $2,
                current_period_end = $3,
                updated_at = NOW()
            WHERE stripe_subscription_id = $4
          `, [
            'active',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            invoice.subscription,
          ]);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await pool.query(
            'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
            ['past_due', invoice.subscription]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await pool.query(
          'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
          ['canceled', subscription.id]
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await pool.query(`
          UPDATE subscriptions
          SET status = $1,
              current_period_end = $2,
              updated_at = NOW()
          WHERE stripe_subscription_id = $3
        `, [
          subscription.status,
          new Date(subscription.current_period_end * 1000),
          subscription.id,
        ]);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get credit balance
 */
router.get('/credits', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    res.json({ credits: result.rows[0]?.balance || 0 });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ error: 'Failed to get credit balance' });
  }
});

/**
 * Deduct credits (internal use for lead purchases, boosts, etc.)
 */
router.post('/deduct-credits', authenticateToken, async (req, res) => {
  try {
    const { amount, description, type } = req.body;
    const userId = req.user.userId;

    // Check balance
    const balanceResult = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = $1',
      [userId]
    );

    const currentBalance = balanceResult.rows[0]?.balance || 0;

    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credits
    await pool.query(
      'UPDATE user_credits SET balance = balance - $1 WHERE user_id = $2',
      [amount, userId]
    );

    // Log transaction
    await pool.query(`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES ($1, $2, $3, $4)
    `, [userId, -amount, type || 'deduction', description]);

    res.json({ success: true, newBalance: currentBalance - amount });
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

export default router;
