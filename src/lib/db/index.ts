import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { initialCategories, initialProducts, initialCoupons, initialOrders } from "./seed-data";

// Determine if a real live Neon DATABASE_URL is configured
const isLiveNeonConfigured = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("user:password@ep-sample") &&
  process.env.DATABASE_URL.startsWith("postgres")
);

// Neon Drizzle Client instance
export const sql = isLiveNeonConfigured ? neon(process.env.DATABASE_URL!) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

// Ensure new columns and tables exist on startup without requiring manual migration
if (sql) {
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;`.catch(() => { });
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_images JSONB DEFAULT '[]'::jsonb;`.catch(() => { });
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]'::jsonb;`.catch(() => { });
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_reason TEXT;`.catch(() => { });
  sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;`.catch(() => { });
  sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS signature_url TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/images/logo/resin_logo.png';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_discount_active BOOLEAN DEFAULT FALSE;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_name TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_tagline TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_discount_percentage TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_coupon_code TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_expires_at TIMESTAMP;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_banner_bg TEXT DEFAULT 'royal_wine';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_cta_text TEXT DEFAULT 'Shop Festive Deals';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_cta_url TEXT DEFAULT '/shop?filter=festival';`.catch(() => { });
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_festival_special BOOLEAN DEFAULT FALSE;`.catch(() => { });
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS festival_discount_type TEXT DEFAULT 'percentage';`.catch(() => { });
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS festival_discount_percentage NUMERIC(5, 2);`.catch(() => { });
  sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS festival_discount_amount NUMERIC(10, 2);`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_discount_type TEXT DEFAULT 'percentage';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS festival_discount_amount NUMERIC(10, 2);`.catch(() => { });
  sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_popup_seen BOOLEAN DEFAULT FALSE;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS keepsake_studio_images JSONB DEFAULT '[]'::jsonb;`.catch(() => { });
  sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_category_id TEXT;`.catch(() => { });
  sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_product_id TEXT;`.catch(() => { });
  sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_product_ids JSONB DEFAULT '[]'::jsonb;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS city_shipping_rates JSONB DEFAULT '[]'::jsonb;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS policy_pages_config JSONB DEFAULT '{}'::jsonb;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_active BOOLEAN DEFAULT FALSE;`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_tagline TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_image_url TEXT DEFAULT '';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_link_url TEXT DEFAULT '/shop';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_button_text TEXT DEFAULT 'Explore Now';`.catch(() => { });
  sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS popup_banner_expires_at TIMESTAMP;`.catch(() => { });
  sql`CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'image/png',
    alt_text TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
  );`.catch(() => { });
  sql`CREATE TABLE IF NOT EXISTS custom_requests (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    product_type TEXT NOT NULL,
    budget TEXT,
    description TEXT NOT NULL,
    reference_image_url TEXT,
    status TEXT DEFAULT 'new' NOT NULL,
    quote_amount NUMERIC(10, 2),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  );`.catch(() => { });
  sql`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_avatar TEXT,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE NOT NULL,
    admin_granted BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'published' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  );`.catch(() => { });
  sql`CREATE TABLE IF NOT EXISTS review_likes (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT review_likes_unique UNIQUE (review_id, user_identifier)
  );`.catch(() => { });
  sql`CREATE TABLE IF NOT EXISTS product_review_permissions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    granted_by_admin_id TEXT,
    has_reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT review_permissions_unique UNIQUE (product_id, customer_id)
  );`.catch(() => { });
}

// =========================================================================
// UNIVERSAL DATA STORE (Live Neon + Resilient Fallback Store)
// =========================================================================

// In-memory / session state fallback
interface StoreState {
  categories: any[];
  products: any[];
  orders: any[];
  coupons: any[];
  inventoryMovements: any[];
  siteSettings: any;
  customRequests: any[];
  mediaItems: any[];
  customers: any[];
  reviews: any[];
  reviewLikes: any[];
  productReviewPermissions: any[];
}

const globalForStore = globalThis as unknown as {
  __resinStore?: StoreState;
};

function getInitialStoreState(): StoreState {
  return {
    categories: JSON.parse(JSON.stringify(initialCategories)),
    products: JSON.parse(JSON.stringify(initialProducts)),
    orders: [],
    coupons: JSON.parse(JSON.stringify(initialCoupons)),
    mediaItems: [],
    customers: [
      {
        id: "cust_aarav",
        name: "Aarav Patel",
        email: "aarav.patel@gmail.com",
        avatarUrl: "/images/logo/resin_logo.png",
        isVerified: true,
      },
      {
        id: "cust_ananya",
        name: "Ananya Sharma",
        email: "ananya.s@outlook.com",
        avatarUrl: "/images/logo/resin_logo.png",
        isVerified: true,
      },
      {
        id: "cust_rohan",
        name: "Rohan Kapoor",
        email: "rohan.kapoor@gmail.com",
        avatarUrl: "/images/logo/resin_logo.png",
        isVerified: true,
      },
    ],
    reviews: [],
    reviewLikes: [],
    productReviewPermissions: [],
    inventoryMovements: [],
    siteSettings: {
      id: "default",
      storeName: "Devangi Resin Studio",
      storeTagline: "Handcrafted Resin Creations by Devangi",
      storeDescription: "Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.",
      logoUrl: "/images/logo/resin_logo.png",
      signatureUrl: "",
      contactEmail: "devangi0403@gmail.com",
      contactPhone: "+91 98765 43210",
      whatsappNumber: "+919876543210",
      instagramUrl: "https://www.instagram.com/devangi_resin_studio?cplk=dGV0MmUydXN2azcy",
      pinterestUrl: "https://pinterest.com/devangiresinstudio",
      currency: "INR",
      upiId: "devangi0403@okaxis",
      upiQrCodeUrl: "",
      accountHolderName: "Devangi Resin Studio",
      defaultShippingCharge: "79.00",
      freeShippingThreshold: "999.00",
      taxPercentage: "0.00",
      orderConfirmationMessage: "Thank you for your order! Each resin piece is carefully handcrafted with love and utmost precision.",
      productionTimeMessage: "Handmade resin items take 3 to 5 business days for precision curing before dispatch.",
      returnPolicy: "Because each piece is custom handmade, returns are accepted within 7 days for damaged/defective items upon delivery.",
      shippingPolicy: "Standard insured domestic delivery across India takes 4-7 business days after curing.",
      privacyPolicy: "We value your privacy and never sell or share your personal information with third parties.",
      termsPolicy: "All custom personalised resin orders enter production immediately upon payment confirmation.",
      careInstructionsDefault: "Keep away from prolonged direct high heat. Clean gently with a soft microfiber cloth and mild soap. Avoid harsh chemical cleaners.",
      festivalDiscountActive: true,
      festivalName: "Festive Sparkle Celebration",
      festivalTagline: "✨ FESTIVAL SPECIAL: Enjoy Flat 20% OFF on all Handcrafted Keepsakes, Geode Clocks & Floral Frames! Use Code FESTIVE20 at checkout ✨ Free Express Delivery across India over ₹999 ✨ Limited Period Festive Treats! ✨",
      festivalDiscountType: "percentage",
      festivalDiscountPercentage: "20%",
      festivalDiscountAmount: null,
      festivalCouponCode: "FESTIVE20",
      festivalExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      festivalBannerBg: "royal_wine",
      festivalCtaText: "Shop Festive Collection",
      festivalCtaUrl: "/shop?filter=festival",
      popupBannerActive: false,
      popupBannerTagline: "",
      popupBannerImageUrl: "",
      popupBannerLinkUrl: "/shop",
      popupBannerButtonText: "Explore Now",
      popupBannerExpiresAt: null,
      keepsakeStudioImages: [],
      cityShippingRates: [],
      policyPagesConfig: {},
      updatedAt: new Date(),
    },
    customRequests: [],
  };
}

const store: StoreState = globalForStore.__resinStore || getInitialStoreState();
if (store) {
  store.orders = [];
  store.reviews = [];
  store.customRequests = [];
  store.customers = store.customers.filter(
    (c: any) => !c.name?.toLowerCase().includes("priya") && !c.email?.toLowerCase().includes("priya")
  );
}
if (process.env.NODE_ENV !== "production") {
  globalForStore.__resinStore = store;
}

// =========================================================================
// REPOSITORY METHODS
// =========================================================================

export const dbStore = {
  // ---------------- CATEGORIES ----------------
  async getCategories(onlyPublished = false) {
    if (sql) {
      try {
        const rows = onlyPublished
          ? await sql`
              SELECT id, name, slug, description, image_url as "imageUrl", display_order as "displayOrder", is_published as "isPublished", created_at as "createdAt", updated_at as "updatedAt"
              FROM categories
              WHERE is_published = true
              ORDER BY display_order ASC;
            `
          : await sql`
              SELECT id, name, slug, description, image_url as "imageUrl", display_order as "displayOrder", is_published as "isPublished", created_at as "createdAt", updated_at as "updatedAt"
              FROM categories
              ORDER BY display_order ASC;
            `;
        if (rows && rows.length > 0) return rows;
      } catch (e) {
        console.error("DB getCategories error:", e);
      }
    }
    let cats = [...store.categories];
    if (onlyPublished) {
      cats = cats.filter((c) => c.isPublished);
    }
    return cats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async getCategoryBySlug(slug: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, name, slug, description, image_url as "imageUrl", display_order as "displayOrder", is_published as "isPublished"
          FROM categories
          WHERE slug = ${slug}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.error("DB getCategoryBySlug error:", e);
      }
    }
    return store.categories.find((c) => c.slug === slug) || null;
  },

  async getCategoryById(id: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, name, slug, description, image_url as "imageUrl", display_order as "displayOrder", is_published as "isPublished"
          FROM categories
          WHERE id = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.error("DB getCategoryById error:", e);
      }
    }
    return store.categories.find((c) => c.id === id) || null;
  },

  async createCategory(data: any) {
    const id = data.id || `cat_${Date.now()}`;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const displayOrder = Number(data.displayOrder) || (store.categories.length + 1);
    const isPublished = data.isPublished !== undefined ? Boolean(data.isPublished) : true;

    if (sql) {
      try {
        await sql`
          INSERT INTO categories (id, name, slug, description, image_url, display_order, is_published, created_at, updated_at)
          VALUES (${id}, ${data.name}, ${slug}, ${data.description || null}, ${data.imageUrl || null}, ${displayOrder}, ${isPublished}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            display_order = EXCLUDED.display_order,
            is_published = EXCLUDED.is_published,
            updated_at = NOW();
        `;
      } catch (e) {
        console.error("DB createCategory error:", e);
      }
    }

    const newCat = {
      ...data,
      id,
      slug,
      displayOrder,
      isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const existingIdx = store.categories.findIndex((c) => c.id === id);
    if (existingIdx !== -1) {
      store.categories[existingIdx] = newCat;
    } else {
      store.categories.push(newCat);
    }
    return newCat;
  },

  async updateCategory(id: string, data: any) {
    if (sql) {
      try {
        await sql`
          UPDATE categories
          SET
            name = COALESCE(${data.name || null}, name),
            slug = COALESCE(${data.slug || null}, slug),
            description = COALESCE(${data.description !== undefined ? data.description : null}, description),
            image_url = COALESCE(${data.imageUrl !== undefined ? data.imageUrl : null}, image_url),
            display_order = COALESCE(${data.displayOrder !== undefined ? Number(data.displayOrder) : null}, display_order),
            is_published = COALESCE(${data.isPublished !== undefined ? Boolean(data.isPublished) : null}, is_published),
            updated_at = NOW()
          WHERE id = ${id};
        `;
      } catch (e) {
        console.error("DB updateCategory error:", e);
      }
    }

    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories[idx] = {
        ...store.categories[idx],
        ...data,
        updatedAt: new Date(),
      };
      return store.categories[idx];
    }
    return { id, ...data };
  },

  async deleteCategory(id: string) {
    if (sql) {
      try {
        const prodCount = await sql`
          SELECT count(*) FROM products WHERE category_id = ${id} AND status != 'archived';
        `;
        if (prodCount && Number(prodCount[0].count) > 0) {
          throw new Error("Cannot delete category containing active products. Reassign or archive products first.");
        }
        await sql`DELETE FROM categories WHERE id = ${id};`;
      } catch (e: any) {
        if (e.message?.includes("Cannot delete category")) throw e;
        console.error("DB deleteCategory error:", e);
      }
    }

    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories.splice(idx, 1);
      return true;
    }
    return true;
  },

  async bulkDeleteCategories(ids: string[]) {
    let deletedCount = 0;
    for (const id of ids) {
      try {
        await this.deleteCategory(id);
        deletedCount++;
      } catch (e) {
        console.error(`Failed to delete category ${id}:`, e);
      }
    }
    return { deleted: true, count: deletedCount };
  },

  // ---------------- PRODUCTS ----------------
  async getProducts(filters?: {
    status?: string | string[];
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    isFeatured?: boolean;
    isBestseller?: boolean;
    isFestivalSpecial?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sort?: "price_asc" | "price_desc" | "newest" | "popularity";
    page?: number;
    limit?: number;
  }) {
    let prods: any[] = [];
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            p.id, p.name, p.slug, p.short_description as "shortDescription", p.description,
            p.category_id as "categoryId", p.sku, p.product_type as "productType", p.status,
            p.is_featured as "isFeatured", p.is_bestseller as "isBestseller",
            p.is_festival_special as "isFestivalSpecial",
            p.festival_discount_type as "festivalDiscountType",
            p.festival_discount_percentage as "festivalDiscountPercentage",
            p.festival_discount_amount as "festivalDiscountAmount",
            p.regular_price as "regularPrice", p.sale_price as "salePrice", p.cost_price as "costPrice",
            p.currency, p.track_inventory as "trackInventory", p.stock_quantity as "stockQuantity",
            p.low_stock_threshold as "lowStockThreshold", p.allow_backorders as "allowBackorders",
            p.enable_variants as "enableVariants", p.variant_groups as "variantGroups",
            p.enable_personalization as "enablePersonalization",
            p.custom_name_enabled as "customNameEnabled", p.custom_initials_enabled as "customInitialsEnabled",
            p.custom_color_enabled as "customColorEnabled", p.custom_color_palette as "customColorPalette",
            p.custom_design_enabled as "customDesignEnabled",
            p.custom_image_upload_enabled as "customImageUploadEnabled",
            p.personalization_surcharge as "personalizationSurcharge",
            p.customization_instructions as "customizationInstructions",
            p.production_time_days as "productionTimeDays",
            p.gift_wrapping_available as "giftWrappingAvailable",
            p.gift_wrapping_charge as "giftWrappingCharge",
            p.custom_order_notes_enabled as "customOrderNotesEnabled",
            p.weight, p.dimensions, p.shipping_class as "shippingClass",
            p.is_free_shipping as "isFreeShipping", p.care_instructions as "careInstructions",
            p.materials, p.dispatch_time_days as "dispatchTimeDays",
            p.seo_title as "seoTitle", p.seo_description as "seoDescription",
            p.created_at as "createdAt", p.updated_at as "updatedAt"
          FROM products p
          ORDER BY p.created_at DESC;
        `;
        if (rows && rows.length > 0) {
          const allImages = await sql`
            SELECT id, product_id as "productId", image_url as "imageUrl", alt_text as "altText", is_primary as "isPrimary", display_order as "displayOrder"
            FROM product_images
            ORDER BY is_primary DESC, display_order ASC;
          `;
          const allCats = await this.getCategories(false);
          prods = rows.map((p: any) => ({
            ...p,
            regularPrice: Number(p.regularPrice).toFixed(2),
            salePrice: p.salePrice ? Number(p.salePrice).toFixed(2) : null,
            variantGroups: typeof p.variantGroups === "string" ? JSON.parse(p.variantGroups) : (p.variantGroups || []),
            customColorPalette: typeof p.customColorPalette === "string" ? JSON.parse(p.customColorPalette) : (p.customColorPalette || []),
            images: allImages.filter((img: any) => img.productId === p.id),
            category: allCats.find((c: any) => c.id === p.categoryId),
          }));
        }
      } catch (e) {
        console.error("DB getProducts error, falling back to memory:", e);
      }
    }
    if (prods.length === 0) {
      prods = store.products.map((p) => ({
        ...p,
        category: p.category || store.categories.find((c) => c.id === p.categoryId),
      }));
    }

    // Status filter
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        prods = prods.filter((p) => filters.status!.includes(p.status));
      } else {
        prods = prods.filter((p) => p.status === filters.status);
      }
    }

    // Category filter
    if (filters?.categorySlug) {
      prods = prods.filter((p) => p.category?.slug === filters.categorySlug);
    } else if (filters?.categoryId) {
      prods = prods.filter((p) => p.categoryId === filters.categoryId);
    }

    // Search filter
    if (filters?.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(query))
      );
    }

    // Featured / Bestseller / Festival Special
    if (filters?.isFeatured !== undefined) {
      prods = prods.filter((p) => Boolean(p.isFeatured) === Boolean(filters.isFeatured));
    }
    if (filters?.isBestseller !== undefined) {
      prods = prods.filter((p) => Boolean(p.isBestseller) === Boolean(filters.isBestseller));
    }
    if (filters?.isFestivalSpecial !== undefined) {
      prods = prods.filter((p) => Boolean(p.isFestivalSpecial) === Boolean(filters.isFestivalSpecial));
    }

    const getEffectivePrice = (p: any): number => {
      const reg = Number(p.regularPrice) || 0;
      if (p.isFestivalSpecial) {
        const type = p.festivalDiscountType || "percentage";
        const rawFestAmt = p.festivalDiscountAmount ? Number(p.festivalDiscountAmount) : 0;
        const rawFestPct = p.festivalDiscountPercentage
          ? Number(String(p.festivalDiscountPercentage).replace(/%/g, "").trim())
          : 0;
        if (type === "fixed" && rawFestAmt > 0) {
          return Math.max(0, Number((reg - Math.min(reg, rawFestAmt)).toFixed(2)));
        } else if (rawFestPct > 0) {
          return Math.max(0, Number((reg - (reg * rawFestPct) / 100).toFixed(2)));
        } else if (rawFestAmt > 0) {
          return Math.max(0, Number((reg - Math.min(reg, rawFestAmt)).toFixed(2)));
        }
      }
      return Number(p.salePrice || p.regularPrice) || 0;
    };

    // Price range
    if (filters?.minPrice !== undefined) {
      prods = prods.filter((p) => {
        const price = getEffectivePrice(p);
        return price >= filters.minPrice!;
      });
    }
    if (filters?.maxPrice !== undefined) {
      prods = prods.filter((p) => {
        const price = getEffectivePrice(p);
        return price <= filters.maxPrice!;
      });
    }

    // Stock availability
    if (filters?.inStockOnly) {
      prods = prods.filter((p) => !p.trackInventory || p.stockQuantity > 0 || p.allowBackorders);
    }

    // Sorting
    if (filters?.sort === "price_asc") {
      prods.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (filters?.sort === "price_desc") {
      prods.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (filters?.sort === "popularity") {
      prods.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }

    const total = prods.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const startIndex = (page - 1) * limit;
    const paginated = prods.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getProductBySlug(slug: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            p.id, p.name, p.slug, p.short_description as "shortDescription", p.description,
            p.category_id as "categoryId", p.sku, p.product_type as "productType", p.status,
            p.is_featured as "isFeatured", p.is_bestseller as "isBestseller",
            p.is_festival_special as "isFestivalSpecial",
            p.festival_discount_type as "festivalDiscountType",
            p.festival_discount_percentage as "festivalDiscountPercentage",
            p.festival_discount_amount as "festivalDiscountAmount",
            p.regular_price as "regularPrice", p.sale_price as "salePrice", p.cost_price as "costPrice",
            p.currency, p.track_inventory as "trackInventory", p.stock_quantity as "stockQuantity",
            p.low_stock_threshold as "lowStockThreshold", p.allow_backorders as "allowBackorders",
            p.enable_variants as "enableVariants", p.variant_groups as "variantGroups",
            p.enable_personalization as "enablePersonalization",
            p.custom_name_enabled as "customNameEnabled", p.custom_initials_enabled as "customInitialsEnabled",
            p.custom_color_enabled as "customColorEnabled", p.custom_color_palette as "customColorPalette",
            p.custom_design_enabled as "customDesignEnabled",
            p.custom_image_upload_enabled as "customImageUploadEnabled",
            p.personalization_surcharge as "personalizationSurcharge",
            p.customization_instructions as "customizationInstructions",
            p.production_time_days as "productionTimeDays",
            p.gift_wrapping_available as "giftWrappingAvailable",
            p.gift_wrapping_charge as "giftWrappingCharge",
            p.custom_order_notes_enabled as "customOrderNotesEnabled",
            p.weight, p.dimensions, p.shipping_class as "shippingClass",
            p.is_free_shipping as "isFreeShipping", p.care_instructions as "careInstructions",
            p.materials, p.dispatch_time_days as "dispatchTimeDays",
            p.seo_title as "seoTitle", p.seo_description as "seoDescription",
            p.created_at as "createdAt", p.updated_at as "updatedAt"
          FROM products p
          WHERE p.slug = ${slug}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const p = rows[0];
          const images = await sql`
            SELECT id, product_id as "productId", image_url as "imageUrl", alt_text as "altText", is_primary as "isPrimary", display_order as "displayOrder"
            FROM product_images
            WHERE product_id = ${p.id}
            ORDER BY is_primary DESC, display_order ASC;
          `;
          const variants = await sql`
            SELECT id, product_id as "productId", name, sku, price_adjustment as "priceAdjustment", inventory, image_url as "imageUrl", is_active as "isActive"
            FROM product_variants
            WHERE product_id = ${p.id} AND is_active = true
            ORDER BY created_at ASC;
          `;
          const cat = await this.getCategoryById(p.categoryId);
          return {
            ...p,
            regularPrice: Number(p.regularPrice).toFixed(2),
            salePrice: p.salePrice ? Number(p.salePrice).toFixed(2) : null,
            variantGroups: typeof p.variantGroups === "string" ? JSON.parse(p.variantGroups) : (p.variantGroups || []),
            customColorPalette: typeof p.customColorPalette === "string" ? JSON.parse(p.customColorPalette) : (p.customColorPalette || []),
            images: images || [],
            variants: variants || [],
            category: cat,
          };
        }
      } catch (e) {
        console.error("DB getProductBySlug error:", e);
      }
    }
    const prod = store.products.find((p) => p.slug === slug);
    if (!prod) return null;
    const cat = store.categories.find((c) => c.id === prod.categoryId);
    const sortedImages = (prod.images || []).slice().sort((a: any, b: any) =>
      (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.displayOrder || 0) - (b.displayOrder || 0)
    );
    return { ...prod, images: sortedImages, category: cat };
  },

  async getProductById(id: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            p.id, p.name, p.slug, p.short_description as "shortDescription", p.description,
            p.category_id as "categoryId", p.sku, p.product_type as "productType", p.status,
            p.is_featured as "isFeatured", p.is_bestseller as "isBestseller",
            p.is_festival_special as "isFestivalSpecial",
            p.festival_discount_type as "festivalDiscountType",
            p.festival_discount_percentage as "festivalDiscountPercentage",
            p.festival_discount_amount as "festivalDiscountAmount",
            p.regular_price as "regularPrice", p.sale_price as "salePrice", p.cost_price as "costPrice",
            p.currency, p.track_inventory as "trackInventory", p.stock_quantity as "stockQuantity",
            p.low_stock_threshold as "lowStockThreshold", p.allow_backorders as "allowBackorders",
            p.enable_variants as "enableVariants", p.variant_groups as "variantGroups",
            p.enable_personalization as "enablePersonalization",
            p.custom_name_enabled as "customNameEnabled", p.custom_initials_enabled as "customInitialsEnabled",
            p.custom_color_enabled as "customColorEnabled", p.custom_color_palette as "customColorPalette",
            p.custom_design_enabled as "customDesignEnabled",
            p.custom_image_upload_enabled as "customImageUploadEnabled",
            p.personalization_surcharge as "personalizationSurcharge",
            p.customization_instructions as "customizationInstructions",
            p.production_time_days as "productionTimeDays",
            p.gift_wrapping_available as "giftWrappingAvailable",
            p.gift_wrapping_charge as "giftWrappingCharge",
            p.custom_order_notes_enabled as "customOrderNotesEnabled",
            p.weight, p.dimensions, p.shipping_class as "shippingClass",
            p.is_free_shipping as "isFreeShipping", p.care_instructions as "careInstructions",
            p.materials, p.dispatch_time_days as "dispatchTimeDays",
            p.seo_title as "seoTitle", p.seo_description as "seoDescription",
            p.created_at as "createdAt", p.updated_at as "updatedAt"
          FROM products p
          WHERE p.id = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const p = rows[0];
          const images = await sql`
            SELECT id, product_id as "productId", image_url as "imageUrl", alt_text as "altText", is_primary as "isPrimary", display_order as "displayOrder"
            FROM product_images
            WHERE product_id = ${p.id}
            ORDER BY is_primary DESC, display_order ASC;
          `;
          const variants = await sql`
            SELECT id, product_id as "productId", name, sku, price_adjustment as "priceAdjustment", inventory, image_url as "imageUrl", is_active as "isActive"
            FROM product_variants
            WHERE product_id = ${p.id} AND is_active = true
            ORDER BY created_at ASC;
          `;
          const cat = await this.getCategoryById(p.categoryId);
          return {
            ...p,
            regularPrice: Number(p.regularPrice).toFixed(2),
            salePrice: p.salePrice ? Number(p.salePrice).toFixed(2) : null,
            variantGroups: typeof p.variantGroups === "string" ? JSON.parse(p.variantGroups) : (p.variantGroups || []),
            customColorPalette: typeof p.customColorPalette === "string" ? JSON.parse(p.customColorPalette) : (p.customColorPalette || []),
            images: images || [],
            variants: variants || [],
            category: cat,
          };
        }
      } catch (e) {
        console.error("DB getProductById error:", e);
      }
    }
    const prod = store.products.find((p) => p.id === id);
    if (!prod) return null;
    const cat = store.categories.find((c) => c.id === prod.categoryId);
    const sortedImages = (prod.images || []).slice().sort((a: any, b: any) =>
      (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.displayOrder || 0) - (b.displayOrder || 0)
    );
    return { ...prod, images: sortedImages, category: cat };
  },

  async createProduct(data: any) {
    const id = data.id || `prod_${Date.now()}`;
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const sku = data.sku || `RA-${data.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "ART"}-${Math.floor(100 + Math.random() * 900)}`;
    const regularPrice = Number(data.regularPrice).toFixed(2);
    const salePrice = data.salePrice ? Number(data.salePrice).toFixed(2) : null;
    const costPrice = data.costPrice ? Number(data.costPrice).toFixed(2) : null;
    const stockQuantity = Number(data.stockQuantity) || 0;

    const sortedImages = (data.images || []).slice().sort((a: any, b: any) =>
      (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    if (sql) {
      try {
        await sql`
          INSERT INTO products (
            id, name, slug, short_description, description, category_id, sku,
            product_type, status, is_featured, is_bestseller, is_festival_special,
            festival_discount_type, festival_discount_percentage, festival_discount_amount,
            regular_price, sale_price, cost_price,
            currency, track_inventory, stock_quantity, low_stock_threshold, allow_backorders,
            enable_variants, variant_groups, enable_personalization, custom_name_enabled, custom_initials_enabled,
            custom_color_enabled, custom_color_palette, custom_design_enabled, custom_image_upload_enabled,
            personalization_surcharge, customization_instructions, production_time_days,
            gift_wrapping_available, gift_wrapping_charge, custom_order_notes_enabled,
            weight, dimensions, shipping_class, is_free_shipping, care_instructions,
            materials, dispatch_time_days, seo_title, seo_description, created_at, updated_at
          ) VALUES (
            ${id}, ${data.name}, ${slug}, ${data.shortDescription || null}, ${data.description},
            ${data.categoryId}, ${sku}, ${data.productType || 'ready_made'}, ${data.status || 'published'},
            ${Boolean(data.isFeatured)}, ${Boolean(data.isBestseller)}, ${Boolean(data.isFestivalSpecial)},
            ${data.festivalDiscountType || 'percentage'},
            ${data.festivalDiscountPercentage ? String(Number(data.festivalDiscountPercentage)) : null},
            ${data.festivalDiscountAmount ? String(Number(data.festivalDiscountAmount).toFixed(2)) : null},
            ${regularPrice}, ${salePrice}, ${costPrice},
            ${data.currency || 'INR'}, ${data.trackInventory !== false}, ${stockQuantity},
            ${Number(data.lowStockThreshold) || 3}, ${Boolean(data.allowBackorders)},
            ${Boolean(data.enableVariants)}, ${data.variantGroups ? JSON.stringify(data.variantGroups) : null}::jsonb,
            ${Boolean(data.enablePersonalization)},
            ${Boolean(data.customNameEnabled)}, ${Boolean(data.customInitialsEnabled)},
            ${Boolean(data.customColorEnabled)}, ${data.customColorPalette ? JSON.stringify(data.customColorPalette) : null}::jsonb,
            ${Boolean(data.customDesignEnabled)},
            ${Boolean(data.customImageUploadEnabled)},
            ${data.personalizationSurcharge ? String(Number(data.personalizationSurcharge).toFixed(2)) : '0.00'},
            ${data.customizationInstructions || null}, ${Number(data.productionTimeDays) || 3},
            ${data.giftWrappingAvailable !== false},
            ${data.giftWrappingCharge ? String(Number(data.giftWrappingCharge).toFixed(2)) : '49.00'},
            ${data.customOrderNotesEnabled !== false},
            ${data.weight ? String(Number(data.weight)) : null},
            ${data.dimensions || null}, ${data.shippingClass || 'standard'},
            ${Boolean(data.isFreeShipping)}, ${data.careInstructions || null},
            ${data.materials || null}, ${Number(data.dispatchTimeDays) || 2},
            ${data.seoTitle || null}, ${data.seoDescription || null},
            NOW(), NOW()
          );
        `;

        if (Array.isArray(sortedImages) && sortedImages.length > 0) {
          for (let i = 0; i < sortedImages.length; i++) {
            const img = sortedImages[i];
            if (img && img.imageUrl) {
              await sql`
                INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary, created_at)
                VALUES (${img.id || `img_${Date.now()}_${i}`}, ${id}, ${img.imageUrl}, ${img.altText || ''}, ${i + 1}, ${Boolean(img.isPrimary)}, NOW());
              `;
            }
          }
        }
      } catch (e) {
        console.error("DB createProduct error:", e);
      }
    }

    const newProduct = {
      ...data,
      id,
      slug,
      sku,
      regularPrice,
      salePrice,
      costPrice,
      stockQuantity,
      isFestivalSpecial: Boolean(data.isFestivalSpecial),
      festivalDiscountType: data.festivalDiscountType || "percentage",
      festivalDiscountPercentage: data.festivalDiscountPercentage || null,
      festivalDiscountAmount: data.festivalDiscountAmount ? Number(data.festivalDiscountAmount) : null,
      images: sortedImages,
      variants: data.variants || [],
      variantGroups: data.variantGroups || [],
      customColorPalette: data.customColorPalette || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.products.unshift(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, data: any) {
    if (sql) {
      try {
        const regularPriceVal = data.regularPrice !== undefined ? String(Number(data.regularPrice).toFixed(2)) : null;
        const salePriceVal = data.salePrice !== undefined ? (data.salePrice ? String(Number(data.salePrice).toFixed(2)) : null) : undefined;
        const costPriceVal = data.costPrice !== undefined ? (data.costPrice ? String(Number(data.costPrice).toFixed(2)) : null) : undefined;

        await sql`
          UPDATE products
          SET
            name = COALESCE(${data.name || null}, name),
            slug = COALESCE(${data.slug || null}, slug),
            short_description = CASE WHEN ${data.shortDescription !== undefined} THEN ${data.shortDescription} ELSE short_description END,
            description = COALESCE(${data.description || null}, description),
            category_id = COALESCE(${data.categoryId || null}, category_id),
            sku = COALESCE(${data.sku || null}, sku),
            product_type = COALESCE(${data.productType || null}, product_type),
            status = COALESCE(${data.status || null}, status),
            is_featured = CASE WHEN ${data.isFeatured !== undefined} THEN ${Boolean(data.isFeatured)} ELSE is_featured END,
            is_bestseller = CASE WHEN ${data.isBestseller !== undefined} THEN ${Boolean(data.isBestseller)} ELSE is_bestseller END,
            is_festival_special = CASE WHEN ${data.isFestivalSpecial !== undefined} THEN ${Boolean(data.isFestivalSpecial)} ELSE is_festival_special END,
            festival_discount_type = CASE WHEN ${data.festivalDiscountType !== undefined} THEN ${data.festivalDiscountType || 'percentage'} ELSE festival_discount_type END,
            festival_discount_percentage = CASE WHEN ${data.festivalDiscountPercentage !== undefined} THEN ${data.festivalDiscountPercentage ? String(Number(data.festivalDiscountPercentage)) : null} ELSE festival_discount_percentage END,
            festival_discount_amount = CASE WHEN ${data.festivalDiscountAmount !== undefined} THEN ${data.festivalDiscountAmount ? String(Number(data.festivalDiscountAmount).toFixed(2)) : null} ELSE festival_discount_amount END,
            regular_price = COALESCE(${regularPriceVal}, regular_price),
            sale_price = CASE WHEN ${data.salePrice !== undefined} THEN ${salePriceVal || null} ELSE sale_price END,
            cost_price = CASE WHEN ${data.costPrice !== undefined} THEN ${costPriceVal || null} ELSE cost_price END,
            stock_quantity = CASE WHEN ${data.stockQuantity !== undefined} THEN ${Number(data.stockQuantity)} ELSE stock_quantity END,
            track_inventory = CASE WHEN ${data.trackInventory !== undefined} THEN ${Boolean(data.trackInventory)} ELSE track_inventory END,
            low_stock_threshold = CASE WHEN ${data.lowStockThreshold !== undefined} THEN ${Number(data.lowStockThreshold)} ELSE low_stock_threshold END,
            allow_backorders = CASE WHEN ${data.allowBackorders !== undefined} THEN ${Boolean(data.allowBackorders)} ELSE allow_backorders END,

            enable_variants = CASE WHEN ${data.enableVariants !== undefined} THEN ${Boolean(data.enableVariants)} ELSE enable_variants END,
            variant_groups = CASE WHEN ${data.variantGroups !== undefined} THEN ${data.variantGroups ? JSON.stringify(data.variantGroups) : null}::jsonb ELSE variant_groups END,

            enable_personalization = CASE WHEN ${data.enablePersonalization !== undefined} THEN ${Boolean(data.enablePersonalization)} ELSE enable_personalization END,
            custom_name_enabled = CASE WHEN ${data.customNameEnabled !== undefined} THEN ${Boolean(data.customNameEnabled)} ELSE custom_name_enabled END,
            custom_initials_enabled = CASE WHEN ${data.customInitialsEnabled !== undefined} THEN ${Boolean(data.customInitialsEnabled)} ELSE custom_initials_enabled END,
            custom_color_enabled = CASE WHEN ${data.customColorEnabled !== undefined} THEN ${Boolean(data.customColorEnabled)} ELSE custom_color_enabled END,
            custom_color_palette = CASE WHEN ${data.customColorPalette !== undefined} THEN ${data.customColorPalette ? JSON.stringify(data.customColorPalette) : null}::jsonb ELSE custom_color_palette END,
            custom_design_enabled = CASE WHEN ${data.customDesignEnabled !== undefined} THEN ${Boolean(data.customDesignEnabled)} ELSE custom_design_enabled END,
            custom_image_upload_enabled = CASE WHEN ${data.customImageUploadEnabled !== undefined} THEN ${Boolean(data.customImageUploadEnabled)} ELSE custom_image_upload_enabled END,
            personalization_surcharge = CASE WHEN ${data.personalizationSurcharge !== undefined} THEN ${data.personalizationSurcharge ? String(Number(data.personalizationSurcharge).toFixed(2)) : '0.00'} ELSE personalization_surcharge END,
            customization_instructions = CASE WHEN ${data.customizationInstructions !== undefined} THEN ${data.customizationInstructions || null} ELSE customization_instructions END,
            production_time_days = CASE WHEN ${data.productionTimeDays !== undefined} THEN ${Number(data.productionTimeDays) || 3} ELSE production_time_days END,
            gift_wrapping_available = CASE WHEN ${data.giftWrappingAvailable !== undefined} THEN ${Boolean(data.giftWrappingAvailable)} ELSE gift_wrapping_available END,
            gift_wrapping_charge = CASE WHEN ${data.giftWrappingCharge !== undefined} THEN ${data.giftWrappingCharge ? String(Number(data.giftWrappingCharge).toFixed(2)) : '49.00'} ELSE gift_wrapping_charge END,
            custom_order_notes_enabled = CASE WHEN ${data.customOrderNotesEnabled !== undefined} THEN ${Boolean(data.customOrderNotesEnabled)} ELSE custom_order_notes_enabled END,

            weight = CASE WHEN ${data.weight !== undefined} THEN ${data.weight ? String(Number(data.weight)) : null} ELSE weight END,
            dimensions = CASE WHEN ${data.dimensions !== undefined} THEN ${data.dimensions || null} ELSE dimensions END,
            shipping_class = CASE WHEN ${data.shippingClass !== undefined} THEN ${data.shippingClass || 'standard'} ELSE shipping_class END,
            is_free_shipping = CASE WHEN ${data.isFreeShipping !== undefined} THEN ${Boolean(data.isFreeShipping)} ELSE is_free_shipping END,
            care_instructions = CASE WHEN ${data.careInstructions !== undefined} THEN ${data.careInstructions || null} ELSE care_instructions END,
            materials = CASE WHEN ${data.materials !== undefined} THEN ${data.materials || null} ELSE materials END,
            dispatch_time_days = CASE WHEN ${data.dispatchTimeDays !== undefined} THEN ${Number(data.dispatchTimeDays) || 2} ELSE dispatch_time_days END,
            seo_title = CASE WHEN ${data.seoTitle !== undefined} THEN ${data.seoTitle || null} ELSE seo_title END,
            seo_description = CASE WHEN ${data.seoDescription !== undefined} THEN ${data.seoDescription || null} ELSE seo_description END,
            updated_at = NOW()
          WHERE id = ${id};
        `;

        if (Array.isArray(data.images)) {
          await sql`DELETE FROM product_images WHERE product_id = ${id};`;
          for (let i = 0; i < data.images.length; i++) {
            const img = data.images[i];
            if (img && img.imageUrl) {
              await sql`
                INSERT INTO product_images (id, product_id, image_url, alt_text, display_order, is_primary, created_at)
                VALUES (${img.id || `img_${Date.now()}_${i}`}, ${id}, ${img.imageUrl}, ${img.altText || ''}, ${i + 1}, ${Boolean(img.isPrimary)}, NOW());
              `;
            }
          }
        }
      } catch (e) {
        console.error("DB updateProduct error:", e);
      }
    }

    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const prev = store.products[idx];
      store.products[idx] = {
        ...prev,
        ...data,
        regularPrice: data.regularPrice !== undefined ? Number(data.regularPrice).toFixed(2) : prev.regularPrice,
        salePrice: data.salePrice !== undefined && data.salePrice !== null ? Number(data.salePrice).toFixed(2) : data.salePrice === null ? null : prev.salePrice,
        stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : prev.stockQuantity,
        isFestivalSpecial: data.isFestivalSpecial !== undefined ? Boolean(data.isFestivalSpecial) : prev.isFestivalSpecial,
        festivalDiscountType: data.festivalDiscountType !== undefined ? data.festivalDiscountType : prev.festivalDiscountType,
        festivalDiscountPercentage: data.festivalDiscountPercentage !== undefined ? data.festivalDiscountPercentage : prev.festivalDiscountPercentage,
        festivalDiscountAmount: data.festivalDiscountAmount !== undefined ? (data.festivalDiscountAmount ? Number(data.festivalDiscountAmount) : null) : prev.festivalDiscountAmount,
        updatedAt: new Date(),
      };
      return store.products[idx];
    }
    return this.getProductById(id);
  },

  async duplicateProduct(id: string) {
    const original = await this.getProductById(id);
    if (!original) return null;

    const newId = `prod_${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: `${original.sku}-CPY`,
      status: "draft",
    };

    return this.createProduct(duplicated);
  },

  async deleteProduct(id: string) {
    if (sql) {
      try {
        await sql`DELETE FROM product_images WHERE product_id = ${id};`;
        await sql`DELETE FROM products WHERE id = ${id};`;
      } catch (e) {
        console.error("DB deleteProduct error:", e);
      }
    }
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.products.splice(idx, 1);
    }
    return { deleted: true };
  },

  async bulkDeleteProducts(ids: string[]) {
    if (sql && ids.length > 0) {
      try {
        for (const pid of ids) {
          await sql`DELETE FROM product_images WHERE product_id = ${pid};`;
          await sql`DELETE FROM products WHERE id = ${pid};`;
        }
      } catch (e) {
        console.error("DB bulkDeleteProducts error:", e);
      }
    }
    const idSet = new Set(ids);
    store.products = store.products.filter((p) => !idSet.has(p.id));
    return { deleted: true, count: ids.length };
  },

  async bulkUpdateProductStatus(ids: string[], status: "draft" | "published" | "archived") {
    if (sql && ids.length > 0) {
      try {
        for (const pid of ids) {
          await sql`UPDATE products SET status = ${status}, updated_at = NOW() WHERE id = ${pid};`;
        }
      } catch (e) {
        console.error("DB bulkUpdateProductStatus error:", e);
      }
    }
    store.products.forEach((p) => {
      if (ids.includes(p.id)) {
        p.status = status;
        p.updatedAt = new Date();
      }
    });
    return true;
  },

  async bulkUpdateFestivalSpecial(ids: string[], isFestivalSpecial: boolean) {
    if (sql && ids.length > 0) {
      try {
        for (const pid of ids) {
          await sql`UPDATE products SET is_festival_special = ${isFestivalSpecial}, updated_at = NOW() WHERE id = ${pid};`;
        }
      } catch (e) {
        console.error("DB bulkUpdateFestivalSpecial error:", e);
      }
    }
    const idSet = new Set(ids);
    store.products.forEach((p) => {
      if (idSet.has(p.id)) {
        p.isFestivalSpecial = isFestivalSpecial;
        p.updatedAt = new Date();
      }
    });
    return { success: true, count: ids.length, isFestivalSpecial };
  },

  // ---------------- INVENTORY ----------------
  async getInventoryOverview() {
    // Inventory strictly reflects the real products from the Product Catalogue
    const { products } = await this.getProducts({ limit: 1000 });
    return (products || [])
      .filter((p: any) => p.status !== "archived")
      .map((p: any) => {
        const stockQty = Number(p.stockQuantity) || 0;
        const threshold = Number(p.lowStockThreshold) || 3;
        const track = Boolean(p.trackInventory);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || "Uncategorized",
          trackInventory: track,
          stockQuantity: stockQty,
          lowStockThreshold: threshold,
          allowBackorders: Boolean(p.allowBackorders),
          isLowStock: track && stockQty <= threshold && stockQty > 0,
          isOutOfStock: track && stockQty <= 0,
          status: p.status,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
          images: p.images || [],
          variants: p.variants || [],
        };
      });
  },

  async adjustStock(productId: string, variantId: string | null, changeAmount: number, reason: string, adminUserId = "admin") {
    let prev = 0;
    let newQty = 0;

    if (sql) {
      try {
        const rows = await sql`SELECT stock_quantity, track_inventory FROM products WHERE id = ${productId};`;
        if (rows && rows.length > 0) {
          prev = Number(rows[0].stock_quantity) || 0;
          newQty = Math.max(0, prev + changeAmount);
          await sql`
            UPDATE products 
            SET stock_quantity = ${newQty}, updated_at = NOW() 
            WHERE id = ${productId};
          `;
          const movId = `mov_${Date.now()}`;
          await sql`
            INSERT INTO inventory_movements (id, product_id, variant_id, previous_quantity, new_quantity, change_amount, reason, admin_user_id, created_at)
            VALUES (${movId}, ${productId}, ${variantId || null}, ${prev}, ${newQty}, ${changeAmount}, ${reason}, ${adminUserId}, NOW());
          `.catch(() => {});
        }
      } catch (e) {
        console.error("DB adjustStock err:", e);
      }
    }

    const prod = store.products.find((p) => p.id === productId);
    if (prod) {
      prev = Number(prod.stockQuantity) || 0;
      prod.stockQuantity = Math.max(0, prev + changeAmount);
      newQty = prod.stockQuantity;
      store.inventoryMovements.unshift({
        id: `mov_${Date.now()}`,
        productId,
        variantId: variantId || null,
        previousQuantity: prev,
        newQuantity: prod.stockQuantity,
        changeAmount,
        reason,
        adminUserId,
        createdAt: new Date(),
      });
    }

    return { previousQuantity: prev, newQuantity: newQty };
  },

  async updateProductInventorySettings(
    productId: string,
    data: { stockQuantity?: number; trackInventory?: boolean; lowStockThreshold?: number; allowBackorders?: boolean; reason?: string },
    adminUserId = "admin"
  ) {
    let prevQty = 0;
    if (sql) {
      try {
        const current = await sql`SELECT stock_quantity, track_inventory, low_stock_threshold FROM products WHERE id = ${productId};`;
        if (current && current.length > 0) {
          prevQty = Number(current[0].stock_quantity) || 0;
        }

        await sql`
          UPDATE products
          SET 
            stock_quantity = COALESCE(${data.stockQuantity !== undefined ? Number(data.stockQuantity) : null}, stock_quantity),
            track_inventory = COALESCE(${data.trackInventory !== undefined ? Boolean(data.trackInventory) : null}, track_inventory),
            low_stock_threshold = COALESCE(${data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : null}, low_stock_threshold),
            allow_backorders = COALESCE(${data.allowBackorders !== undefined ? Boolean(data.allowBackorders) : null}, allow_backorders),
            updated_at = NOW()
          WHERE id = ${productId};
        `;

        if (data.stockQuantity !== undefined && data.stockQuantity !== prevQty) {
          const movId = `mov_${Date.now()}`;
          const diff = Number(data.stockQuantity) - prevQty;
          await sql`
            INSERT INTO inventory_movements (id, product_id, variant_id, previous_quantity, new_quantity, change_amount, reason, admin_user_id, created_at)
            VALUES (${movId}, ${productId}, null, ${prevQty}, ${Number(data.stockQuantity)}, ${diff}, ${data.reason || "Manual Stock Count Update"}, ${adminUserId}, NOW());
          `.catch(() => {});
        }
      } catch (e) {
        console.error("DB updateProductInventorySettings err:", e);
      }
    }

    const prod = store.products.find((p) => p.id === productId);
    if (prod) {
      prevQty = Number(prod.stockQuantity) || 0;
      if (data.stockQuantity !== undefined) {
        prod.stockQuantity = Number(data.stockQuantity);
        store.inventoryMovements.unshift({
          id: `mov_${Date.now()}`,
          productId,
          variantId: null,
          previousQuantity: prevQty,
          newQuantity: prod.stockQuantity,
          changeAmount: prod.stockQuantity - prevQty,
          reason: data.reason || "Manual Stock Count Update",
          adminUserId,
          createdAt: new Date(),
        });
      }
      if (data.trackInventory !== undefined) prod.trackInventory = Boolean(data.trackInventory);
      if (data.lowStockThreshold !== undefined) prod.lowStockThreshold = Number(data.lowStockThreshold);
      if (data.allowBackorders !== undefined) prod.allowBackorders = Boolean(data.allowBackorders);
    }

    return { success: true };
  },

  async getInventoryMovements(productId?: string) {
    if (sql) {
      try {
        const rows = productId
          ? await sql`
              SELECT 
                m.id,
                m.product_id as "productId",
                m.previous_quantity as "previousQuantity",
                m.new_quantity as "newQuantity",
                m.change_amount as "changeAmount",
                m.reason,
                m.admin_user_id as "adminUserId",
                m.created_at as "createdAt",
                p.name as "productName"
              FROM inventory_movements m
              JOIN products p ON m.product_id = p.id
              WHERE m.product_id = ${productId}
              ORDER BY m.created_at DESC
              LIMIT 100;
            `
          : await sql`
              SELECT 
                m.id,
                m.product_id as "productId",
                m.previous_quantity as "previousQuantity",
                m.new_quantity as "newQuantity",
                m.change_amount as "changeAmount",
                m.reason,
                m.admin_user_id as "adminUserId",
                m.created_at as "createdAt",
                p.name as "productName"
              FROM inventory_movements m
              JOIN products p ON m.product_id = p.id
              ORDER BY m.created_at DESC
              LIMIT 100;
            `;
        if (rows && rows.length > 0) return rows;
      } catch (e) {
        console.error("DB getInventoryMovements err:", e);
      }
    }

    if (productId) {
      return store.inventoryMovements.filter((m) => m.productId === productId);
    }
    return store.inventoryMovements.slice(0, 100);
  },

  // ---------------- ORDERS ----------------
  async getOrders(filters?: { status?: string; paymentStatus?: string; search?: string; source?: string }) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_id as "customerId",
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            shipping_address_line1 as "shippingAddressLine1",
            shipping_address_line2 as "shippingAddressLine2",
            shipping_city as "shippingCity",
            shipping_state as "shippingState",
            shipping_postal_code as "shippingPostalCode",
            shipping_country as "shippingCountry",
            order_notes as "orderNotes",
            subtotal,
            discount_amount as "discountAmount",
            discount_reason as "discountReason",
            shipping_charge as "shippingCharge",
            tax_amount as "taxAmount",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            payment_status as "paymentStatus",
            payment_method as "paymentMethod",
            upi_transaction_id as "upiTransactionId",
            payment_screenshot_url as "paymentScreenshotUrl",
            cancellation_reason as "cancellationReason",
            cancelled_at as "cancelledAt",
            tracking_number as "trackingNumber",
            courier_name as "courierName",
            internal_notes as "internalNotes",
            order_source as "orderSource",
            packing_images as "packingImages",
            product_images as "productImages",
            is_discarded as "isDiscarded",
            discarded_at as "discardedAt",
            secure_lookup_token as "secureLookupToken",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          ORDER BY created_at DESC;
        `;

        if (rows && rows.length > 0) {
          const orderIds = rows.map((r: any) => r.id);
          try {
            const allItems = await sql`
              SELECT 
                oi.id,
                oi.order_id as "orderId",
                oi.product_id as "productId",
                oi.variant_id as "variantId",
                oi.product_name as "productName",
                oi.variant_name as "variantName",
                oi.sku,
                oi.unit_price as "unitPrice",
                oi.quantity,
                oi.total_price as "totalPrice",
                oi.personalization_details as "personalizationDetails",
                oi.reference_image_url as "referenceImageUrl",
                COALESCE(
                  pi.image_url,
                  pi2.image_url,
                  oi.reference_image_url
                ) as "productImage"
              FROM order_items oi
              LEFT JOIN LATERAL (
                SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC, display_order ASC LIMIT 1
              ) pi ON true
              LEFT JOIN products p ON LOWER(p.name) = LOWER(oi.product_name) OR LOWER(p.sku) = LOWER(oi.sku)
              LEFT JOIN LATERAL (
                SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1
              ) pi2 ON true
              WHERE oi.order_id = ANY(${orderIds});
            `;
            const itemsByOrderId: Record<string, any[]> = {};
            for (const it of (allItems as any[] || [])) {
              if (!itemsByOrderId[it.orderId]) itemsByOrderId[it.orderId] = [];
              itemsByOrderId[it.orderId].push(it);
            }
            for (const ord of rows as any[]) {
              ord.items = itemsByOrderId[ord.id] || [];
            }
          } catch (itemErr) {
            console.error("[getOrders] order_items fetch err:", itemErr);
            for (const ord of rows as any[]) {
              ord.items = ord.items || [];
            }
          }

          let list = rows as any[];
          if (filters?.status && filters.status !== "all") {
            list = list.filter((o) => o.orderStatus === filters.status);
          }
          if (filters?.paymentStatus && filters.paymentStatus !== "all") {
            list = list.filter((o) => o.paymentStatus === filters.paymentStatus);
          }
          if (filters?.source && filters.source !== "all") {
            list = list.filter((o) => (o.orderSource || "online") === filters.source);
          }
          if (filters?.search && filters.search.trim()) {
            const q = filters.search.toLowerCase().trim();
            list = list.filter(
              (o) =>
                o.orderNumber?.toLowerCase().includes(q) ||
                o.customerName?.toLowerCase().includes(q) ||
                o.customerEmail?.toLowerCase().includes(q) ||
                o.customerPhone?.includes(q)
            );
          }
          return list;
        }
      } catch (err) {
        console.error("[getOrders] DB error, falling back to memory:", err);
      }
    }

    let ords = [...store.orders];

    if (filters?.status && filters.status !== "all") {
      ords = ords.filter((o) => o.orderStatus === filters.status);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== "all") {
      ords = ords.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.source && filters.source !== "all") {
      ords = ords.filter((o) => (o.orderSource || "online") === filters.source);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      ords = ords.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerEmail?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q)
      );
    }

    return ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_id as "customerId",
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            shipping_address_line1 as "shippingAddressLine1",
            shipping_address_line2 as "shippingAddressLine2",
            shipping_city as "shippingCity",
            shipping_state as "shippingState",
            shipping_postal_code as "shippingPostalCode",
            shipping_country as "shippingCountry",
            order_notes as "orderNotes",
            subtotal,
            discount_amount as "discountAmount",
            discount_reason as "discountReason",
            shipping_charge as "shippingCharge",
            tax_amount as "taxAmount",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            payment_status as "paymentStatus",
            payment_method as "paymentMethod",
            upi_transaction_id as "upiTransactionId",
            payment_screenshot_url as "paymentScreenshotUrl",
            cancellation_reason as "cancellationReason",
            cancelled_at as "cancelledAt",
            tracking_number as "trackingNumber",
            courier_name as "courierName",
            internal_notes as "internalNotes",
            order_source as "orderSource",
            packing_images as "packingImages",
            product_images as "productImages",
            is_discarded as "isDiscarded",
            discarded_at as "discardedAt",
            secure_lookup_token as "secureLookupToken",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          WHERE id = ${id} OR order_number = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const ord = rows[0];
          const items = await sql`
            SELECT 
              oi.id, oi.product_id as "productId", oi.variant_id as "variantId",
              oi.product_name as "productName", oi.variant_name as "variantName",
              oi.sku, oi.unit_price as "unitPrice", oi.quantity, oi.total_price as "totalPrice",
              oi.personalization_details as "personalizationDetails",
              oi.reference_image_url as "referenceImageUrl",
              COALESCE(
                pi.image_url,
                pi2.image_url,
                oi.reference_image_url
              ) as "productImage"
            FROM order_items oi
            LEFT JOIN LATERAL (
              SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC, display_order ASC LIMIT 1
            ) pi ON true
            LEFT JOIN products p ON LOWER(p.name) = LOWER(oi.product_name) OR LOWER(p.sku) = LOWER(oi.sku)
            LEFT JOIN LATERAL (
              SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1
            ) pi2 ON true
            WHERE oi.order_id = ${ord.id};
          `;
          ord.items = items || [];
          return ord;
        }
      } catch (err) {
        console.error("DB getOrderById error:", err);
      }
    }
    const memOrd = store.orders.find((o) => o.id === id || o.orderNumber === id);
    return memOrd || null;
  },

  async getOrderByNumber(orderNumber: string, verificationInput?: string) {
    let ord = null;
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_id as "customerId",
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            shipping_address_line1 as "shippingAddressLine1",
            shipping_address_line2 as "shippingAddressLine2",
            shipping_city as "shippingCity",
            shipping_state as "shippingState",
            shipping_postal_code as "shippingPostalCode",
            shipping_country as "shippingCountry",
            order_notes as "orderNotes",
            subtotal,
            discount_amount as "discountAmount",
            discount_reason as "discountReason",
            shipping_charge as "shippingCharge",
            tax_amount as "taxAmount",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            payment_status as "paymentStatus",
            payment_method as "paymentMethod",
            upi_transaction_id as "upiTransactionId",
            payment_screenshot_url as "paymentScreenshotUrl",
            cancellation_reason as "cancellationReason",
            cancelled_at as "cancelledAt",
            tracking_number as "trackingNumber",
            courier_name as "courierName",
            internal_notes as "internalNotes",
            order_source as "orderSource",
            packing_images as "packingImages",
            product_images as "productImages",
            is_discarded as "isDiscarded",
            discarded_at as "discardedAt",
            secure_lookup_token as "secureLookupToken",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          WHERE order_number = ${orderNumber}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          ord = rows[0];
          const items = await sql`
            SELECT 
              oi.id, oi.product_id as "productId", oi.variant_id as "variantId",
              oi.product_name as "productName", oi.variant_name as "variantName",
              oi.sku, oi.unit_price as "unitPrice", oi.quantity, oi.total_price as "totalPrice",
              oi.personalization_details as "personalizationDetails",
              oi.reference_image_url as "referenceImageUrl",
              COALESCE(
                pi.image_url,
                pi2.image_url,
                oi.reference_image_url
              ) as "productImage"
            FROM order_items oi
            LEFT JOIN LATERAL (
              SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC, display_order ASC LIMIT 1
            ) pi ON true
            LEFT JOIN products p ON LOWER(p.name) = LOWER(oi.product_name) OR LOWER(p.sku) = LOWER(oi.sku)
            LEFT JOIN LATERAL (
              SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1
            ) pi2 ON true
            WHERE oi.order_id = ${ord.id};
          `;
          ord.items = items || [];
        }
      } catch (err) {
        console.error("DB getOrderByNumber err:", err);
      }
    }

    if (!ord) {
      ord = store.orders.find((o) => o.orderNumber === orderNumber) || null;
    }

    if (!ord) return null;

    // Secure verification check: if input is provided, must match email, phone, or secureLookupToken
    if (verificationInput) {
      const cleanInput = verificationInput.trim().toLowerCase();
      const match =
        ord.customerEmail.toLowerCase() === cleanInput ||
        ord.customerPhone.replace(/[^0-9]/g, "").includes(cleanInput.replace(/[^0-9]/g, "")) ||
        ord.secureLookupToken === cleanInput;
      if (!match) return null;
    }

    return ord;
  },

  async createOrder(data: any) {
    const id = data.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = data.orderNumber || `RA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const secureLookupToken = `sec_${Math.random().toString(36).substring(2, 12)}`;
    const cleanCustomerEmail = data.customerEmail && data.customerEmail.trim() ? data.customerEmail.trim() : null;

    const newOrder = {
      ...data,
      id,
      orderNumber,
      secureLookupToken,
      customerEmail: cleanCustomerEmail,
      subtotal: Number(data.subtotal).toFixed(2),
      discountAmount: Number(data.discountAmount || 0).toFixed(2),
      discountReason: data.discountReason ? data.discountReason.trim() : null,
      shippingCharge: Number(data.shippingCharge || 0).toFixed(2),
      taxAmount: Number(data.taxAmount || 0).toFixed(2),
      totalAmount: Number(data.totalAmount).toFixed(2),
      orderStatus: data.orderStatus || "confirmed",
      paymentStatus: data.paymentStatus || "pending_verification",
      paymentMethod: data.paymentMethod || "upi",
      orderSource: data.orderSource || "online",
      packingImages: data.packingImages || [],
      productImages: data.productImages || [],
      isDiscarded: false,
      upiTransactionId: data.upiTransactionId || null,
      paymentScreenshotUrl: data.paymentScreenshotUrl || null,
      items: data.items || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.orders.unshift(newOrder);

    if (sql) {
      try {
        await sql`
          INSERT INTO orders (
            id, order_number, customer_id, customer_name, customer_email, customer_phone,
            shipping_address_line1, shipping_address_line2, shipping_city, shipping_state,
            shipping_postal_code, shipping_country, order_notes, subtotal, discount_amount, discount_reason,
            shipping_charge, tax_amount, total_amount, order_status, payment_status,
            payment_method, upi_transaction_id, payment_screenshot_url, secure_lookup_token, order_source,
            packing_images, product_images, is_discarded,
            created_at, updated_at
          ) VALUES (
            ${id}, ${orderNumber}, ${data.customerId || null}, ${data.customerName}, ${cleanCustomerEmail}, ${data.customerPhone},
            ${data.shippingAddressLine1 || null}, ${data.shippingAddressLine2 || null}, ${data.shippingCity || null}, ${data.shippingState || null},
            ${data.shippingPostalCode || null}, ${data.shippingCountry || (data.shippingAddressLine1 ? 'India' : null)}, ${data.orderNotes || null},
            ${Number(data.subtotal).toFixed(2)}, ${Number(data.discountAmount || 0).toFixed(2)}, ${data.discountReason ? data.discountReason.trim() : null},
            ${Number(data.shippingCharge || 0).toFixed(2)}, ${Number(data.taxAmount || 0).toFixed(2)},
            ${Number(data.totalAmount).toFixed(2)}, ${newOrder.orderStatus}, ${newOrder.paymentStatus},
            ${newOrder.paymentMethod}, ${newOrder.upiTransactionId}, ${newOrder.paymentScreenshotUrl}, ${secureLookupToken}, ${newOrder.orderSource},
            ${JSON.stringify(newOrder.packingImages)}::jsonb, ${JSON.stringify(newOrder.productImages)}::jsonb, false,
            NOW(), NOW()
          );
        `;

        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

            // Validate productId & variantId against database foreign keys to prevent FK constraint failures
            let safeProductId = null;
            if (item.productId) {
              try {
                const [pRow] = await sql`SELECT id FROM products WHERE id = ${item.productId} LIMIT 1;`;
                if (pRow) safeProductId = pRow.id;
              } catch {}
            }

            let safeVariantId = null;
            if (item.variantId) {
              try {
                const [vRow] = await sql`SELECT id FROM product_variants WHERE id = ${item.variantId} LIMIT 1;`;
                if (vRow) safeVariantId = vRow.id;
              } catch {}
            }

            await sql`
              INSERT INTO order_items (
                id, order_id, product_id, variant_id, product_name, variant_name,
                sku, unit_price, quantity, total_price, personalization_details, reference_image_url
              ) VALUES (
                ${itemId}, ${id}, ${safeProductId}, ${safeVariantId},
                ${item.productName || 'Handmade Resin Art'}, ${item.variantName || null},
                ${item.sku || 'SKU-CUSTOM'}, ${Number(item.price || item.unitPrice || 0).toFixed(2)},
                ${Number(item.quantity)}, ${Number((item.price || item.unitPrice || 0) * item.quantity).toFixed(2)},
                ${item.personalizationDetails ? JSON.stringify(item.personalizationDetails) : null},
                ${item.referenceImageUrl || null}
              );
            `;
          }
        }
      } catch (err) {
        console.error("[createOrder] DB insert error:", err);
      }
    }

    return newOrder;
  },

  async updateOrder(id: string, data: any, adminEmail = "admin") {
    const existingOrder = await this.getOrderById(id);
    if (!existingOrder) {
      return null;
    }

    const ordIndex = store.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    let ord = ordIndex !== -1 ? store.orders[ordIndex] : null;

    const cleanEmail = data.customerEmail !== undefined
      ? (data.customerEmail && data.customerEmail.trim() ? data.customerEmail.trim() : null)
      : undefined;

    if (ord) {
      if (data.customerName !== undefined) ord.customerName = data.customerName;
      if (cleanEmail !== undefined) ord.customerEmail = cleanEmail;
      if (data.customerPhone !== undefined) ord.customerPhone = data.customerPhone;
      if (data.shippingAddressLine1 !== undefined) ord.shippingAddressLine1 = data.shippingAddressLine1 ? data.shippingAddressLine1.trim() : null;
      if (data.shippingAddressLine2 !== undefined) ord.shippingAddressLine2 = data.shippingAddressLine2 ? data.shippingAddressLine2.trim() : null;
      if (data.shippingCity !== undefined) ord.shippingCity = data.shippingCity ? data.shippingCity.trim() : null;
      if (data.shippingState !== undefined) ord.shippingState = data.shippingState ? data.shippingState.trim() : null;
      if (data.shippingPostalCode !== undefined) ord.shippingPostalCode = data.shippingPostalCode ? data.shippingPostalCode.trim() : null;
      if (data.shippingCountry !== undefined) ord.shippingCountry = data.shippingCountry ? data.shippingCountry.trim() : null;
      if (data.orderSource !== undefined) ord.orderSource = data.orderSource;
      if (data.paymentMethod !== undefined) ord.paymentMethod = data.paymentMethod;
      if (data.paymentStatus !== undefined) ord.paymentStatus = data.paymentStatus;
      if (data.orderStatus !== undefined) ord.orderStatus = data.orderStatus;
      if (data.trackingNumber !== undefined) ord.trackingNumber = data.trackingNumber;
      if (data.courierName !== undefined) ord.courierName = data.courierName;
      if (data.upiTransactionId !== undefined) ord.upiTransactionId = data.upiTransactionId;
      if (data.paymentScreenshotUrl !== undefined) ord.paymentScreenshotUrl = data.paymentScreenshotUrl;
      if (data.orderNotes !== undefined) ord.orderNotes = data.orderNotes;
      if (data.subtotal !== undefined) ord.subtotal = Number(data.subtotal).toFixed(2);
      if (data.discountAmount !== undefined) ord.discountAmount = Number(data.discountAmount).toFixed(2);
      if (data.discountReason !== undefined) ord.discountReason = data.discountReason ? data.discountReason.trim() : null;
      if (data.shippingCharge !== undefined) ord.shippingCharge = Number(data.shippingCharge).toFixed(2);
      if (data.totalAmount !== undefined) ord.totalAmount = Number(data.totalAmount).toFixed(2);
      if (data.packingImages !== undefined) ord.packingImages = data.packingImages;
      if (data.productImages !== undefined) ord.productImages = data.productImages;
      if (data.internalNotes) {
        ord.internalNotes = ord.internalNotes ? `${ord.internalNotes}\n[${new Date().toISOString()}] ${data.internalNotes}` : data.internalNotes;
      }
      if (Array.isArray(data.items)) {
        ord.items = data.items.map((it: any) => ({
          ...it,
          id: it.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          orderId: id,
          unitPrice: Number(it.unitPrice || it.price || 0),
          totalPrice: Number((it.unitPrice || it.price || 0) * (it.quantity || 1)),
        }));
      }
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        const customerNameVal = data.customerName !== undefined ? data.customerName : existingOrder.customerName;
        const customerEmailVal = cleanEmail !== undefined ? cleanEmail : (existingOrder.customerEmail || null);
        const customerPhoneVal = data.customerPhone !== undefined ? (data.customerPhone || null) : (existingOrder.customerPhone || null);
        const shippingAddress1Val = data.shippingAddressLine1 !== undefined ? (data.shippingAddressLine1 ? data.shippingAddressLine1.trim() : null) : (existingOrder.shippingAddressLine1 || null);
        const shippingAddress2Val = data.shippingAddressLine2 !== undefined ? (data.shippingAddressLine2 ? data.shippingAddressLine2.trim() : null) : (existingOrder.shippingAddressLine2 || null);
        const shippingCityVal = data.shippingCity !== undefined ? (data.shippingCity ? data.shippingCity.trim() : null) : (existingOrder.shippingCity || null);
        const shippingStateVal = data.shippingState !== undefined ? (data.shippingState ? data.shippingState.trim() : null) : (existingOrder.shippingState || null);
        const shippingPostalCodeVal = data.shippingPostalCode !== undefined ? (data.shippingPostalCode ? data.shippingPostalCode.trim() : null) : (existingOrder.shippingPostalCode || null);
        const shippingCountryVal = data.shippingCountry !== undefined ? (data.shippingCountry ? data.shippingCountry.trim() : null) : (existingOrder.shippingCountry || null);
        const orderSourceVal = data.orderSource !== undefined ? data.orderSource : existingOrder.orderSource;
        const paymentMethodVal = data.paymentMethod !== undefined ? data.paymentMethod : existingOrder.paymentMethod;
        const paymentStatusVal = data.paymentStatus !== undefined ? data.paymentStatus : existingOrder.paymentStatus;
        const orderStatusVal = data.orderStatus !== undefined ? data.orderStatus : existingOrder.orderStatus;
        const trackingNumberVal = data.trackingNumber !== undefined ? (data.trackingNumber || null) : (existingOrder.trackingNumber || null);
        const courierNameVal = data.courierName !== undefined ? (data.courierName || null) : (existingOrder.courierName || null);
        const upiTransactionIdVal = data.upiTransactionId !== undefined ? (data.upiTransactionId || null) : (existingOrder.upiTransactionId || null);
        const paymentScreenshotUrlVal = data.paymentScreenshotUrl !== undefined ? (data.paymentScreenshotUrl || null) : (existingOrder.paymentScreenshotUrl || null);
        const orderNotesVal = data.orderNotes !== undefined ? (data.orderNotes || null) : (existingOrder.orderNotes || null);
        const subtotalVal = data.subtotal !== undefined ? Number(data.subtotal).toFixed(2) : existingOrder.subtotal;
        const discountAmountVal = data.discountAmount !== undefined ? Number(data.discountAmount).toFixed(2) : existingOrder.discountAmount;
        const discountReasonVal = data.discountReason !== undefined ? (data.discountReason ? data.discountReason.trim() : null) : (existingOrder.discountReason || null);
        const shippingChargeVal = data.shippingCharge !== undefined ? Number(data.shippingCharge).toFixed(2) : existingOrder.shippingCharge;
        const totalAmountVal = data.totalAmount !== undefined ? Number(data.totalAmount).toFixed(2) : existingOrder.totalAmount;
        const packingImagesVal = data.packingImages !== undefined ? JSON.stringify(data.packingImages) : JSON.stringify(existingOrder.packingImages || []);
        const productImagesVal = data.productImages !== undefined ? JSON.stringify(data.productImages) : JSON.stringify(existingOrder.productImages || []);
        const internalNotesVal = data.internalNotes !== undefined
          ? (data.internalNotes ? (existingOrder.internalNotes ? `${existingOrder.internalNotes}\n[${new Date().toISOString()}] ${data.internalNotes}` : data.internalNotes) : null)
          : (existingOrder.internalNotes || null);

        await sql`
          UPDATE orders
          SET
            customer_name = ${customerNameVal},
            customer_email = ${customerEmailVal},
            customer_phone = ${customerPhoneVal},
            shipping_address_line1 = ${shippingAddress1Val},
            shipping_address_line2 = ${shippingAddress2Val},
            shipping_city = ${shippingCityVal},
            shipping_state = ${shippingStateVal},
            shipping_postal_code = ${shippingPostalCodeVal},
            shipping_country = ${shippingCountryVal},
            order_source = ${orderSourceVal},
            payment_method = ${paymentMethodVal},
            payment_status = ${paymentStatusVal},
            order_status = ${orderStatusVal},
            tracking_number = ${trackingNumberVal},
            courier_name = ${courierNameVal},
            upi_transaction_id = ${upiTransactionIdVal},
            payment_screenshot_url = ${paymentScreenshotUrlVal},
            order_notes = ${orderNotesVal},
            subtotal = ${subtotalVal},
            discount_amount = ${discountAmountVal},
            discount_reason = ${discountReasonVal},
            shipping_charge = ${shippingChargeVal},
            total_amount = ${totalAmountVal},
            packing_images = ${packingImagesVal}::jsonb,
            product_images = ${productImagesVal}::jsonb,
            internal_notes = ${internalNotesVal},
            updated_at = NOW()
          WHERE id = ${existingOrder.id} OR order_number = ${id};
        `;

        if (data.orderStatus !== undefined && data.orderStatus !== existingOrder.orderStatus) {
          await sql`
            INSERT INTO order_status_history (id, order_id, status, notes, updated_by, created_at)
            VALUES (
              ${`osh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`},
              ${existingOrder.id},
              ${data.orderStatus},
              ${data.internalNotes || 'Status updated'},
              ${adminEmail || 'admin'},
              NOW()
            );
          `.catch(() => {});
        }

        if (Array.isArray(data.items) && data.items.length > 0) {
          await sql`DELETE FROM order_items WHERE order_id = ${existingOrder.id};`;
          for (const item of data.items) {
            const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await sql`
              INSERT INTO order_items (
                id, order_id, product_id, variant_id, product_name, variant_name,
                sku, unit_price, quantity, total_price, personalization_details, reference_image_url
              ) VALUES (
                ${itemId}, ${existingOrder.id}, ${item.productId || null}, ${item.variantId || null},
                ${item.productName || 'Handmade Resin Art'}, ${item.variantName || null},
                ${item.sku || 'SKU-CUSTOM'}, ${Number(item.price || item.unitPrice || 0).toFixed(2)},
                ${Number(item.quantity || 1)}, ${Number((item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)},
                ${item.personalizationDetails ? JSON.stringify(item.personalizationDetails) : null},
                ${item.referenceImageUrl || null}
              );
            `;
          }
        }
      } catch (err) {
        console.error("[updateOrder] DB error:", err);
        throw err;
      }
    }

    return await this.getOrderById(id);
  },

  async updateOrderStatus(
    id: string,
    newStatus: string,
    notes?: string,
    updatedBy = "admin",
    trackingNumber?: string,
    courierName?: string,
    packingImages?: string[]
  ) {
    const ord = store.orders.find((o) => o.id === id || o.orderNumber === id);
    if (ord) {
      ord.orderStatus = newStatus;
      if (notes) ord.internalNotes = `${ord.internalNotes || ""}\n[${new Date().toISOString()}] ${notes}`.trim();
      if (trackingNumber !== undefined) ord.trackingNumber = trackingNumber;
      if (courierName !== undefined) ord.courierName = courierName;
      if (packingImages !== undefined) ord.packingImages = packingImages;
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        if (packingImages !== undefined && notes) {
          await sql`
            UPDATE orders
            SET 
              order_status = ${newStatus},
              tracking_number = COALESCE(${trackingNumber ?? null}, tracking_number),
              courier_name = COALESCE(${courierName ?? null}, courier_name),
              packing_images = ${JSON.stringify(packingImages)}::jsonb,
              internal_notes = CONCAT(COALESCE(internal_notes, ''), E'\n', ${notes}::text),
              updated_at = NOW()
            WHERE id = ${id} OR order_number = ${id};
          `;
        } else if (packingImages !== undefined) {
          await sql`
            UPDATE orders
            SET 
              order_status = ${newStatus},
              tracking_number = COALESCE(${trackingNumber ?? null}, tracking_number),
              courier_name = COALESCE(${courierName ?? null}, courier_name),
              packing_images = ${JSON.stringify(packingImages)}::jsonb,
              updated_at = NOW()
            WHERE id = ${id} OR order_number = ${id};
          `;
        } else if (notes) {
          await sql`
            UPDATE orders
            SET 
              order_status = ${newStatus},
              tracking_number = COALESCE(${trackingNumber ?? null}, tracking_number),
              courier_name = COALESCE(${courierName ?? null}, courier_name),
              internal_notes = CONCAT(COALESCE(internal_notes, ''), E'\n', ${notes}::text),
              updated_at = NOW()
            WHERE id = ${id} OR order_number = ${id};
          `;
        } else {
          await sql`
            UPDATE orders
            SET 
              order_status = ${newStatus},
              tracking_number = COALESCE(${trackingNumber ?? null}, tracking_number),
              courier_name = COALESCE(${courierName ?? null}, courier_name),
              updated_at = NOW()
            WHERE id = ${id} OR order_number = ${id};
          `;
        }
      } catch (err) {
        console.error("DB updateOrderStatus err:", err);
      }
    }

    return this.getOrderById(id);
  },

  async updateOrderShipping(
    id: string,
    shippingCharge: number,
    address?: {
      shippingAddressLine1?: string;
      shippingAddressLine2?: string;
      shippingCity?: string;
      shippingState?: string;
      shippingPostalCode?: string;
    }
  ) {
    const ord = store.orders.find((o) => o.id === id || o.orderNumber === id);
    if (ord) {
      const oldShipping = Number(ord.shippingCharge || 0);
      const subtotal = Number(ord.subtotal) > 0 ? Number(ord.subtotal) : Math.max(0, Number(ord.totalAmount || 0) - oldShipping + Number(ord.discountAmount || 0));
      ord.subtotal = subtotal.toFixed(2);
      ord.shippingCharge = Number(shippingCharge).toFixed(2);
      const discount = Number(ord.discountAmount || 0);
      ord.totalAmount = Math.max(0, subtotal - discount + Number(shippingCharge)).toFixed(2);
      if (address?.shippingAddressLine1 !== undefined) ord.shippingAddressLine1 = address.shippingAddressLine1;
      if (address?.shippingAddressLine2 !== undefined) ord.shippingAddressLine2 = address.shippingAddressLine2;
      if (address?.shippingCity !== undefined) ord.shippingCity = address.shippingCity;
      if (address?.shippingState !== undefined) ord.shippingState = address.shippingState;
      if (address?.shippingPostalCode !== undefined) ord.shippingPostalCode = address.shippingPostalCode;
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            subtotal = CASE WHEN COALESCE(subtotal, 0) > 0 THEN subtotal ELSE GREATEST(0, (COALESCE(total_amount, 0) - COALESCE(shipping_charge, 0) + COALESCE(discount_amount, 0))) END,
            shipping_charge = ${Number(shippingCharge).toFixed(2)},
            total_amount = GREATEST(0, (
              (CASE WHEN COALESCE(subtotal, 0) > 0 THEN subtotal ELSE (COALESCE(total_amount, 0) - COALESCE(shipping_charge, 0) + COALESCE(discount_amount, 0)) END)
              - COALESCE(discount_amount, 0)
              + ${Number(shippingCharge)}
            )),
            shipping_address_line1 = COALESCE(${address?.shippingAddressLine1 ?? null}, shipping_address_line1),
            shipping_address_line2 = COALESCE(${address?.shippingAddressLine2 ?? null}, shipping_address_line2),
            shipping_city = COALESCE(${address?.shippingCity ?? null}, shipping_city),
            shipping_state = COALESCE(${address?.shippingState ?? null}, shipping_state),
            shipping_postal_code = COALESCE(${address?.shippingPostalCode ?? null}, shipping_postal_code),
            updated_at = NOW()
          WHERE id = ${id} OR order_number = ${id};
        `;
      } catch (err) {
        console.error("DB updateOrderShipping err:", err);
      }
    }

    return this.getOrderById(id);
  },


  async updateOrderPaymentStatus(orderNumberOrId: string, paymentStatus: string, details?: any) {
    const ord = store.orders.find((o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId);
    const previousPaymentStatus = ord?.paymentStatus;
    if (ord) {
      ord.paymentStatus = paymentStatus;
      if (paymentStatus === "paid" && previousPaymentStatus !== "paid") {
        ord.orderStatus = "confirmed";
      }
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            payment_status = ${paymentStatus},
            order_status = CASE 
              WHEN ${paymentStatus} = 'paid' AND order_status IN ('pending_payment', 'unpaid') THEN 'confirmed' 
              ELSE order_status 
            END,
            updated_at = NOW()
          WHERE id = ${orderNumberOrId} OR order_number = ${orderNumberOrId};
        `;
      } catch (err) {
        console.error("DB updateOrderPaymentStatus err:", err);
      }
    }

    if (paymentStatus === "paid" && previousPaymentStatus !== "paid" && ord?.items) {
      for (const item of ord.items) {
        if (item.productId) {
          try {
            await this.adjustStock(
              item.productId,
              item.variantId || null,
              -Number(item.quantity),
              `Order Paid (${ord.orderNumber})`,
              "system"
            );
          } catch (err) {
            console.error("Stock adjustment err:", err);
          }
        }
      }
    }

    return this.getOrderById(orderNumberOrId);
  },

  async updateOrderPaymentScreenshot(orderNumberOrId: string, paymentScreenshotUrl: string) {
    const ord = store.orders.find((o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId);
    if (ord) {
      ord.paymentScreenshotUrl = paymentScreenshotUrl;
      ord.updatedAt = new Date();
    }
    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET payment_screenshot_url = ${paymentScreenshotUrl}, updated_at = NOW()
          WHERE id = ${orderNumberOrId} OR order_number = ${orderNumberOrId};
        `;
      } catch (err) {
        console.error("DB updateOrderPaymentScreenshot err:", err);
      }
    }
    return this.getOrderById(orderNumberOrId);
  },

  async getCustomerLatestUnpaidOrder(customerIdOrEmail: string) {
    const clean = customerIdOrEmail.trim().toLowerCase();
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id, order_number as "orderNumber", customer_id as "customerId",
            customer_email as "customerEmail", payment_status as "paymentStatus",
            is_discarded as "isDiscarded", created_at as "createdAt"
          FROM orders
          WHERE (customer_id = ${customerIdOrEmail} OR LOWER(customer_email) = ${clean})
            AND payment_status = 'unpaid'
            AND (is_discarded IS FALSE OR is_discarded IS NULL)
          ORDER BY created_at DESC
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        console.error("DB getCustomerLatestUnpaidOrder err:", err);
      }
    }

    const mem = store.orders.find(
      (o) =>
        (o.customerId === customerIdOrEmail || o.customerEmail?.toLowerCase() === clean) &&
        o.paymentStatus === "unpaid" &&
        !o.isDiscarded
    );
    return mem || null;
  },

  async discardUnpaidOrder(orderNumberOrId: string) {
    const ord = store.orders.find((o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId);
    if (ord) {
      ord.isDiscarded = true;
      ord.discardedAt = new Date();
      ord.orderStatus = "cancelled";
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            is_discarded = TRUE,
            discarded_at = NOW(),
            order_status = 'cancelled',
            updated_at = NOW()
          WHERE id = ${orderNumberOrId} OR order_number = ${orderNumberOrId};
        `;
      } catch (err) {
        console.error("DB discardUnpaidOrder err:", err);
      }
    }
    return true;
  },

  async updateTracking(id: string, trackingNumber: string, courierName: string) {
    const ord = store.orders.find((o) => o.id === id || o.orderNumber === id);
    if (ord) {
      ord.trackingNumber = trackingNumber;
      ord.courierName = courierName;
      ord.orderStatus = "shipped";
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            tracking_number = ${trackingNumber},
            courier_name = ${courierName},
            order_status = 'shipped',
            updated_at = NOW()
          WHERE id = ${id} OR order_number = ${id};
        `;
      } catch (err) {
        console.error("DB updateTracking err:", err);
      }
    }
    return this.getOrderById(id);
  },

  async updateOrderPackingImages(id: string, packingImages: string[]) {
    const ord = store.orders.find((o) => o.id === id || o.orderNumber === id);
    if (ord) {
      ord.packingImages = packingImages;
      ord.updatedAt = new Date();
    }
    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            packing_images = ${JSON.stringify(packingImages)}::jsonb,
            updated_at = NOW()
          WHERE id = ${id} OR order_number = ${id};
        `;
      } catch (err) {
        console.error("DB updateOrderPackingImages err:", err);
      }
    }
    return this.getOrderById(id);
  },

  async deleteOrder(idOrNumber: string): Promise<boolean> {
    const existing = await this.getOrderById(idOrNumber);
    const targetId = existing?.id || idOrNumber;
    const targetOrderNumber = existing?.orderNumber;

    if (sql) {
      try {
        await sql`DELETE FROM order_items WHERE order_id = ${targetId};`.catch(() => {});
        await sql`DELETE FROM order_status_history WHERE order_id = ${targetId};`.catch(() => {});
        await sql`DELETE FROM refunds WHERE order_id = ${targetId};`.catch(() => {});
        await sql`DELETE FROM payments WHERE order_id = ${targetId};`.catch(() => {});
        await sql`DELETE FROM coupon_usages WHERE order_id = ${targetId};`.catch(() => {});
        await sql`UPDATE reviews SET order_id = NULL WHERE order_id = ${targetId};`.catch(() => {});
        await sql`DELETE FROM orders WHERE id = ${targetId} OR order_number = ${idOrNumber};`;
      } catch (err) {
        console.error("DB deleteOrder err:", err);
      }
    }

    const idx = store.orders.findIndex(
      (o) =>
        o.id === targetId ||
        o.orderNumber === idOrNumber ||
        (targetOrderNumber && o.orderNumber === targetOrderNumber)
    );
    if (idx !== -1) {
      store.orders.splice(idx, 1);
    }
    return true;
  },

  async bulkDeleteOrders(ids: string[]): Promise<{ deleted: boolean; count: number }> {
    let count = 0;
    const idSet = new Set(ids);
    for (const id of ids) {
      try {
        const deleted = await this.deleteOrder(id);
        if (deleted) count++;
      } catch (e) {
        console.error("DB bulkDeleteOrders error for id:", id, e);
      }
    }
    store.orders = store.orders.filter((o) => !idSet.has(o.id) && !idSet.has(o.orderNumber));
    return { deleted: true, count };
  },

  // ---------------- COUPONS ----------------
  async getCoupons() {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            code,
            discount_type as "discountType",
            discount_value as "discountValue",
            min_cart_amount as "minCartAmount",
            max_discount as "maxDiscount",
            start_date as "startDate",
            expiry_date as "expiryDate",
            max_redemptions as "maxRedemptions",
            current_redemptions as "currentRedemptions",
            per_customer_limit as "perCustomerLimit",
            is_active as "isActive",
            applicable_category_id as "applicableCategoryId",
            applicable_product_id as "applicableProductId",
            COALESCE(applicable_product_ids, '[]'::jsonb) as "applicableProductIds",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM coupons
          ORDER BY created_at DESC;
        `;
        if (rows && rows.length > 0) {
          return rows.map((c: any) => ({
            ...c,
            discountValue: Number(c.discountValue).toFixed(2),
            minCartAmount: Number(c.minCartAmount || 0).toFixed(2),
            maxDiscount: c.maxDiscount ? Number(c.maxDiscount).toFixed(2) : null,
            applicableProductIds: Array.isArray(c.applicableProductIds)
              ? c.applicableProductIds
              : (c.applicableProductId ? [c.applicableProductId] : []),
          }));
        }
      } catch (err) {
        console.error("DB getCoupons err, fallback to memory:", err);
      }
    }
    return store.coupons.map((c) => ({
      ...c,
      applicableProductIds: Array.isArray(c.applicableProductIds)
        ? c.applicableProductIds
        : (c.applicableProductId ? [c.applicableProductId] : []),
    }));
  },

  async getCouponByCode(code: string) {
    const clean = code.trim().toUpperCase();
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            code,
            discount_type as "discountType",
            discount_value as "discountValue",
            min_cart_amount as "minCartAmount",
            max_discount as "maxDiscount",
            start_date as "startDate",
            expiry_date as "expiryDate",
            max_redemptions as "maxRedemptions",
            current_redemptions as "currentRedemptions",
            per_customer_limit as "perCustomerLimit",
            is_active as "isActive",
            applicable_category_id as "applicableCategoryId",
            applicable_product_id as "applicableProductId",
            COALESCE(applicable_product_ids, '[]'::jsonb) as "applicableProductIds",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM coupons
          WHERE UPPER(code) = ${clean}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const c = rows[0];
          return {
            ...c,
            discountValue: Number(c.discountValue).toFixed(2),
            minCartAmount: Number(c.minCartAmount || 0).toFixed(2),
            maxDiscount: c.maxDiscount ? Number(c.maxDiscount).toFixed(2) : null,
            applicableProductIds: Array.isArray(c.applicableProductIds)
              ? c.applicableProductIds
              : (c.applicableProductId ? [c.applicableProductId] : []),
          };
        }
      } catch (err) {
        console.error("DB getCouponByCode err, fallback to memory:", err);
      }
    }
    const c = store.coupons.find((cp) => cp.code.toUpperCase() === clean);
    if (!c) return null;
    return {
      ...c,
      applicableProductIds: Array.isArray(c.applicableProductIds)
        ? c.applicableProductIds
        : (c.applicableProductId ? [c.applicableProductId] : []),
    };
  },

  async validateCoupon(
    code: string,
    cartAmount: number,
    customerEmail?: string,
    items?: Array<{ productId?: string; price?: number; quantity?: number }>
  ) {
    const cleanCode = (code || "").trim().toUpperCase();
    let coupon = await this.getCouponByCode(cleanCode);

    if (!coupon) {
      // Check festival special coupon configured in site_settings
      const settings = await this.getSiteSettings();
      if (
        settings.festivalDiscountActive &&
        settings.festivalCouponCode &&
        cleanCode === settings.festivalCouponCode.trim().toUpperCase()
      ) {
        if (settings.festivalExpiresAt && new Date(settings.festivalExpiresAt) < new Date()) {
          return { valid: false, message: "This festival special discount offer has expired." };
        }

        const isFixed = settings.festivalDiscountType === "fixed";
        let discountAmount = 0;
        let discountValue = "0";

        if (isFixed && settings.festivalDiscountAmount) {
          const fixedAmt = Number(settings.festivalDiscountAmount);
          discountAmount = Number(Math.min(cartAmount, fixedAmt).toFixed(2));
          discountValue = String(fixedAmt);
        } else {
          const pct = Number(String(settings.festivalDiscountPercentage || "20").replace(/%/g, "").trim()) || 20;
          discountAmount = Number(((cartAmount * pct) / 100).toFixed(2));
          discountValue = String(pct);
        }

        return {
          valid: true,
          coupon: {
            id: "festival_special_coupon",
            code: settings.festivalCouponCode.trim().toUpperCase(),
            discountType: isFixed ? "fixed" : "percentage",
            discountValue,
            minCartAmount: "0",
            maxDiscount: null,
            isActive: true,
          },
          discountAmount,
        };
      }

      return { valid: false, message: "Invalid coupon code." };
    }
    if (!coupon.isActive) return { valid: false, message: "This coupon is no longer active." };

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, message: "This coupon has expired." };
    }
    if (coupon.startDate && new Date(coupon.startDate) > new Date()) {
      return { valid: false, message: "This coupon is not yet valid." };
    }
    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
      return { valid: false, message: "This coupon has reached its maximum redemptions." };
    }
    if (cartAmount < Number(coupon.minCartAmount)) {
      return {
        valid: false,
        message: `Minimum order amount of ₹${coupon.minCartAmount} required for this coupon.`,
      };
    }

    // Check optional Product or Category restrictions if configured on coupon
    let eligibleAmount = cartAmount;

    // Support single product or multiple products
    const targetProductIds: string[] = Array.isArray(coupon.applicableProductIds) && coupon.applicableProductIds.length > 0
      ? coupon.applicableProductIds.map(String)
      : (coupon.applicableProductId ? [String(coupon.applicableProductId)] : []);

    if (targetProductIds.length > 0) {
      if (Array.isArray(items) && items.length > 0) {
        const matchingItems = items.filter((it) => it.productId && targetProductIds.includes(String(it.productId)));
        if (matchingItems.length === 0) {
          if (targetProductIds.length === 1) {
            const targetProd = await this.getProductById(targetProductIds[0]);
            return {
              valid: false,
              message: `This coupon is valid only for the product: "${targetProd?.name || "selected product"}".`,
            };
          }
          return {
            valid: false,
            message: `This coupon is valid only for selected products in our collection.`,
          };
        }
        eligibleAmount = matchingItems.reduce(
          (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
          0
        );
      }
    } else if (coupon.applicableCategoryId) {
      if (Array.isArray(items) && items.length > 0) {
        const { products } = await this.getProducts({ limit: 500 });
        const catMap = new Map(products.map((p) => [p.id, p.categoryId]));
        const matchingItems = items.filter(
          (it: any) =>
            (it.categoryId && it.categoryId === coupon.applicableCategoryId) ||
            (it.productId && catMap.get(it.productId) === coupon.applicableCategoryId)
        );
        if (matchingItems.length === 0) {
          const allCats = await this.getCategories(false);
          const targetCat = allCats.find((c) => c.id === coupon.applicableCategoryId);
          return {
            valid: false,
            message: `This coupon is valid only for products in the "${targetCat?.name || "selected category"}" category.`,
          };
        }
        eligibleAmount = matchingItems.reduce(
          (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
          0
        );
      }
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (eligibleAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Math.min(Number(coupon.discountValue), eligibleAmount);
    }

    return {
      valid: true,
      coupon,
      discountAmount: Number(discount.toFixed(2)),
    };
  },

  async createCoupon(data: any) {
    const productIds: string[] = Array.isArray(data.applicableProductIds)
      ? data.applicableProductIds.filter(Boolean).map(String)
      : (data.applicableProductId ? [String(data.applicableProductId)] : []);

    const newCoupon = {
      ...data,
      id: `cpn_${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      discountType: data.discountType || "percentage",
      discountValue: Number(data.discountValue).toFixed(2),
      minCartAmount: Number(data.minCartAmount || 0).toFixed(2),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount).toFixed(2) : null,
      maxRedemptions: data.maxRedemptions ? Number(data.maxRedemptions) : 100,
      currentRedemptions: 0,
      perCustomerLimit: data.perCustomerLimit ? Number(data.perCustomerLimit) : 1,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      applicableCategoryId: data.applicableCategoryId ? String(data.applicableCategoryId).trim() || null : null,
      applicableProductId: productIds.length === 1 ? productIds[0] : (data.applicableProductId ? String(data.applicableProductId).trim() || null : null),
      applicableProductIds: productIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.coupons.unshift(newCoupon);

    if (sql) {
      try {
        await sql`
          INSERT INTO coupons (
            id, code, discount_type, discount_value, min_cart_amount, max_discount,
            max_redemptions, current_redemptions, per_customer_limit, is_active,
            applicable_category_id, applicable_product_id, applicable_product_ids, created_at, updated_at
          ) VALUES (
            ${newCoupon.id}, ${newCoupon.code}, ${newCoupon.discountType},
            ${newCoupon.discountValue}, ${newCoupon.minCartAmount}, ${newCoupon.maxDiscount},
            ${newCoupon.maxRedemptions}, ${newCoupon.currentRedemptions}, ${newCoupon.perCustomerLimit},
            ${newCoupon.isActive}, ${newCoupon.applicableCategoryId}, ${newCoupon.applicableProductId},
            ${JSON.stringify(newCoupon.applicableProductIds || [])}::jsonb,
            NOW(), NOW()
          );
        `;
      } catch (err) {
        console.error("DB createCoupon err:", err);
      }
    }

    return newCoupon;
  },

  async updateCoupon(id: string, data: any) {
    const productIds: string[] | undefined = data.applicableProductIds !== undefined
      ? (Array.isArray(data.applicableProductIds) ? data.applicableProductIds.filter(Boolean).map(String) : [])
      : (data.applicableProductId !== undefined ? (data.applicableProductId ? [String(data.applicableProductId)] : []) : undefined);

    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.coupons[idx] = {
        ...store.coupons[idx],
        ...data,
        code: data.code ? data.code.toUpperCase().trim() : store.coupons[idx].code,
        applicableCategoryId:
          data.applicableCategoryId !== undefined
            ? (data.applicableCategoryId ? String(data.applicableCategoryId).trim() : null)
            : store.coupons[idx].applicableCategoryId,
        applicableProductId:
          productIds !== undefined
            ? (productIds.length === 1 ? productIds[0] : null)
            : (data.applicableProductId !== undefined ? (data.applicableProductId ? String(data.applicableProductId).trim() : null) : store.coupons[idx].applicableProductId),
        applicableProductIds:
          productIds !== undefined
            ? productIds
            : (store.coupons[idx].applicableProductIds || []),
        updatedAt: new Date(),
      };
    }

    if (sql) {
      try {
        await sql`
          UPDATE coupons
          SET
            code = COALESCE(${data.code ? data.code.toUpperCase().trim() : null}, code),
            discount_type = COALESCE(${data.discountType || null}, discount_type),
            discount_value = COALESCE(${data.discountValue ? Number(data.discountValue).toFixed(2) : null}, discount_value),
            min_cart_amount = COALESCE(${data.minCartAmount !== undefined ? Number(data.minCartAmount).toFixed(2) : null}, min_cart_amount),
            max_discount = ${data.maxDiscount ? Number(data.maxDiscount).toFixed(2) : null},
            max_redemptions = COALESCE(${data.maxRedemptions !== undefined ? Number(data.maxRedemptions) : null}, max_redemptions),
            is_active = COALESCE(${data.isActive !== undefined ? Boolean(data.isActive) : null}, is_active),
            applicable_category_id = ${data.applicableCategoryId ? String(data.applicableCategoryId).trim() : null},
            applicable_product_id = ${productIds !== undefined ? (productIds.length === 1 ? productIds[0] : null) : (data.applicableProductId ? String(data.applicableProductId).trim() : null)},
            applicable_product_ids = ${productIds !== undefined ? JSON.stringify(productIds) : null}::jsonb,
            updated_at = NOW()
          WHERE id = ${id};
        `;
      } catch (err) {
        console.error("DB updateCoupon err:", err);
      }
    }

    return idx !== -1 ? store.coupons[idx] : null;
  },

  async deleteCoupon(id: string) {
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.coupons.splice(idx, 1);
    }
    if (sql) {
      try {
        await sql`DELETE FROM coupons WHERE id = ${id};`;
      } catch (err) {
        console.error("DB deleteCoupon err:", err);
      }
    }
    return true;
  },

  async bulkDeleteCoupons(ids: string[]) {
    const idSet = new Set(ids);
    store.coupons = store.coupons.filter((c) => !idSet.has(c.id));
    if (sql) {
      try {
        await sql`DELETE FROM coupons WHERE id = ANY(${ids});`;
      } catch (err) {
        console.error("DB bulkDeleteCoupons err:", err);
      }
    }
    return { deleted: true, count: ids.length };
  },

  // ---------------- SITE SETTINGS ----------------
  async getSiteSettings() {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            store_name as "storeName",
            store_tagline as "storeTagline",
            store_description as "storeDescription",
            logo_url as "logoUrl",
            signature_url as "signatureUrl",
            contact_email as "contactEmail",
            contact_phone as "contactPhone",
            whatsapp_number as "whatsappNumber",
            instagram_url as "instagramUrl",
            facebook_url as "facebookUrl",
            pinterest_url as "pinterestUrl",
            currency,
            upi_id as "upiId",
            upi_qr_code_url as "upiQrCodeUrl",
            account_holder_name as "accountHolderName",
            default_shipping_charge as "defaultShippingCharge",
            free_shipping_threshold as "freeShippingThreshold",
            tax_percentage as "taxPercentage",
            order_confirmation_message as "orderConfirmationMessage",
            production_time_message as "productionTimeMessage",
            return_policy as "returnPolicy",
            shipping_policy as "shippingPolicy",
            privacy_policy as "privacyPolicy",
            terms_policy as "termsPolicy",
            care_instructions_default as "careInstructionsDefault",
            festival_discount_active as "festivalDiscountActive",
            festival_name as "festivalName",
            festival_tagline as "festivalTagline",
            festival_discount_type as "festivalDiscountType",
            festival_discount_percentage as "festivalDiscountPercentage",
            festival_discount_amount as "festivalDiscountAmount",
            festival_coupon_code as "festivalCouponCode",
            festival_expires_at as "festivalExpiresAt",
            festival_banner_bg as "festivalBannerBg",
            festival_cta_text as "festivalCtaText",
            festival_cta_url as "festivalCtaUrl",
            popup_banner_active as "popupBannerActive",
            popup_banner_tagline as "popupBannerTagline",
            popup_banner_image_url as "popupBannerImageUrl",
            popup_banner_link_url as "popupBannerLinkUrl",
            popup_banner_button_text as "popupBannerButtonText",
            popup_banner_expires_at as "popupBannerExpiresAt",
            COALESCE(keepsake_studio_images, '[]'::jsonb) as "keepsakeStudioImages",
            COALESCE(city_shipping_rates, '[]'::jsonb) as "cityShippingRates",
            COALESCE(policy_pages_config, '{}'::jsonb) as "policyPagesConfig",
            updated_at as "updatedAt"
          FROM site_settings
          WHERE id = 'default'
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const row = rows[0];
          store.siteSettings = {
            ...store.siteSettings,
            ...row,
            cityShippingRates: Array.isArray(row.cityShippingRates) ? row.cityShippingRates : [],
            policyPagesConfig: (row.policyPagesConfig && typeof row.policyPagesConfig === 'object') ? row.policyPagesConfig : {},
          };
          return store.siteSettings;
        }
      } catch (err) {
        console.error("[getSiteSettings] DB fetch error, falling back to memory:", err);
      }
    }
    return { ...store.siteSettings };
  },

  async updateSiteSettings(data: any) {
    store.siteSettings = {
      ...store.siteSettings,
      ...data,
      updatedAt: new Date(),
    };

    if (sql) {
      try {
        await sql`
          INSERT INTO site_settings (
            id, store_name, store_tagline, store_description, logo_url, signature_url, contact_email,
            contact_phone, whatsapp_number, instagram_url, facebook_url, pinterest_url,
            default_shipping_charge, free_shipping_threshold, production_time_message,
            shipping_policy, return_policy, privacy_policy, terms_policy, care_instructions_default,
            festival_discount_active, festival_name, festival_tagline, festival_discount_type, festival_discount_percentage, festival_discount_amount,
            festival_coupon_code, festival_expires_at, festival_banner_bg, festival_cta_text, festival_cta_url,
            popup_banner_active, popup_banner_tagline, popup_banner_image_url, popup_banner_link_url, popup_banner_button_text, popup_banner_expires_at,
            upi_id, upi_qr_code_url, account_holder_name, keepsake_studio_images, city_shipping_rates, policy_pages_config, updated_at
          ) VALUES (
            'default',
            ${data.storeName ?? store.siteSettings.storeName},
            ${data.storeTagline ?? store.siteSettings.storeTagline},
            ${data.storeDescription ?? store.siteSettings.storeDescription},
            ${data.logoUrl ?? store.siteSettings.logoUrl ?? '/images/logo/resin_logo.png'},
            ${data.signatureUrl ?? store.siteSettings.signatureUrl ?? ''},
            ${data.contactEmail ?? store.siteSettings.contactEmail},
            ${data.contactPhone ?? store.siteSettings.contactPhone},
            ${data.whatsappNumber ?? store.siteSettings.whatsappNumber},
            ${data.instagramUrl ?? store.siteSettings.instagramUrl},
            ${data.facebookUrl ?? store.siteSettings.facebookUrl},
            ${data.pinterestUrl ?? store.siteSettings.pinterestUrl},
            ${data.defaultShippingCharge ?? store.siteSettings.defaultShippingCharge},
            ${data.freeShippingThreshold ?? store.siteSettings.freeShippingThreshold},
            ${data.productionTimeMessage ?? store.siteSettings.productionTimeMessage},
            ${data.shippingPolicy ?? store.siteSettings.shippingPolicy},
            ${data.returnPolicy ?? store.siteSettings.returnPolicy},
            ${data.privacyPolicy ?? store.siteSettings.privacyPolicy},
            ${data.termsPolicy ?? store.siteSettings.termsPolicy},
            ${data.careInstructionsDefault ?? store.siteSettings.careInstructionsDefault},
            ${data.festivalDiscountActive !== undefined ? Boolean(data.festivalDiscountActive) : Boolean(store.siteSettings.festivalDiscountActive)},
            ${data.festivalName ?? store.siteSettings.festivalName},
            ${data.festivalTagline ?? store.siteSettings.festivalTagline},
            ${data.festivalDiscountType ?? store.siteSettings.festivalDiscountType ?? 'percentage'},
            ${data.festivalDiscountPercentage ?? store.siteSettings.festivalDiscountPercentage},
            ${data.festivalDiscountAmount !== undefined ? (data.festivalDiscountAmount ? String(Number(data.festivalDiscountAmount).toFixed(2)) : null) : (store.siteSettings.festivalDiscountAmount ? String(Number(store.siteSettings.festivalDiscountAmount).toFixed(2)) : null)},
            ${data.festivalCouponCode ?? store.siteSettings.festivalCouponCode},
            ${data.festivalExpiresAt !== undefined ? (data.festivalExpiresAt ? new Date(data.festivalExpiresAt) : null) : (store.siteSettings.festivalExpiresAt ? new Date(store.siteSettings.festivalExpiresAt) : null)},
            ${data.festivalBannerBg ?? store.siteSettings.festivalBannerBg ?? 'royal_wine'},
            ${data.festivalCtaText ?? store.siteSettings.festivalCtaText ?? 'Shop Festive Deals'},
            ${data.festivalCtaUrl ?? store.siteSettings.festivalCtaUrl ?? '/shop?filter=festival'},
            ${data.popupBannerActive !== undefined ? Boolean(data.popupBannerActive) : Boolean(store.siteSettings.popupBannerActive)},
            ${data.popupBannerTagline ?? store.siteSettings.popupBannerTagline ?? ''},
            ${data.popupBannerImageUrl ?? store.siteSettings.popupBannerImageUrl ?? ''},
            ${data.popupBannerLinkUrl ?? store.siteSettings.popupBannerLinkUrl ?? '/shop'},
            ${data.popupBannerButtonText ?? store.siteSettings.popupBannerButtonText ?? 'Explore Now'},
            ${data.popupBannerExpiresAt !== undefined ? (data.popupBannerExpiresAt ? new Date(data.popupBannerExpiresAt) : null) : (store.siteSettings.popupBannerExpiresAt ? new Date(store.siteSettings.popupBannerExpiresAt) : null)},
            ${data.upiId ?? store.siteSettings.upiId ?? 'devangi0403@okaxis'},
            ${data.upiQrCodeUrl ?? store.siteSettings.upiQrCodeUrl ?? ''},
            ${data.accountHolderName ?? store.siteSettings.accountHolderName ?? 'Devangi Resin Studio'},
            ${JSON.stringify(data.keepsakeStudioImages ?? store.siteSettings.keepsakeStudioImages ?? [])}::jsonb,
            ${JSON.stringify(data.cityShippingRates ?? store.siteSettings.cityShippingRates ?? [])}::jsonb,
            ${JSON.stringify(data.policyPagesConfig ?? store.siteSettings.policyPagesConfig ?? {})}::jsonb,
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            store_name = EXCLUDED.store_name,
            store_tagline = EXCLUDED.store_tagline,
            store_description = EXCLUDED.store_description,
            logo_url = EXCLUDED.logo_url,
            signature_url = EXCLUDED.signature_url,
            contact_email = EXCLUDED.contact_email,
            contact_phone = EXCLUDED.contact_phone,
            whatsapp_number = EXCLUDED.whatsapp_number,
            instagram_url = EXCLUDED.instagram_url,
            facebook_url = EXCLUDED.facebook_url,
            pinterest_url = EXCLUDED.pinterest_url,
            default_shipping_charge = EXCLUDED.default_shipping_charge,
            free_shipping_threshold = EXCLUDED.free_shipping_threshold,
            production_time_message = EXCLUDED.production_time_message,
            shipping_policy = EXCLUDED.shipping_policy,
            return_policy = EXCLUDED.return_policy,
            privacy_policy = EXCLUDED.privacy_policy,
            terms_policy = EXCLUDED.terms_policy,
            care_instructions_default = EXCLUDED.care_instructions_default,
            festival_discount_active = EXCLUDED.festival_discount_active,
            festival_name = EXCLUDED.festival_name,
            festival_tagline = EXCLUDED.festival_tagline,
            festival_discount_type = EXCLUDED.festival_discount_type,
            festival_discount_percentage = EXCLUDED.festival_discount_percentage,
            festival_discount_amount = EXCLUDED.festival_discount_amount,
            festival_coupon_code = EXCLUDED.festival_coupon_code,
            festival_expires_at = EXCLUDED.festival_expires_at,
            festival_banner_bg = EXCLUDED.festival_banner_bg,
            festival_cta_text = EXCLUDED.festival_cta_text,
            festival_cta_url = EXCLUDED.festival_cta_url,
            popup_banner_active = EXCLUDED.popup_banner_active,
            popup_banner_tagline = EXCLUDED.popup_banner_tagline,
            popup_banner_image_url = EXCLUDED.popup_banner_image_url,
            popup_banner_link_url = EXCLUDED.popup_banner_link_url,
            popup_banner_button_text = EXCLUDED.popup_banner_button_text,
            popup_banner_expires_at = EXCLUDED.popup_banner_expires_at,
            upi_id = EXCLUDED.upi_id,
            upi_qr_code_url = EXCLUDED.upi_qr_code_url,
            account_holder_name = EXCLUDED.account_holder_name,
            keepsake_studio_images = EXCLUDED.keepsake_studio_images,
            city_shipping_rates = EXCLUDED.city_shipping_rates,
            policy_pages_config = EXCLUDED.policy_pages_config,
            updated_at = NOW();
        `;
      } catch (err) {
        console.error("[updateSiteSettings] DB update error:", err);
      }
    }

    return store.siteSettings;
  },

  // ---------------- ORDER CANCELLATION (1-HOUR RULE) ----------------
  async cancelOrder(orderNumberOrId: string, reason = "Customer requested cancellation within 1 hour") {
    const ord = await this.getOrderByNumber(orderNumberOrId);
    if (!ord) throw new Error("Order not found.");

    if (ord.orderStatus === "cancelled") {
      throw new Error("Order is already cancelled.");
    }

    const createdAt = new Date(ord.createdAt).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - createdAt) / (1000 * 60);

    if (elapsedMinutes > 60) {
      throw new Error("Orders can only be cancelled within 1 hour of placing. Your order is already being handcrafted by our resin artists.");
    }

    ord.orderStatus = "cancelled";
    ord.paymentStatus = "cancelled";
    ord.cancellationReason = reason;
    ord.cancelledAt = new Date();
    ord.updatedAt = new Date();

    // Restore inventory
    if (ord.items && Array.isArray(ord.items)) {
      for (const item of ord.items) {
        if (item.productId) {
          try {
            await this.adjustStock(
              item.productId,
              item.variantId || null,
              Number(item.quantity),
              `Order Cancelled (${ord.orderNumber}) - Stock Restored`,
              "customer_cancellation"
            );
          } catch (err) {
            console.error("Restock on cancellation error:", err);
          }
        }
      }
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            order_status = 'cancelled',
            payment_status = 'cancelled',
            cancellation_reason = ${reason},
            cancelled_at = NOW(),
            updated_at = NOW()
          WHERE order_number = ${ord.orderNumber} OR id = ${ord.id};
        `;
      } catch (err) {
        console.error("[cancelOrder] DB update error:", err);
      }
    }

    return ord;
  },

  // ---------------- CUSTOMER AUTH & ORDERS ----------------
  async getCustomerByEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id, name, email, phone, 
            password_hash as "passwordHash", 
            google_id as "googleId",
            avatar_url as "avatarUrl",
            address_line1 as "addressLine1",
            address_line2 as "addressLine2",
            city, state, 
            postal_code as "postalCode",
            country,
            is_verified as "isVerified", 
            created_at as "createdAt"
          FROM customers
          WHERE LOWER(email) = ${cleanEmail}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.error("DB getCustomerByEmail err:", e);
      }
    }
    return store.customers?.find((c) => c.email.toLowerCase() === cleanEmail) || null;
  },

  async getCustomerById(id: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id, name, email, phone, 
            google_id as "googleId",
            avatar_url as "avatarUrl",
            address_line1 as "addressLine1",
            address_line2 as "addressLine2",
            city, state, 
            postal_code as "postalCode",
            country,
            is_verified as "isVerified", 
            created_at as "createdAt"
          FROM customers
          WHERE id = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (e) {
        console.error("DB getCustomerById err:", e);
      }
    }
    return store.customers?.find((c) => c.id === id) || null;
  },

  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    passwordHash?: string | null;
    googleId?: string | null;
    avatarUrl?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  }) {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanEmail = data.email.trim().toLowerCase();
    const newCust = {
      id,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || "",
      googleId: data.googleId || null,
      avatarUrl: data.avatarUrl || null,
      addressLine1: data.addressLine1 || "",
      addressLine2: data.addressLine2 || "",
      city: data.city || "",
      state: data.state || "",
      postalCode: data.postalCode || "",
      country: data.country || "India",
      isVerified: true,
      createdAt: new Date(),
    };

    if (!store.customers) store.customers = [];
    store.customers.push(newCust);

    if (sql) {
      try {
        await sql`
          INSERT INTO customers (
            id, name, email, phone, password_hash, google_id, avatar_url,
            address_line1, address_line2, city, state, postal_code, country,
            is_verified, created_at, updated_at
          ) VALUES (
            ${id}, ${data.name.trim()}, ${cleanEmail}, ${data.phone?.trim() || null},
            ${data.passwordHash || null}, ${data.googleId || null}, ${data.avatarUrl || null},
            ${data.addressLine1 || null}, ${data.addressLine2 || null}, ${data.city || null},
            ${data.state || null}, ${data.postalCode || null}, ${data.country || 'India'},
            true, NOW(), NOW()
          );
        `;
      } catch (err) {
        console.error("DB createCustomer error:", err);
      }
    }

    return newCust;
  },

  async createCustomerOrGet(data: { name: string; email: string; phone?: string; avatarUrl?: string }) {
    const existing = await this.getCustomerByEmail(data.email);
    if (existing) return existing;
    return this.createCustomer(data);
  },

  async findOrCreateGoogleCustomer(data: {
    googleId: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }): Promise<any> {
    const cleanEmail = data.email.trim().toLowerCase();
    let existing = await this.getCustomerByEmail(cleanEmail);
    if (existing) {
      if (sql && (!existing.googleId || !existing.avatarUrl)) {
        await sql`
          UPDATE customers
          SET 
            google_id = COALESCE(google_id, ${data.googleId}),
            avatar_url = COALESCE(avatar_url, ${data.avatarUrl || null}),
            is_verified = true,
            updated_at = NOW()
          WHERE id = ${existing.id};
        `;
      }
      return {
        ...existing,
        googleId: existing.googleId || data.googleId,
        avatarUrl: existing.avatarUrl || data.avatarUrl,
      };
    }

    return this.createCustomer({
      name: data.name,
      email: cleanEmail,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl,
    });
  },

  async updateCustomerProfile(id: string, data: any) {
    const mem = store.customers?.find((c) => c.id === id);
    if (mem) {
      if (data.name !== undefined) mem.name = data.name;
      if (data.email !== undefined) mem.email = data.email;
      if (data.phone !== undefined) mem.phone = data.phone;
      if (data.avatarUrl !== undefined) mem.avatarUrl = data.avatarUrl;
      if (data.addressLine1 !== undefined) mem.addressLine1 = data.addressLine1;
      if (data.addressLine2 !== undefined) mem.addressLine2 = data.addressLine2;
      if (data.city !== undefined) mem.city = data.city;
      if (data.state !== undefined) mem.state = data.state;
      if (data.postalCode !== undefined) mem.postalCode = data.postalCode;
      if (data.country !== undefined) mem.country = data.country;
    }

    if (sql) {
      try {
        await sql`
          UPDATE customers
          SET
            name = COALESCE(${data.name || null}, name),
            email = COALESCE(${data.email || null}, email),
            phone = COALESCE(${data.phone || null}, phone),
            avatar_url = COALESCE(${data.avatarUrl || null}, avatar_url),
            address_line1 = COALESCE(${data.addressLine1 || null}, address_line1),
            address_line2 = COALESCE(${data.addressLine2 || null}, address_line2),
            city = COALESCE(${data.city || null}, city),
            state = COALESCE(${data.state || null}, state),
            postal_code = COALESCE(${data.postalCode || null}, postal_code),
            country = COALESCE(${data.country || null}, country),
            updated_at = NOW()
          WHERE id = ${id};
        `;
      } catch (err) {
        console.error("DB updateCustomerProfile err:", err);
      }
    }
    return this.getCustomerById(id);
  },

  async getCustomerOrders(customerIdOrEmail: string) {
    const clean = customerIdOrEmail.trim().toLowerCase();
    const memOrders = store.orders.filter(
      (o) => o.customerId === customerIdOrEmail || o.customerEmail?.toLowerCase() === clean
    );

    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_id as "customerId",
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            shipping_city as "shippingCity",
            shipping_state as "shippingState",
            subtotal,
            discount_amount as "discountAmount",
            discount_reason as "discountReason",
            shipping_charge as "shippingCharge",
            tax_amount as "taxAmount",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            payment_status as "paymentStatus",
            payment_method as "paymentMethod",
            upi_transaction_id as "upiTransactionId",
            cancellation_reason as "cancellationReason",
            cancelled_at as "cancelledAt",
            tracking_number as "trackingNumber",
            courier_name as "courierName",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          WHERE customer_id = ${customerIdOrEmail} OR LOWER(customer_email) = ${clean}
          ORDER BY created_at DESC;
        `;
        if (rows && rows.length > 0) {
          for (const ord of rows) {
            const items = await sql`
              SELECT 
                id, product_id as "productId", product_name as "productName",
                variant_name as "variantName", unit_price as "unitPrice", quantity, total_price as "totalPrice"
              FROM order_items
              WHERE order_id = ${ord.id};
            `;
            ord.items = items || [];
          }
          return rows;
        }
      } catch (e) {
        console.error("DB getCustomerOrders err:", e);
      }
    }

    return memOrders;
  },

  async getAllCustomersWithStats() {
    let custs: any[] = [];
    let ords: any[] = [];

    if (sql) {
      try {
        custs = await sql`
          SELECT 
            id, name, email, phone, 
            google_id as "googleId", avatar_url as "avatarUrl", 
            address_line1 as "addressLine1", address_line2 as "addressLine2",
            city, state, postal_code as "postalCode", 
            created_at as "createdAt" 
          FROM customers
          ORDER BY created_at DESC;
        `;
        ords = await sql`
          SELECT 
            id, customer_id as "customerId", customer_email as "customerEmail", 
            customer_name as "customerName", customer_phone as "customerPhone",
            shipping_address_line1 as "shippingAddressLine1", shipping_address_line2 as "shippingAddressLine2",
            shipping_city as "shippingCity", shipping_state as "shippingState",
            shipping_postal_code as "shippingPostalCode",
            total_amount as "totalAmount", payment_status as "paymentStatus", 
            created_at as "createdAt" 
          FROM orders;
        `;
      } catch (e) {
        console.error("DB getAllCustomersWithStats error:", e);
      }
    }

    if (!custs || custs.length === 0) {
      custs = (store.customers || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        addressLine1: c.addressLine1,
        addressLine2: c.addressLine2,
        city: c.city,
        state: c.state,
        postalCode: c.postalCode,
        createdAt: c.createdAt,
      }));
      ords = store.orders.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        shippingAddressLine1: o.shippingAddressLine1,
        shippingAddressLine2: o.shippingAddressLine2,
        shippingCity: o.shippingCity,
        shippingState: o.shippingState,
        shippingPostalCode: o.shippingPostalCode,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      }));
    }

    // Also include guest orders if email not yet registered
    const existingEmails = new Set(custs.map((c: any) => c.email?.toLowerCase().trim()));
    ords.forEach((o: any) => {
      if (o.customerEmail && !existingEmails.has(o.customerEmail.toLowerCase().trim())) {
        existingEmails.add(o.customerEmail.toLowerCase().trim());
        custs.push({
          id: `guest_${o.id}`,
          name: o.customerName || "Guest Customer",
          email: o.customerEmail,
          phone: o.customerPhone || null,
          googleId: null,
          avatarUrl: null,
          addressLine1: o.shippingAddressLine1 || null,
          addressLine2: o.shippingAddressLine2 || null,
          city: o.shippingCity || null,
          state: o.shippingState || null,
          postalCode: o.shippingPostalCode || null,
          createdAt: o.createdAt,
        });
      }
    });

    return custs.map((c: any) => {
      const matching = ords.filter((o: any) =>
        (o.customerId && o.customerId === c.id) ||
        (o.customerEmail && o.customerEmail.toLowerCase().trim() === c.email.toLowerCase().trim())
      );
      // IMPORTANT: Only paid orders count toward totalSpent!
      const paidOrders = matching.filter((o: any) => o.paymentStatus === "paid");
      const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

      const latestOrder = matching.length > 0
        ? [...matching].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      return {
        ...c,
        totalOrders: matching.length,
        paidOrdersCount: paidOrders.length,
        totalSpent,
        lastOrderDate: latestOrder ? latestOrder.createdAt : null,
      };
    });
  },

  // ---------------- MEDIA LIBRARY ----------------
  async getMediaItems() {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id, file_name as "fileName", url, 
            file_size as "fileSize", mime_type as "mimeType", 
            alt_text as "altText", created_at as "createdAt"
          FROM media_items
          ORDER BY created_at DESC;
        `;
        if (rows && rows.length > 0) {
          // Strictly deduplicate by URL so each asset is shown only once
          const uniqueItems: any[] = [];
          const seen = new Set<string>();
          for (const item of rows) {
            const cleanUrl = item.url?.trim();
            if (cleanUrl && !seen.has(cleanUrl)) {
              seen.add(cleanUrl);
              uniqueItems.push(item);
            }
          }
          return uniqueItems;
        }

        // Auto-seed media library from existing product and category images if table is empty
        const prodImages = await sql`SELECT DISTINCT image_url, alt_text FROM product_images WHERE image_url IS NOT NULL AND image_url != '';`;
        const catImages = await sql`SELECT DISTINCT image_url, name as alt_text FROM categories WHERE image_url IS NOT NULL AND image_url != '';`;
        const initialSeed = [...prodImages, ...catImages];
        const insertedUrls = new Set<string>();

        for (let i = 0; i < initialSeed.length; i++) {
          const item = initialSeed[i];
          const rawUrl = item.image_url?.trim();
          if (!rawUrl || insertedUrls.has(rawUrl)) continue;
          insertedUrls.add(rawUrl);

          const id = `media_init_${i}`;
          const fileName = rawUrl.split("/").pop()?.split("?")[0] || `asset_${i}.png`;
          try {
            await sql`
              INSERT INTO media_items (id, file_name, url, file_size, mime_type, alt_text, created_at)
              VALUES (${id}, ${fileName}, ${rawUrl}, 0, 'image/png', ${item.alt_text || ''}, NOW())
              ON CONFLICT (url) DO NOTHING;
            `;
          } catch {
            // Ignore conflict
          }
        }

        const seededRows = await sql`
          SELECT 
            id, file_name as "fileName", url, 
            file_size as "fileSize", mime_type as "mimeType", 
            alt_text as "altText", created_at as "createdAt"
          FROM media_items
          ORDER BY created_at DESC;
        `;
        const uniqueSeeded: any[] = [];
        const seenSeeded = new Set<string>();
        for (const item of (seededRows || [])) {
          const cleanUrl = item.url?.trim();
          if (cleanUrl && !seenSeeded.has(cleanUrl)) {
            seenSeeded.add(cleanUrl);
            uniqueSeeded.push(item);
          }
        }
        return uniqueSeeded;
      } catch (e) {
        console.error("DB getMediaItems error:", e);
      }
    }

    // Memory store fallback
    const uniqueMem: any[] = [];
    const seenMem = new Set<string>();
    for (const item of (store.mediaItems || [])) {
      if (item.url && !seenMem.has(item.url)) {
        seenMem.add(item.url);
        uniqueMem.push(item);
      }
    }
    return uniqueMem;
  },

  async addMediaItem(data: { id?: string; fileName?: string; url: string; fileSize?: number; mimeType?: string; altText?: string }) {
    const cleanUrl = data.url?.trim();
    if (!cleanUrl) return null;

    if (sql) {
      try {
        const existing = await sql`
          SELECT 
            id, file_name as "fileName", url, 
            file_size as "fileSize", mime_type as "mimeType", 
            alt_text as "altText", created_at as "createdAt"
          FROM media_items
          WHERE url = ${cleanUrl}
          LIMIT 1;
        `;
        if (existing && existing.length > 0) {
          return existing[0];
        }

        const id = data.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const fileName = data.fileName || cleanUrl.split("/").pop()?.split("?")[0] || "media_asset.png";
        const fileSize = Number(data.fileSize) || 0;
        const mimeType = data.mimeType || "image/png";
        const altText = data.altText || "";

        await sql`
          INSERT INTO media_items (id, file_name, url, file_size, mime_type, alt_text, created_at)
          VALUES (${id}, ${fileName}, ${cleanUrl}, ${fileSize}, ${mimeType}, ${altText}, NOW())
          ON CONFLICT (url) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            alt_text = EXCLUDED.alt_text;
        `;

        const inserted = {
          id,
          fileName,
          url: cleanUrl,
          fileSize,
          mimeType,
          altText,
          createdAt: new Date(),
        };

        const memIdx = store.mediaItems.findIndex((m) => m.url === cleanUrl);
        if (memIdx >= 0) {
          store.mediaItems[memIdx] = inserted;
        } else {
          store.mediaItems.unshift(inserted);
        }
        return inserted;
      } catch (e) {
        console.error("DB addMediaItem error:", e);
      }
    }

    const id = data.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = data.fileName || cleanUrl.split("/").pop()?.split("?")[0] || "media_asset.png";
    const newItem = {
      id,
      fileName,
      url: cleanUrl,
      fileSize: Number(data.fileSize) || 0,
      mimeType: data.mimeType || "image/png",
      altText: data.altText || "",
      createdAt: new Date(),
    };

    const memIdx = store.mediaItems.findIndex((m) => m.url === cleanUrl);
    if (memIdx >= 0) {
      store.mediaItems[memIdx] = newItem;
    } else {
      store.mediaItems.unshift(newItem);
    }
    return newItem;
  },

  async deleteMediaItem(id: string) {
    if (sql) {
      try {
        await sql`DELETE FROM media_items WHERE id = ${id};`;
      } catch (e) {
        console.error("DB deleteMediaItem error:", e);
      }
    }
    store.mediaItems = store.mediaItems.filter((m) => m.id !== id);
    return true;
  },

  async bulkDeleteMedia(ids: string[]) {
    if (sql && ids.length > 0) {
      try {
        for (const mid of ids) {
          await sql`DELETE FROM media_items WHERE id = ${mid};`;
        }
      } catch (e) {
        console.error("DB bulkDeleteMedia error:", e);
      }
    }
    const idSet = new Set(ids);
    store.mediaItems = store.mediaItems.filter((m) => !idSet.has(m.id));
    return { deleted: true, count: ids.length };
  },

  // ---------------- DASHBOARD ANALYTICS (REAL LIVE NEON DATA) ----------------
  async getDashboardStats() {
    let ordersList: any[] = [];
    let productsList: any[] = [];

    if (sql) {
      try {
        const ordRows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_id as "customerId",
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            shipping_city as "shippingCity",
            shipping_state as "shippingState",
            subtotal,
            discount_amount as "discountAmount",
            discount_reason as "discountReason",
            shipping_charge as "shippingCharge",
            tax_amount as "taxAmount",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            payment_status as "paymentStatus",
            payment_method as "paymentMethod",
            upi_transaction_id as "upiTransactionId",
            created_at as "createdAt"
          FROM orders
          ORDER BY created_at DESC;
        `;
        ordersList = ordRows || [];

        const prodRows = await sql`
          SELECT 
            id, name, slug, sku,
            regular_price as "regularPrice", sale_price as "salePrice",
            track_inventory as "trackInventory", stock_quantity as "stockQuantity",
            low_stock_threshold as "lowStockThreshold", status,
            created_at as "createdAt"
          FROM products
          WHERE status != 'archived'
          ORDER BY stock_quantity ASC;
        `;
        productsList = prodRows || [];
      } catch (e) {
        console.error("DB getDashboardStats error:", e);
      }
    }

    if (ordersList.length === 0 && !sql) {
      ordersList = [...store.orders];
    }
    if (productsList.length === 0 && !sql) {
      productsList = [...store.products];
    }

    const paidOrders = ordersList.filter((o) => o.paymentStatus === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const awaitingPayment = ordersList.filter(
      (o) => o.paymentStatus === "pending" || o.paymentStatus === "unpaid" || o.paymentStatus === "pending_verification"
    ).length;
    const awaitingFulfilment = ordersList.filter(
      (o) => o.paymentStatus === "paid" && ["confirmed", "processing", "ready_to_ship"].includes(o.orderStatus)
    ).length;
    const completedOrders = ordersList.filter((o) => o.orderStatus === "delivered").length;

    const lowStockProducts = productsList.filter(
      (p) => p.trackInventory && Number(p.stockQuantity) <= Number(p.lowStockThreshold) && Number(p.stockQuantity) > 0
    );
    const outOfStockProducts = productsList.filter(
      (p) => p.trackInventory && Number(p.stockQuantity) <= 0
    );

    // Watchlist contains all items requiring inventory attention (both low and out of stock)
    const watchlist = productsList.filter(
      (p) => p.trackInventory && Number(p.stockQuantity) <= Number(p.lowStockThreshold)
    );

    return {
      totalOrders: ordersList.length,
      paidOrdersCount: paidOrders.length,
      awaitingPayment,
      awaitingFulfilment,
      completedOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      recentOrders: ordersList.slice(0, 10),
      lowStockProducts: watchlist.slice(0, 10),
      recentMovements: store.inventoryMovements.slice(0, 5),
    };
  },

  // ---------------- BESPOKE CUSTOM REQUESTS ----------------
  async createCustomRequest(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productType: string;
    budget?: string;
    description: string;
    referenceImageUrl?: string | null;
  }) {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReq = {
      id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      productType: data.productType,
      budget: data.budget || "Not Specified",
      description: data.description,
      referenceImageUrl: data.referenceImageUrl || null,
      status: "new",
      quoteAmount: null,
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.customRequests.unshift(newReq);

    if (sql) {
      try {
        await sql`
          INSERT INTO custom_requests (
            id, customer_name, customer_email, customer_phone, product_type, budget,
            description, reference_image_url, status, created_at, updated_at
          ) VALUES (
            ${id}, ${data.customerName}, ${data.customerEmail}, ${data.customerPhone},
            ${data.productType}, ${data.budget || null}, ${data.description},
            ${data.referenceImageUrl || null}, 'new', NOW(), NOW()
          );
        `;
      } catch (err) {
        console.error("DB createCustomRequest err:", err);
      }
    }

    return newReq;
  },

  async getCustomRequests(filters?: { status?: string; search?: string }) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            product_type as "productType",
            budget,
            description,
            reference_image_url as "referenceImageUrl",
            status,
            quote_amount as "quoteAmount",
            admin_notes as "adminNotes",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM custom_requests
          ORDER BY created_at DESC;
        `;
        if (rows && rows.length > 0) {
          let list = rows as any[];
          if (filters?.status && filters.status !== "all") {
            list = list.filter((r) => r.status === filters.status);
          }
          if (filters?.search && filters.search.trim()) {
            const q = filters.search.toLowerCase().trim();
            list = list.filter(
              (r) =>
                r.customerName?.toLowerCase().includes(q) ||
                r.customerEmail?.toLowerCase().includes(q) ||
                r.customerPhone?.includes(q) ||
                r.productType?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
            );
          }
          return list;
        }
      } catch (err) {
        console.error("DB getCustomRequests err:", err);
      }
    }

    let list = [...store.customRequests];
    if (filters?.status && filters.status !== "all") {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(q) ||
          r.customerEmail?.toLowerCase().includes(q) ||
          r.customerPhone?.includes(q) ||
          r.productType?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCustomRequestById(id: string) {
    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            customer_name as "customerName",
            customer_email as "customerEmail",
            customer_phone as "customerPhone",
            product_type as "productType",
            budget,
            description,
            reference_image_url as "referenceImageUrl",
            status,
            quote_amount as "quoteAmount",
            admin_notes as "adminNotes",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM custom_requests
          WHERE id = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        console.error("DB getCustomRequestById err:", err);
      }
    }
    return store.customRequests.find((r) => r.id === id) || null;
  },

  async updateCustomRequestStatus(
    id: string,
    status?: string,
    adminNotes?: string,
    quoteAmount?: number
  ) {
    const mem = store.customRequests.find((r) => r.id === id);
    if (mem) {
      if (status !== undefined) mem.status = status;
      if (adminNotes !== undefined) mem.adminNotes = adminNotes;
      if (quoteAmount !== undefined) mem.quoteAmount = quoteAmount;
      mem.updatedAt = new Date();
    }

    if (sql) {
      try {
        await sql`
          UPDATE custom_requests
          SET 
            status = COALESCE(${status ?? null}, status),
            admin_notes = COALESCE(${adminNotes ?? null}, admin_notes),
            quote_amount = COALESCE(${quoteAmount ?? null}, quote_amount),
            updated_at = NOW()
          WHERE id = ${id};
        `;
      } catch (err) {
        console.error("DB updateCustomRequestStatus err:", err);
      }
    }

    return this.getCustomRequestById(id);
  },

  async deleteCustomRequest(id: string) {
    store.customRequests = store.customRequests.filter((r) => r.id !== id);
    if (sql) {
      try {
        await sql`DELETE FROM custom_requests WHERE id = ${id};`;
      } catch (err) {
        console.error("DB deleteCustomRequest err:", err);
      }
    }
    return { success: true };
  },

  // ---------------- PRODUCT REVIEWS & DELIVERED POPUP ----------------
  async createReview(data: {
    productId: string;
    customerId?: string | null;
    orderId?: string | null;
    customerName: string;
    customerEmail: string;
    customerAvatar?: string | null;
    rating: number;
    reviewText: string;
    images?: string[];
    isVerifiedPurchase?: boolean;
    adminGranted?: boolean;
  }) {
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRev = {
      id,
      productId: data.productId,
      customerId: data.customerId || null,
      orderId: data.orderId || null,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      customerAvatar: data.customerAvatar || null,
      rating: Math.min(5, Math.max(1, Math.round(data.rating))),
      reviewText: data.reviewText.trim().slice(0, 900),
      images: Array.isArray(data.images) ? data.images : [],
      likesCount: 0,
      isVerifiedPurchase: Boolean(data.isVerifiedPurchase),
      adminGranted: Boolean(data.adminGranted),
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update in-memory
    store.reviews.unshift(newRev);

    // If there was an admin permission, mark it as reviewed
    const perm = store.productReviewPermissions.find(
      (p) =>
        p.productId === data.productId &&
        (p.customerId === data.customerId || p.customerEmail?.toLowerCase() === data.customerEmail.toLowerCase())
    );
    if (perm) {
      perm.hasReviewed = true;
    }

    // If there was an order, mark deliveredPopupSeen if needed
    if (data.orderId) {
      const ord = store.orders.find((o) => o.id === data.orderId || o.orderNumber === data.orderId);
      if (ord) {
        ord.deliveredPopupSeen = true;
      }
    }

    if (sql) {
      try {
        await sql`
          INSERT INTO reviews (
            id, product_id, customer_id, order_id, customer_name,
            customer_email, customer_avatar, rating, review_text,
            images, likes_count, is_verified_purchase, admin_granted,
            status, created_at, updated_at
          ) VALUES (
            ${newRev.id}, ${newRev.productId}, ${newRev.customerId}, ${newRev.orderId},
            ${newRev.customerName}, ${newRev.customerEmail}, ${newRev.customerAvatar},
            ${newRev.rating}, ${newRev.reviewText}, ${JSON.stringify(newRev.images)}::jsonb,
            0, ${newRev.isVerifiedPurchase}, ${newRev.adminGranted},
            ${newRev.status}, ${newRev.createdAt}, ${newRev.updatedAt}
          );
        `;

        if (data.customerId || data.customerEmail) {
          await sql`
            UPDATE product_review_permissions
            SET has_reviewed = TRUE
            WHERE product_id = ${data.productId}
              AND (customer_id = ${data.customerId || ""} OR LOWER(customer_email) = ${data.customerEmail.toLowerCase()});
          `.catch(() => {});
        }

        if (data.orderId) {
          await sql`
            UPDATE orders
            SET delivered_popup_seen = TRUE
            WHERE id = ${data.orderId} OR order_number = ${data.orderId};
          `.catch(() => {});
        }
      } catch (err) {
        console.error("DB createReview err:", err);
      }
    }

    return newRev;
  },

  async getReviewsByProduct(productId: string, userIdentifier?: string) {
    let revs: any[] = [];

    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            r.id,
            r.product_id as "productId",
            r.customer_id as "customerId",
            r.order_id as "orderId",
            r.customer_name as "customerName",
            r.customer_email as "customerEmail",
            r.customer_avatar as "customerAvatar",
            r.rating,
            r.review_text as "reviewText",
            r.images,
            r.likes_count as "likesCount",
            r.is_verified_purchase as "isVerifiedPurchase",
            r.admin_granted as "adminGranted",
            r.status,
            r.created_at as "createdAt",
            r.updated_at as "updatedAt"
          FROM reviews r
          WHERE r.product_id = ${productId} AND r.status = 'published'
          ORDER BY r.created_at DESC;
        `;
        if (rows) {
          revs = rows.map((r: any) => ({
            ...r,
            images: Array.isArray(r.images) ? r.images : typeof r.images === "string" ? JSON.parse(r.images) : [],
          }));
        }
      } catch (err) {
        console.error("DB getReviewsByProduct err:", err);
      }
    }

    if (revs.length === 0) {
      revs = store.reviews.filter((r) => r.productId === productId && r.status === "published");
    }

    // Attach userHasLiked if userIdentifier is provided
    let likedReviewIds = new Set<string>();
    if (userIdentifier) {
      if (sql) {
        try {
          const likes = await sql`
            SELECT review_id as "reviewId" FROM review_likes WHERE user_identifier = ${userIdentifier};
          `;
          likedReviewIds = new Set(likes.map((l: any) => l.reviewId));
        } catch {}
      } else {
        likedReviewIds = new Set(
          store.reviewLikes.filter((l) => l.userIdentifier === userIdentifier).map((l) => l.reviewId)
        );
      }
    }

    const reviewsWithLikes = revs.map((r) => ({
      ...r,
      userHasLiked: likedReviewIds.has(r.id),
    }));

    // Calculate rating distribution & average
    const totalReviews = reviewsWithLikes.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;

    for (const r of reviewsWithLikes) {
      const star = Math.min(5, Math.max(1, r.rating || 5));
      distribution[star] = (distribution[star] || 0) + 1;
      sumRating += star;
    }

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;

    return {
      reviews: reviewsWithLikes,
      stats: {
        totalReviews,
        averageRating,
        distribution,
      },
    };
  },

  async getAllReviews() {
    let revs: any[] = [];

    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            r.id,
            r.product_id as "productId",
            r.customer_id as "customerId",
            r.order_id as "orderId",
            r.customer_name as "customerName",
            r.customer_email as "customerEmail",
            r.customer_avatar as "customerAvatar",
            r.rating,
            r.review_text as "reviewText",
            r.images,
            r.likes_count as "likesCount",
            r.is_verified_purchase as "isVerifiedPurchase",
            r.admin_granted as "adminGranted",
            r.status,
            r.created_at as "createdAt",
            p.name as "productName",
            p.slug as "productSlug",
            p.sku as "productSku"
          FROM reviews r
          LEFT JOIN products p ON r.product_id = p.id
          ORDER BY r.created_at DESC;
        `;
        if (rows) {
          revs = rows.map((r: any) => ({
            ...r,
            images: Array.isArray(r.images) ? r.images : typeof r.images === "string" ? JSON.parse(r.images) : [],
          }));
        }
      } catch (err) {
        console.error("DB getAllReviews err:", err);
      }
    }

    if (revs.length === 0) {
      revs = store.reviews.map((r) => {
        const p = store.products.find((prod) => prod.id === r.productId);
        return {
          ...r,
          productName: p?.name || "Product",
          productSlug: p?.slug || "",
          productSku: p?.sku || "",
        };
      });
    }

    return revs;
  },

  async deleteReview(id: string) {
    store.reviews = store.reviews.filter((r) => r.id !== id);
    store.reviewLikes = store.reviewLikes.filter((l) => l.reviewId !== id);

    if (sql) {
      try {
        await sql`DELETE FROM reviews WHERE id = ${id};`;
      } catch (err) {
        console.error("DB deleteReview err:", err);
      }
    }
    return { success: true };
  },

  async toggleReviewLike(reviewId: string, userIdentifier: string) {
    let liked = false;
    let likesCount = 0;

    // In-memory check
    const existingIndex = store.reviewLikes.findIndex(
      (l) => l.reviewId === reviewId && l.userIdentifier === userIdentifier
    );
    const targetRev = store.reviews.find((r) => r.id === reviewId);

    if (existingIndex > -1) {
      // Remove like
      store.reviewLikes.splice(existingIndex, 1);
      if (targetRev) {
        targetRev.likesCount = Math.max(0, (targetRev.likesCount || 1) - 1);
        likesCount = targetRev.likesCount;
      }
      liked = false;
    } else {
      // Add like
      store.reviewLikes.push({
        id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        reviewId,
        userIdentifier,
        createdAt: new Date(),
      });
      if (targetRev) {
        targetRev.likesCount = (targetRev.likesCount || 0) + 1;
        likesCount = targetRev.likesCount;
      }
      liked = true;
    }

    if (sql) {
      try {
        const existingSql = await sql`
          SELECT id FROM review_likes WHERE review_id = ${reviewId} AND user_identifier = ${userIdentifier};
        `;
        if (existingSql && existingSql.length > 0) {
          await sql`
            DELETE FROM review_likes WHERE review_id = ${reviewId} AND user_identifier = ${userIdentifier};
          `;
          await sql`
            UPDATE reviews SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${reviewId};
          `;
          liked = false;
        } else {
          const newLikeId = `like_${Date.now()}`;
          await sql`
            INSERT INTO review_likes (id, review_id, user_identifier, created_at)
            VALUES (${newLikeId}, ${reviewId}, ${userIdentifier}, NOW());
          `;
          await sql`
            UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ${reviewId};
          `;
          liked = true;
        }
        const updated = await sql`SELECT likes_count as "likesCount" FROM reviews WHERE id = ${reviewId};`;
        if (updated && updated.length > 0) {
          likesCount = updated[0].likesCount;
        }
      } catch (err) {
        console.error("DB toggleReviewLike err:", err);
      }
    }

    return { success: true, liked, likesCount };
  },

  async checkUserReviewEligibility(productId: string, customerId?: string | null, customerEmail?: string | null) {
    if (!customerId && !customerEmail) {
      return {
        canReview: false,
        reason: "Please sign in to write a verified review.",
        hasAlreadyReviewed: false,
        isVerifiedPurchase: false,
        adminGranted: false,
      };
    }

    const cleanEmail = (customerEmail || "").trim().toLowerCase();

    // 1. Check if user already reviewed this product
    let userReview = store.reviews.find(
      (r) =>
        r.productId === productId &&
        ((customerId && r.customerId === customerId) || (cleanEmail && r.customerEmail?.toLowerCase() === cleanEmail))
    );

    if (!userReview && sql) {
      try {
        const rows = await sql`
          SELECT id FROM reviews
          WHERE product_id = ${productId}
            AND (customer_id = ${customerId || ""} OR LOWER(customer_email) = ${cleanEmail});
        `;
        if (rows && rows.length > 0) {
          userReview = rows[0];
        }
      } catch {}
    }

    if (userReview) {
      return {
        canReview: false,
        hasAlreadyReviewed: true,
        reason: "You have already submitted a review for this product. Thank you for your feedback!",
        isVerifiedPurchase: userReview.isVerifiedPurchase ?? true,
        adminGranted: userReview.adminGranted ?? false,
      };
    }

    // 2. Check if customer has an order containing this product with order_status = 'delivered'
    let deliveredOrder: any = null;

    if (sql) {
      try {
        const rows = await sql`
          SELECT o.id, o.order_number as "orderNumber"
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE (o.customer_id = ${customerId || ""} OR LOWER(o.customer_email) = ${cleanEmail})
            AND o.order_status = 'delivered'
            AND oi.product_id = ${productId}
          ORDER BY o.created_at DESC
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          deliveredOrder = rows[0];
        }
      } catch (err) {
        console.error("DB checkUserReviewEligibility order check err:", err);
      }
    }

    if (!deliveredOrder) {
      deliveredOrder = store.orders.find((o) => {
        const isUserOrder = (customerId && o.customerId === customerId) || (cleanEmail && o.customerEmail?.toLowerCase() === cleanEmail);
        const isDelivered = o.orderStatus === "delivered";
        const hasItem = o.items?.some((i: any) => i.productId === productId);
        return isUserOrder && isDelivered && hasItem;
      });
    }

    if (deliveredOrder) {
      return {
        canReview: true,
        hasAlreadyReviewed: false,
        isVerifiedPurchase: true,
        adminGranted: false,
        orderId: deliveredOrder.id,
      };
    }

    // 3. Check if admin granted review permission to this registered customer for this product
    let grantedPerm = store.productReviewPermissions.find(
      (p) =>
        p.productId === productId &&
        ((customerId && p.customerId === customerId) || (cleanEmail && p.customerEmail?.toLowerCase() === cleanEmail))
    );

    if (!grantedPerm && sql) {
      try {
        const rows = await sql`
          SELECT id, has_reviewed as "hasReviewed"
          FROM product_review_permissions
          WHERE product_id = ${productId}
            AND (customer_id = ${customerId || ""} OR LOWER(customer_email) = ${cleanEmail});
        `;
        if (rows && rows.length > 0) {
          grantedPerm = rows[0];
        }
      } catch {}
    }

    if (grantedPerm) {
      return {
        canReview: !grantedPerm.hasReviewed,
        hasAlreadyReviewed: Boolean(grantedPerm.hasReviewed),
        reason: grantedPerm.hasReviewed ? "You have already submitted your invited review." : undefined,
        isVerifiedPurchase: false,
        adminGranted: true,
      };
    }

    return {
      canReview: false,
      hasAlreadyReviewed: false,
      reason: "Only verified buyers who have received delivery or reviewers invited by the studio can submit a review.",
      isVerifiedPurchase: false,
      adminGranted: false,
    };
  },

  async getDeliveredUnreviewedOrders(customerIdOrEmail: string) {
    const clean = customerIdOrEmail.trim().toLowerCase();
    let deliveredOrders: any[] = [];

    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            id,
            order_number as "orderNumber",
            customer_name as "customerName",
            customer_email as "customerEmail",
            total_amount as "totalAmount",
            order_status as "orderStatus",
            delivered_popup_seen as "deliveredPopupSeen",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          WHERE (customer_id = ${customerIdOrEmail} OR LOWER(customer_email) = ${clean})
            AND order_status = 'delivered'
            AND (delivered_popup_seen IS FALSE OR delivered_popup_seen IS NULL)
          ORDER BY updated_at DESC, created_at DESC
          LIMIT 1;
        `;

        if (rows && rows.length > 0) {
          const ord = rows[0];
          const items = await sql`
            SELECT 
              oi.id,
              oi.product_id as "productId",
              oi.product_name as "productName",
              oi.quantity,
              oi.unit_price as "unitPrice",
              (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY display_order ASC LIMIT 1) as "imageUrl",
              EXISTS (
                SELECT 1 FROM reviews 
                WHERE product_id = oi.product_id 
                  AND (customer_id = ${customerIdOrEmail} OR LOWER(customer_email) = ${clean})
              ) as "hasReviewed"
            FROM order_items oi
            WHERE oi.order_id = ${ord.id};
          `;
          ord.items = items || [];
          deliveredOrders.push(ord);
        }
      } catch (err) {
        console.error("DB getDeliveredUnreviewedOrders err:", err);
      }
    }

    if (deliveredOrders.length === 0) {
      const memOrd = store.orders.find(
        (o) =>
          (o.customerId === customerIdOrEmail || o.customerEmail?.toLowerCase() === clean) &&
          o.orderStatus === "delivered" &&
          !o.deliveredPopupSeen
      );

      if (memOrd) {
        const itemsWithStatus = (memOrd.items || []).map((item: any) => {
          const prod = store.products.find((p) => p.id === item.productId);
          const hasReviewed = store.reviews.some(
            (r) =>
              r.productId === item.productId &&
              (r.customerId === customerIdOrEmail || r.customerEmail?.toLowerCase() === clean)
          );
          return {
            ...item,
            imageUrl: prod?.images?.[0]?.imageUrl || "",
            hasReviewed,
          };
        });

        deliveredOrders.push({
          ...memOrd,
          items: itemsWithStatus,
        });
      }
    }

    return deliveredOrders[0] || null;
  },

  async markOrderDeliveredPopupSeen(orderIdOrNumber: string) {
    const mem = store.orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);
    if (mem) {
      mem.deliveredPopupSeen = true;
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET delivered_popup_seen = TRUE
          WHERE id = ${orderIdOrNumber} OR order_number = ${orderIdOrNumber};
        `;
      } catch (err) {
        console.error("DB markOrderDeliveredPopupSeen err:", err);
      }
    }
    return { success: true };
  },

  async grantReviewPermission(customerId: string, productId: string, adminId?: string) {
    const customer = await this.getCustomerById(customerId);
    const product = await this.getProductById(productId);

    if (!customer || !product) {
      throw new Error("Customer or Product not found");
    }

    const permId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPerm = {
      id: permId,
      productId: product.id,
      customerId: customer.id,
      customerEmail: customer.email.toLowerCase(),
      customerName: customer.name,
      grantedByAdminId: adminId || "admin",
      hasReviewed: false,
      createdAt: new Date(),
    };

    // Remove existing permission if any in memory
    store.productReviewPermissions = store.productReviewPermissions.filter(
      (p) => !(p.productId === productId && p.customerId === customerId)
    );
    store.productReviewPermissions.unshift(newPerm);

    if (sql) {
      try {
        await sql`
          INSERT INTO product_review_permissions (
            id, product_id, customer_id, customer_email, customer_name,
            granted_by_admin_id, has_reviewed, created_at
          ) VALUES (
            ${newPerm.id}, ${newPerm.productId}, ${newPerm.customerId}, ${newPerm.customerEmail},
            ${newPerm.customerName}, ${newPerm.grantedByAdminId}, FALSE, NOW()
          )
          ON CONFLICT (product_id, customer_id)
          DO UPDATE SET 
            has_reviewed = FALSE,
            created_at = NOW();
        `;
      } catch (err) {
        console.error("DB grantReviewPermission err:", err);
      }
    }

    return newPerm;
  },

  async getReviewPermissions() {
    let perms: any[] = [];

    if (sql) {
      try {
        const rows = await sql`
          SELECT 
            p.id,
            p.product_id as "productId",
            p.customer_id as "customerId",
            p.customer_email as "customerEmail",
            p.customer_name as "customerName",
            p.granted_by_admin_id as "grantedByAdminId",
            p.has_reviewed as "hasReviewed",
            p.created_at as "createdAt",
            prod.name as "productName",
            prod.slug as "productSlug",
            prod.sku as "productSku"
          FROM product_review_permissions p
          LEFT JOIN products prod ON p.product_id = prod.id
          ORDER BY p.created_at DESC;
        `;
        if (rows) perms = rows;
      } catch (err) {
        console.error("DB getReviewPermissions err:", err);
      }
    }

    if (perms.length === 0) {
      perms = store.productReviewPermissions.map((perm) => {
        const prod = store.products.find((p) => p.id === perm.productId);
        return {
          ...perm,
          productName: prod?.name || "Product",
          productSlug: prod?.slug || "",
          productSku: prod?.sku || "",
        };
      });
    }

    return perms;
  },

  async revokeReviewPermission(id: string) {
    store.productReviewPermissions = store.productReviewPermissions.filter((p) => p.id !== id);

    if (sql) {
      try {
        await sql`DELETE FROM product_review_permissions WHERE id = ${id};`;
      } catch (err) {
        console.error("DB revokeReviewPermission err:", err);
      }
    }
    return { success: true };
  },
};
