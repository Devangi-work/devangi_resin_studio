import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------------------------------------------------------------
// 1. ADMIN USERS & SESSIONS
// -------------------------------------------------------------
export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    role: text("role").default("admin").notNull(), // 'owner' | 'admin'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("admin_users_email_idx").on(table.email),
  ]
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("admin_sessions_user_idx").on(table.userId),
    uniqueIndex("admin_sessions_token_idx").on(table.sessionToken),
  ]
);

// -------------------------------------------------------------
// 2. CATEGORIES
// -------------------------------------------------------------
export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_published_idx").on(table.isPublished),
  ]
);

// -------------------------------------------------------------
// 3. PRODUCTS
// -------------------------------------------------------------
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    shortDescription: text("short_description"),
    description: text("description").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    sku: text("sku").notNull().unique(),
    productType: text("product_type").default("ready_made").notNull(), // 'ready_made' | 'made_to_order' | 'customised'
    status: text("status").default("draft").notNull(), // 'draft' | 'published' | 'archived'
    isFeatured: boolean("is_featured").default(false).notNull(),
    isBestseller: boolean("is_bestseller").default(false).notNull(),

    // Pricing (Stored as numeric string in DB, 2 decimal places)
    regularPrice: numeric("regular_price", { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
    costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
    currency: text("currency").default("INR").notNull(),
    scheduledSaleStart: timestamp("scheduled_sale_start"),
    scheduledSaleEnd: timestamp("scheduled_sale_end"),

    // Inventory
    trackInventory: boolean("track_inventory").default(true).notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(3).notNull(),
    allowBackorders: boolean("allow_backorders").default(false).notNull(),

    // Variants toggle
    enableVariants: boolean("enable_variants").default(false).notNull(),

    // Resin Customisation Fields
    enablePersonalization: boolean("enable_personalization").default(false).notNull(),
    customNameEnabled: boolean("custom_name_enabled").default(false).notNull(),
    customInitialsEnabled: boolean("custom_initials_enabled").default(false).notNull(),
    customColorEnabled: boolean("custom_color_enabled").default(false).notNull(),
    customDesignEnabled: boolean("custom_design_enabled").default(false).notNull(),
    customImageUploadEnabled: boolean("custom_image_upload_enabled").default(false).notNull(),
    personalizationSurcharge: numeric("personalization_surcharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
    customizationInstructions: text("customization_instructions"),
    productionTimeDays: integer("production_time_days").default(3).notNull(),
    giftWrappingAvailable: boolean("gift_wrapping_available").default(true).notNull(),
    giftWrappingCharge: numeric("gift_wrapping_charge", { precision: 10, scale: 2 }).default("49.00").notNull(),
    customOrderNotesEnabled: boolean("custom_order_notes_enabled").default(true).notNull(),

    // Shipping & Specifications
    weight: numeric("weight", { precision: 8, scale: 2 }), // in grams
    dimensions: text("dimensions"), // e.g. "10 x 10 x 1 cm"
    shippingClass: text("shipping_class").default("standard").notNull(),
    isFreeShipping: boolean("is_free_shipping").default(false).notNull(),
    careInstructions: text("care_instructions"),
    materials: text("materials"),
    dispatchTimeDays: integer("dispatch_time_days").default(2).notNull(),

    // SEO
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.categoryId),
    index("products_status_idx").on(table.status),
    index("products_featured_idx").on(table.isFeatured),
    index("products_bestseller_idx").on(table.isBestseller),
  ]
);

// -------------------------------------------------------------
// 4. PRODUCT IMAGES
// -------------------------------------------------------------
export const productImages = pgTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text").default("Resin Art Product Image"),
    displayOrder: integer("display_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    blobPathname: text("blob_pathname"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_images_product_idx").on(table.productId),
    index("product_images_order_idx").on(table.displayOrder),
  ]
);

// -------------------------------------------------------------
// 5. PRODUCT VARIANTS & OPTIONS
// -------------------------------------------------------------
export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g., "Size: Small / Color: Ocean Blue"
    sku: text("sku").notNull().unique(),
    priceAdjustment: numeric("price_adjustment", { precision: 10, scale: 2 }).default("0.00").notNull(),
    inventory: integer("inventory").default(0).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_variants_product_idx").on(table.productId),
    uniqueIndex("product_variants_sku_idx").on(table.sku),
  ]
);

export const productVariantOptions = pgTable(
  "product_variant_options",
  {
    id: text("id").primaryKey(),
    variantId: text("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionName: text("option_name").notNull(), // e.g., "Size", "Color"
    optionValue: text("option_value").notNull(), // e.g., "Small", "Rose Gold"
  },
  (table) => [
    index("product_variant_options_variant_idx").on(table.variantId),
  ]
);

// -------------------------------------------------------------
// 6. INVENTORY MOVEMENTS (AUDIT TRAIL)
// -------------------------------------------------------------
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    previousQuantity: integer("previous_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    changeAmount: integer("change_amount").notNull(),
    reason: text("reason").notNull(), // 'purchase', 'restock', 'manual_adjustment', 'damaged', 'cancellation'
    adminUserId: text("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("inventory_movements_product_idx").on(table.productId),
    index("inventory_movements_created_idx").on(table.createdAt),
  ]
);

// -------------------------------------------------------------
// 7. CUSTOMERS & ADDRESSES
// -------------------------------------------------------------
export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("customers_email_idx").on(table.email),
    index("customers_phone_idx").on(table.phone),
  ]
);

export const addresses = pgTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").default("India").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("addresses_customer_idx").on(table.customerId),
  ]
);

// -------------------------------------------------------------
// 8. ORDERS & ORDER ITEMS
// -------------------------------------------------------------
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(), // e.g., "RA-20261010-8942"
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),

    // Shipping Address Snapshot
    shippingAddressLine1: text("shipping_address_line1").notNull(),
    shippingAddressLine2: text("shipping_address_line2"),
    shippingCity: text("shipping_city").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingCountry: text("shipping_country").default("India").notNull(),

    orderNotes: text("order_notes"),

    // Financial calculations
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    shippingCharge: numeric("shipping_charge", { precision: 10, scale: 2 }).default("0.00").notNull(),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),

    // Order & Payment Status
    orderStatus: text("order_status").default("pending_payment").notNull(),
    // 'pending_payment' | 'confirmed' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
    paymentStatus: text("payment_status").default("pending").notNull(),
    // 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded'

    trackingNumber: text("tracking_number"),
    courierName: text("courier_name"),
    internalNotes: text("internal_notes"),
    secureLookupToken: text("secure_lookup_token").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_number_idx").on(table.orderNumber),
    index("orders_email_idx").on(table.customerEmail),
    index("orders_phone_idx").on(table.customerPhone),
    index("orders_status_idx").on(table.orderStatus),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_created_idx").on(table.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    
    // Immutable snapshot
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    variantName: text("variant_name"),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),

    // Resin Art Personalisation Snapshot
    personalizationDetails: jsonb("personalization_details"), // { customName, initials, color, design, notes }
    referenceImageUrl: text("reference_image_url"),
    giftWrapped: boolean("gift_wrapped").default(false).notNull(),
    giftWrapCharge: numeric("gift_wrap_charge", { precision: 10, scale: 2 }).default("0.00").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
  ]
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    previousStatus: text("previous_status").notNull(),
    newStatus: text("new_status").notNull(),
    notes: text("notes"),
    updatedBy: text("updated_by").default("system").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_status_history_order_idx").on(table.orderId),
  ]
);

// -------------------------------------------------------------
// 9. PAYMENTS & WEBHOOKS
// -------------------------------------------------------------
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    cashfreeOrderId: text("cashfree_order_id").notNull(),
    cashfreePaymentId: text("cashfree_payment_id"),
    paymentSessionId: text("payment_session_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("INR").notNull(),
    paymentStatus: text("payment_status").notNull(), // 'pending', 'paid', 'failed'
    paymentMethod: text("payment_method"), // 'upi', 'card', 'netbanking', 'wallet'
    paymentCompletionTime: timestamp("payment_completion_time"),
    rawResponse: jsonb("raw_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_cf_order_idx").on(table.cashfreeOrderId),
  ]
);

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    cashfreeOrderId: text("cashfree_order_id"),
    rawPayload: jsonb("raw_payload").notNull(),
    signatureValid: boolean("signature_valid").notNull(),
    processed: boolean("processed").default(false).notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payment_webhook_events_id_idx").on(table.eventId),
    index("payment_webhook_processed_idx").on(table.processed),
  ]
);

export const refunds = pgTable(
  "refunds",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    paymentId: text("payment_id").references(() => payments.id, { onDelete: "set null" }),
    cashfreeRefundId: text("cashfree_refund_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    status: text("status").default("pending").notNull(), // 'pending', 'successful', 'failed'
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("refunds_order_idx").on(table.orderId),
  ]
);

// -------------------------------------------------------------
// 10. COUPONS & REDEMPTIONS
// -------------------------------------------------------------
export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(), // e.g. "RESIN10", "WELCOME50"
    discountType: text("discount_type").notNull(), // 'percentage' | 'fixed'
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
    minCartAmount: numeric("min_cart_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }), // For percentage coupons
    startDate: timestamp("start_date"),
    expiryDate: timestamp("expiry_date"),
    maxRedemptions: integer("max_redemptions").default(100),
    currentRedemptions: integer("current_redemptions").default(0).notNull(),
    perCustomerLimit: integer("per_customer_limit").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("coupons_code_idx").on(table.code),
    index("coupons_active_idx").on(table.isActive),
  ]
);

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: text("id").primaryKey(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerEmail: text("customer_email").notNull(),
    discountApplied: numeric("discount_applied", { precision: 10, scale: 2 }).notNull(),
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  },
  (table) => [
    index("coupon_redemptions_coupon_idx").on(table.couponId),
    index("coupon_redemptions_email_idx").on(table.customerEmail),
  ]
);

// -------------------------------------------------------------
// 11. SITE SETTINGS
// -------------------------------------------------------------
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(), // singleton 'default'
  storeName: text("store_name").default("Aura Resin Art Studio").notNull(),
  storeTagline: text("store_tagline").default("Handmade Resin Elegance, Preserved Forever").notNull(),
  storeDescription: text("store_description").default("Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.").notNull(),
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email").default("hello@auraresinart.com").notNull(),
  contactPhone: text("contact_phone").default("+91 98765 43210").notNull(),
  whatsappNumber: text("whatsapp_number").default("+919876543210").notNull(),
  instagramUrl: text("instagram_url").default("https://instagram.com/auraresinart"),
  facebookUrl: text("facebook_url").default("https://facebook.com/auraresinart"),
  pinterestUrl: text("pinterest_url").default("https://pinterest.com/auraresinart"),
  currency: text("currency").default("INR").notNull(),
  defaultShippingCharge: numeric("default_shipping_charge", { precision: 10, scale: 2 }).default("79.00").notNull(),
  freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }).default("999.00").notNull(),
  taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }).default("0.00").notNull(),
  orderConfirmationMessage: text("order_confirmation_message").default("Thank you for your order! Each resin piece is carefully handcrafted with love and utmost precision.").notNull(),
  productionTimeMessage: text("production_time_message").default("Handmade resin items take 3 to 5 business days for precision curing before dispatch.").notNull(),
  returnPolicy: text("return_policy").default("Because each piece is custom handmade, returns are accepted within 7 days for damaged/defective items upon delivery."),
  shippingPolicy: text("shipping_policy").default("Standard insured domestic delivery across India takes 4-7 business days after curing."),
  privacyPolicy: text("privacy_policy").default("We value your privacy and never sell or share your personal information with third parties."),
  termsPolicy: text("terms_policy").default("All custom personalised resin orders enter production immediately upon payment confirmation."),
  careInstructionsDefault: text("care_instructions_default").default("Keep away from prolonged direct high heat. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners."),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------------------------------
// 12. BESPOKE CUSTOM REQUESTS
// -------------------------------------------------------------
export const customRequests = pgTable(
  "custom_requests",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    productType: text("product_type").notNull(), // 'Preserved Flowers Frame', 'Resin Table Clock', 'Geode Wall Clock', 'Nameplate'
    budget: text("budget"),
    description: text("description").notNull(),
    referenceImageUrl: text("reference_image_url"),
    status: text("status").default("new").notNull(), // 'new' | 'in_review' | 'quoted' | 'accepted' | 'declined'
    quoteAmount: numeric("quote_amount", { precision: 10, scale: 2 }),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("custom_requests_email_idx").on(table.customerEmail),
    index("custom_requests_status_idx").on(table.status),
  ]
);

// -------------------------------------------------------------
// 13. NEWSLETTER SUBSCRIBERS
// -------------------------------------------------------------
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    brevoContactId: text("brevo_contact_id"),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(table.email),
  ]
);

// -------------------------------------------------------------
// RELATIONS
// -------------------------------------------------------------
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  inventoryMovements: many(inventoryMovements),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  options: many(productVariantOptions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  statusHistory: many(orderStatusHistory),
  couponRedemptions: many(couponRedemptions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
