/**
 * User Model - PostgreSQL
 */

import pool from '../db/index.js';
import bcrypt from 'bcryptjs';

class User {
  /**
   * Find user by email
   */
  static async findOne({ email }) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return new UserInstance(user);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return new UserInstance(user);
  }

  /**
   * Find user by ID and update
   */
  static async findByIdAndUpdate(id, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Handle nested shopify object
    if (updates.shopify) {
      if (updates.shopify.connected !== undefined) {
        setClauses.push(`shopify_connected = $${paramIndex++}`);
        values.push(updates.shopify.connected);
      }
      if (updates.shopify.storeDomain !== undefined) {
        setClauses.push(`shopify_store_domain = $${paramIndex++}`);
        values.push(updates.shopify.storeDomain);
      }
      if (updates.shopify.accessToken !== undefined) {
        setClauses.push(`shopify_access_token = $${paramIndex++}`);
        values.push(updates.shopify.accessToken);
      }
      if (updates.shopify.scope !== undefined) {
        setClauses.push(`shopify_scope = $${paramIndex++}`);
        values.push(updates.shopify.scope);
      }
      if (updates.shopify.storeName !== undefined) {
        setClauses.push(`shopify_store_name = $${paramIndex++}`);
        values.push(updates.shopify.storeName);
      }
      if (updates.shopify.connectedAt !== undefined) {
        setClauses.push(`shopify_connected_at = $${paramIndex++}`);
        values.push(updates.shopify.connectedAt);
      }
    }

    // Handle $unset for shopify disconnect
    if (updates.$unset?.shopify) {
      setClauses.push(`shopify_connected = $${paramIndex++}`);
      values.push(false);
      setClauses.push(`shopify_store_domain = $${paramIndex++}`);
      values.push(null);
      setClauses.push(`shopify_access_token = $${paramIndex++}`);
      values.push(null);
      setClauses.push(`shopify_scope = $${paramIndex++}`);
      values.push(null);
      setClauses.push(`shopify_store_name = $${paramIndex++}`);
      values.push(null);
      setClauses.push(`shopify_connected_at = $${paramIndex++}`);
      values.push(null);
    }

    // Handle direct updates
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.user_type !== undefined || updates.userType !== undefined) {
      setClauses.push(`user_type = $${paramIndex++}`);
      values.push(updates.user_type || updates.userType);
    }
    if (updates.credits !== undefined) {
      setClauses.push(`credits = $${paramIndex++}`);
      values.push(updates.credits);
    }
    if (updates.ad_credits !== undefined || updates.adCredits !== undefined) {
      setClauses.push(`ad_credits = $${paramIndex++}`);
      values.push(updates.ad_credits || updates.adCredits);
    }
    if (updates.last_login !== undefined || updates.lastLogin !== undefined) {
      setClauses.push(`last_login = $${paramIndex++}`);
      values.push(updates.last_login || updates.lastLogin);
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) return null;
    return new UserInstance(result.rows[0]);
  }

  /**
   * Create new user
   */
  static async create({ email, password, name, userType = 'homeowner', credits = 5 }) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, user_type, credits, ad_credits)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [email.toLowerCase(), hashedPassword, name, userType, credits, 0]
    );

    return new UserInstance(result.rows[0]);
  }
}

/**
 * User Instance - represents a single user with methods
 */
class UserInstance {
  constructor(data) {
    this._id = data.id;
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.userType = data.user_type;
    this.credits = data.credits;
    this.adCredits = data.ad_credits;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;

    // Shopify data
    if (data.shopify_connected) {
      this.shopify = {
        connected: data.shopify_connected,
        storeDomain: data.shopify_store_domain,
        accessToken: data.shopify_access_token,
        scope: data.shopify_scope,
        storeName: data.shopify_store_name,
        connectedAt: data.shopify_connected_at,
      };
    }
  }

  /**
   * Compare password
   */
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Save user (for lastLogin updates)
   */
  async save() {
    const result = await pool.query(
      `UPDATE users SET last_login = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [this.lastLogin || new Date(), new Date(), this.id]
    );
    return new UserInstance(result.rows[0]);
  }
}

export default User;
