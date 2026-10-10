import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbUrlLine ? dbUrlLine.split('DATABASE_URL=')[1].replace(/["']/g, '').trim() : '';

const sql = neon(dbUrl);

async function migrateAndSeed() {
  console.log('--- Initializing Neon PostgreSQL Schema ---');

  // 1. Create Tables
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'super_admin',
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id VARCHAR(64) PRIMARY KEY,
      admin_user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      short_description TEXT,
      description TEXT NOT NULL,
      category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
      sku VARCHAR(100) NOT NULL UNIQUE,
      product_type VARCHAR(32) NOT NULL DEFAULT 'ready_made',
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      is_featured BOOLEAN NOT NULL DEFAULT false,
      is_bestseller BOOLEAN NOT NULL DEFAULT false,
      regular_price NUMERIC(10, 2) NOT NULL,
      sale_price NUMERIC(10, 2),
      cost_price NUMERIC(10, 2),
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      track_inventory BOOLEAN NOT NULL DEFAULT true,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      allow_backorders BOOLEAN NOT NULL DEFAULT false,
      enable_variants BOOLEAN NOT NULL DEFAULT false,
      enable_personalization BOOLEAN NOT NULL DEFAULT false,
      custom_name_enabled BOOLEAN NOT NULL DEFAULT false,
      custom_initials_enabled BOOLEAN NOT NULL DEFAULT false,
      custom_color_enabled BOOLEAN NOT NULL DEFAULT false,
      custom_design_enabled BOOLEAN NOT NULL DEFAULT false,
      custom_image_upload_enabled BOOLEAN NOT NULL DEFAULT false,
      personalization_surcharge NUMERIC(10, 2) DEFAULT '0.00',
      customization_instructions TEXT,
      production_time_days INTEGER NOT NULL DEFAULT 3,
      gift_wrapping_available BOOLEAN NOT NULL DEFAULT true,
      gift_wrapping_charge NUMERIC(10, 2) DEFAULT '49.00',
      custom_order_notes_enabled BOOLEAN NOT NULL DEFAULT true,
      weight NUMERIC(8, 2),
      dimensions VARCHAR(100),
      shipping_class VARCHAR(50) DEFAULT 'standard',
      is_free_shipping BOOLEAN NOT NULL DEFAULT false,
      care_instructions TEXT,
      materials TEXT,
      dispatch_time_days INTEGER NOT NULL DEFAULT 2,
      seo_title VARCHAR(255),
      seo_description TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_images (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      alt_text VARCHAR(255),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_primary BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) NOT NULL UNIQUE,
      price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT '0.00',
      inventory INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id VARCHAR(64) REFERENCES product_variants(id) ON DELETE SET NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      reason VARCHAR(50) NOT NULL,
      notes TEXT,
      admin_user_id VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discount_type VARCHAR(20) NOT NULL,
      discount_value NUMERIC(10, 2) NOT NULL,
      minimum_spend NUMERIC(10, 2),
      maximum_discount NUMERIC(10, 2),
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      usage_limit INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      order_number VARCHAR(64) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      shipping_address_line1 TEXT NOT NULL,
      shipping_address_line2 TEXT,
      shipping_city VARCHAR(100) NOT NULL,
      shipping_state VARCHAR(100) NOT NULL,
      shipping_postal_code VARCHAR(20) NOT NULL,
      shipping_country VARCHAR(100) NOT NULL DEFAULT 'India',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      subtotal NUMERIC(10, 2) NOT NULL,
      discount_total NUMERIC(10, 2) NOT NULL DEFAULT '0.00',
      coupon_code VARCHAR(50),
      shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT '0.00',
      gift_wrap_fee NUMERIC(10, 2) NOT NULL DEFAULT '0.00',
      is_gift_wrapped BOOLEAN NOT NULL DEFAULT false,
      gift_message TEXT,
      total_amount NUMERIC(10, 2) NOT NULL,
      customer_notes TEXT,
      internal_notes TEXT,
      tracking_number VARCHAR(100),
      courier_partner VARCHAR(100),
      cancellation_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL REFERENCES products(id),
      variant_id VARCHAR(64) REFERENCES product_variants(id),
      product_name VARCHAR(255) NOT NULL,
      variant_name VARCHAR(255),
      sku VARCHAR(100) NOT NULL,
      unit_price NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      personalization_details JSONB,
      reference_image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      gateway VARCHAR(32) NOT NULL DEFAULT 'cashfree',
      transaction_id VARCHAR(100),
      gateway_order_id VARCHAR(100),
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50),
      payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
      store_name VARCHAR(255) NOT NULL DEFAULT 'Aura Resin Art Studio',
      store_tagline VARCHAR(255) NOT NULL DEFAULT 'Handmade Resin Elegance, Preserved Forever',
      store_description TEXT,
      logo_url TEXT,
      contact_email VARCHAR(255) NOT NULL DEFAULT 'hello@auraresinart.com',
      contact_phone VARCHAR(50) DEFAULT '+91 98765 43210',
      whatsapp_number VARCHAR(50) DEFAULT '+919876543210',
      instagram_url TEXT DEFAULT 'https://instagram.com/auraresinart',
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      default_shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT '79.00',
      free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT '999.00',
      production_time_message TEXT,
      shipping_policy TEXT,
      return_policy TEXT,
      privacy_policy TEXT,
      terms_conditions TEXT,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS custom_requests (
      id VARCHAR(64) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      colors TEXT,
      dimensions VARCHAR(100),
      budget_range VARCHAR(50),
      deadline TIMESTAMP WITH TIME ZONE,
      reference_images JSONB,
      status VARCHAR(32) NOT NULL DEFAULT 'new',
      admin_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  console.log('✓ All 14 PostgreSQL tables successfully verified/created in Neon!');

  // 2. Seed Default Admin
  const adminHash = await bcrypt.hash('AdminSecret2025!', 10);
  await sql`
    INSERT INTO admin_users (id, email, name, password_hash, role, is_active)
    VALUES ('admin_primary', 'admin@auraresinart.com', 'Aura Resin Admin', ${adminHash}, 'super_admin', true)
    ON CONFLICT (email) DO UPDATE SET password_hash = ${adminHash};
  `;
  console.log('✓ Admin account seeded: admin@auraresinart.com');

  // 3. Seed Site Settings
  await sql`
    INSERT INTO site_settings (
      id, store_name, store_tagline, store_description, contact_email, default_shipping_charge, free_shipping_threshold
    ) VALUES (
      'default',
      'Aura Resin Art Studio',
      'Handmade Resin Elegance, Preserved Forever',
      'Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.',
      'devangi0403@gmail.com',
      '79.00',
      '999.00'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  console.log('✓ Site settings seeded.');

  console.log('--- Migration & Seeding Complete! ---');
}

migrateAndSeed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
