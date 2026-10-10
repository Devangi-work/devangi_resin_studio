import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { initialCategories, initialProducts, initialCoupons } from '../src/lib/db/seed-data.ts';

const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbUrlLine ? dbUrlLine.split('DATABASE_URL=')[1].replace(/["']/g, '').trim() : '';
const sql = neon(dbUrl);

async function runSeed() {
  console.log('--- Seeding Neon Database with Production Catalog ---');

  // 1. Seed Admin
  const adminHash = await bcrypt.hash('AdminSecret2025!', 10);
  await sql`
    INSERT INTO admin_users (id, email, full_name, password_hash, role)
    VALUES ('admin_primary', 'admin@auraresinart.com', 'Aura Resin Studio Admin', ${adminHash}, 'owner')
    ON CONFLICT (email) DO UPDATE SET password_hash = ${adminHash};
  `;
  console.log('✓ Admin account seeded: admin@auraresinart.com');

  // 2. Seed Categories
  for (const cat of initialCategories) {
    await sql`
      INSERT INTO categories (id, name, slug, description, image_url, display_order, is_published)
      VALUES (${cat.id}, ${cat.name}, ${cat.slug}, ${cat.description}, ${cat.imageUrl}, ${cat.displayOrder}, ${cat.isPublished})
      ON CONFLICT (slug) DO UPDATE SET 
        name = ${cat.name},
        description = ${cat.description},
        image_url = ${cat.imageUrl};
    `;
  }
  console.log(`✓ Seeded ${initialCategories.length} categories.`);

  // 3. Seed Products, Images & Variants
  for (const p of initialProducts) {
    await sql`
      INSERT INTO products (
        id, name, slug, short_description, description, category_id, sku, product_type,
        status, is_featured, is_bestseller, regular_price, sale_price, cost_price,
        currency, track_inventory, stock_quantity, low_stock_threshold, allow_backorders,
        enable_variants, enable_personalization, custom_name_enabled, custom_initials_enabled,
        custom_color_enabled, custom_design_enabled, custom_image_upload_enabled,
        personalization_surcharge, customization_instructions, production_time_days,
        gift_wrapping_available, gift_wrapping_charge, custom_order_notes_enabled,
        weight, dimensions, shipping_class, is_free_shipping, care_instructions,
        materials, dispatch_time_days, seo_title, seo_description
      ) VALUES (
        ${p.id}, ${p.name}, ${p.slug}, ${p.shortDescription}, ${p.description}, ${p.categoryId}, ${p.sku}, ${p.productType},
        ${p.status}, ${p.isFeatured}, ${p.isBestseller}, ${p.regularPrice}, ${p.salePrice}, ${p.costPrice},
        ${p.currency}, ${p.trackInventory}, ${p.stockQuantity}, ${p.lowStockThreshold}, ${p.allowBackorders},
        ${p.enableVariants}, ${p.enablePersonalization}, ${p.customNameEnabled ?? false}, ${p.customInitialsEnabled ?? false},
        ${p.customColorEnabled ?? false}, ${p.customDesignEnabled ?? false}, ${p.customImageUploadEnabled ?? false},
        ${p.personalizationSurcharge ?? '0.00'}, ${p.customizationInstructions ?? null}, ${p.productionTimeDays},
        ${p.giftWrappingAvailable}, ${p.giftWrappingCharge}, ${p.customOrderNotesEnabled},
        ${p.weight}, ${p.dimensions}, ${p.shippingClass}, ${p.isFreeShipping}, ${p.careInstructions},
        ${p.materials}, ${p.dispatchTimeDays}, ${p.seoTitle}, ${p.seoDescription}
      )
      ON CONFLICT (slug) DO NOTHING;
    `;

    // Seed Images
    if (p.images && p.images.length > 0) {
      for (const img of p.images) {
        await sql`
          INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary)
          VALUES (${img.id}, ${p.id}, ${img.imageUrl}, ${img.altText}, ${img.displayOrder}, ${img.isPrimary})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // Seed Variants
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        await sql`
          INSERT INTO product_variants (id, product_id, name, sku, price_adjustment, inventory, is_active)
          VALUES (${v.id}, ${p.id}, ${v.name}, ${v.sku}, ${v.priceAdjustment}, ${v.inventory}, ${v.isActive})
          ON CONFLICT (sku) DO NOTHING;
        `;
      }
    }
  }
  console.log(`✓ Seeded ${initialProducts.length} products with images and variants.`);

  // 4. Seed Coupons
  for (const c of initialCoupons) {
    await sql`
      INSERT INTO coupons (
        id, code, discount_type, discount_value, min_cart_amount, max_discount,
        start_date, expiry_date, max_redemptions, current_redemptions, is_active
      ) VALUES (
        ${c.id}, ${c.code}, ${c.discountType}, ${c.discountValue}, 
        ${c.minimumSpend ?? '0.00'}, ${c.maximumDiscount ?? '0.00'},
        ${c.startDate ? new Date(c.startDate) : null}, ${c.endDate ? new Date(c.endDate) : null},
        ${c.usageLimit ?? 100}, ${c.usageCount ?? 0}, ${c.isActive}
      )
      ON CONFLICT (code) DO NOTHING;
    `;
  }
  console.log(`✓ Seeded ${initialCoupons.length} coupons.`);

  // 5. Seed Site Settings
  await sql`
    INSERT INTO site_settings (
      id, store_name, store_tagline, store_description, contact_email,
      default_shipping_charge, free_shipping_threshold, production_time_message,
      shipping_policy, return_policy, privacy_policy
    ) VALUES (
      'default',
      'Aura Resin Art Studio',
      'Handmade Resin Elegance, Preserved Forever',
      'Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.',
      'devangi0403@gmail.com',
      '79.00',
      '999.00',
      'Each handcrafted resin item takes 3-5 days for precision curing before dispatch.',
      'Insured express delivery across India takes 4-7 business days.',
      'Handcrafted items are backed by our 7-day transit replacement guarantee.',
      'We value your privacy and never sell or share your personal information.'
    )
    ON CONFLICT (id) DO UPDATE SET
      contact_email = 'devangi0403@gmail.com';
  `;
  console.log('✓ Site settings updated.');

  console.log('--- Neon Database Seeding Completed Successfully! ---');
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
