/**
 * PostgreSQL Database Configuration
 */

import pg from 'pg';
const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database tables
export const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) DEFAULT 'homeowner',
        credits INTEGER DEFAULT 5,
        ad_credits INTEGER DEFAULT 0,
        stripe_customer_id VARCHAR(255),
        shopify_connected BOOLEAN DEFAULT false,
        shopify_store_domain VARCHAR(255),
        shopify_access_token TEXT,
        shopify_scope TEXT,
        shopify_store_name VARCHAR(255),
        shopify_connected_at TIMESTAMP,
        password_reset_code VARCHAR(6),
        password_reset_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add password reset columns if they don't exist (migration for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_code') THEN
          ALTER TABLE users ADD COLUMN password_reset_code VARCHAR(6);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
          ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
        END IF;
      END $$;
    `);

    // Create subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_customer_id VARCHAR(255),
        plan_tier VARCHAR(50) NOT NULL DEFAULT 'free',
        user_type VARCHAR(50) NOT NULL DEFAULT 'pro',
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        status VARCHAR(50) DEFAULT 'active',
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        canceled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user credits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_credits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create credit transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        reference_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create promotions table (for vendor marketing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        promo_type VARCHAR(50) NOT NULL,
        discount_type VARCHAR(20),
        discount_value DECIMAL(10,2),
        images TEXT[],
        categories TEXT[],
        visibility VARCHAR(20) DEFAULT 'public',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        is_featured BOOLEAN DEFAULT false,
        views INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create quotes table (B2B and B2C quoting)
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INTEGER REFERENCES users(id),
        recipient_email VARCHAR(255),
        recipient_name VARCHAR(255),
        recipient_phone VARCHAR(50),
        quote_type VARCHAR(20) DEFAULT 'b2c',
        line_items JSONB NOT NULL,
        subtotal DECIMAL(10,2),
        tax_rate DECIMAL(5,2) DEFAULT 8.25,
        tax_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2),
        notes TEXT,
        terms TEXT,
        payment_terms VARCHAR(100),
        lead_time VARCHAR(100),
        status VARCHAR(20) DEFAULT 'draft',
        sent_at TIMESTAMP,
        viewed_at TIMESTAMP,
        accepted_at TIMESTAMP,
        rejected_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create leads table (for subscription-based lead access)
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        project_type VARCHAR(100),
        description TEXT,
        budget_range VARCHAR(50),
        timeline VARCHAR(50),
        location_city VARCHAR(100),
        location_state VARCHAR(50),
        location_zip VARCHAR(20),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        claimed_by INTEGER REFERENCES users(id),
        claimed_at TIMESTAMP,
        credit_cost INTEGER DEFAULT 5,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vendor products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_products (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(100),
        price DECIMAL(10,2),
        unit VARCHAR(50),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        images TEXT[],
        specifications JSONB,
        in_stock BOOLEAN DEFAULT true,
        quantity INTEGER,
        min_order INTEGER DEFAULT 1,
        is_featured BOOLEAN DEFAULT false,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create listings table (marketplace listings including Shopify imports)
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shopify_product_id VARCHAR(100),
        shopify_variant_id VARCHAR(100),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'Stone & Tile',
        listing_type VARCHAR(50) DEFAULT 'Slab',
        price DECIMAL(10,2),
        compare_at_price DECIMAL(10,2),
        images TEXT[],
        location VARCHAR(255),
        brand VARCHAR(255),
        sku VARCHAR(100),
        inventory_quantity INTEGER,
        dimensions JSONB,
        specifications JSONB,
        status VARCHAR(20) DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'manual',
        views INTEGER DEFAULT 0,
        favorites INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster Shopify product lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_shopify_product_id ON listings(shopify_product_id)
    `);

    // Create index for seller lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id)
    `);

    console.log('✅ Database tables initialized (including subscriptions, promotions, quotes, leads, listings)');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Export pool for queries
export default pool;
