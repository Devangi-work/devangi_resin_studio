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
const sql = isLiveNeonConfigured ? neon(process.env.DATABASE_URL!) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

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
}

const globalForStore = globalThis as unknown as {
  __resinStore?: StoreState;
};

function getInitialStoreState(): StoreState {
  return {
    categories: JSON.parse(JSON.stringify(initialCategories)),
    products: JSON.parse(JSON.stringify(initialProducts)),
    orders: JSON.parse(JSON.stringify(initialOrders)),
    coupons: JSON.parse(JSON.stringify(initialCoupons)),
    inventoryMovements: [
      {
        id: "mov_1",
        productId: "prod_ocean_coasters",
        variantId: null,
        previousQuantity: 20,
        newQuantity: 18,
        changeAmount: -2,
        reason: "purchase",
        adminUserId: "system",
        createdAt: new Date("2026-10-08T14:22:00Z"),
      },
    ],
    siteSettings: {
      id: "default",
      storeName: "Devangi Resin Studio",
      storeTagline: "Handcrafted Resin Creations by Devangi",
      storeDescription: "Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.",
      logoUrl: null,
      contactEmail: "devangi0403@gmail.com",
      contactPhone: "+91 98765 43210",
      whatsappNumber: "+919876543210",
      instagramUrl: "https://instagram.com/devangiresinstudio",
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
      updatedAt: new Date(),
    },
    customRequests: [],
  };
}

const store: StoreState = globalForStore.__resinStore || getInitialStoreState();
if (process.env.NODE_ENV !== "production") {
  globalForStore.__resinStore = store;
}

// =========================================================================
// REPOSITORY METHODS
// =========================================================================

export const dbStore = {
  // ---------------- CATEGORIES ----------------
  async getCategories(onlyPublished = false) {
    let cats = [...store.categories];
    if (onlyPublished) {
      cats = cats.filter((c) => c.isPublished);
    }
    return cats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async getCategoryBySlug(slug: string) {
    return store.categories.find((c) => c.slug === slug) || null;
  },

  async createCategory(data: any) {
    const newCat = {
      ...data,
      id: data.id || `cat_${Date.now()}`,
      displayOrder: Number(data.displayOrder) || store.categories.length + 1,
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.categories.push(newCat);
    return newCat;
  },

  async updateCategory(id: string, data: any) {
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.categories[idx] = {
      ...store.categories[idx],
      ...data,
      updatedAt: new Date(),
    };
    return store.categories[idx];
  },

  async deleteCategory(id: string) {
    // Check if products exist in category
    const hasProducts = store.products.some((p) => p.categoryId === id && p.status !== "archived");
    if (hasProducts) {
      throw new Error("Cannot delete category containing active products. Reassign or archive products first.");
    }
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ---------------- PRODUCTS ----------------
  async getProducts(filters?: {
    status?: string | string[];
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    isFeatured?: boolean;
    isBestseller?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sort?: "price_asc" | "price_desc" | "newest" | "popularity";
    page?: number;
    limit?: number;
  }) {
    let prods = [...store.products];

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
      const cat = store.categories.find((c) => c.slug === filters.categorySlug);
      if (cat) {
        prods = prods.filter((p) => p.categoryId === cat.id);
      } else {
        return { products: [], total: 0, page: 1, totalPages: 0 };
      }
    } else if (filters?.categoryId) {
      prods = prods.filter((p) => p.categoryId === filters.categoryId);
    }

    // Search filter
    if (filters?.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(query))
      );
    }

    // Featured / Bestseller
    if (filters?.isFeatured !== undefined) {
      prods = prods.filter((p) => p.isFeatured === filters.isFeatured);
    }
    if (filters?.isBestseller !== undefined) {
      prods = prods.filter((p) => p.isBestseller === filters.isBestseller);
    }

    // Price range
    if (filters?.minPrice !== undefined) {
      prods = prods.filter((p) => {
        const price = Number(p.salePrice || p.regularPrice);
        return price >= filters.minPrice!;
      });
    }
    if (filters?.maxPrice !== undefined) {
      prods = prods.filter((p) => {
        const price = Number(p.salePrice || p.regularPrice);
        return price <= filters.maxPrice!;
      });
    }

    // Stock availability
    if (filters?.inStockOnly) {
      prods = prods.filter((p) => !p.trackInventory || p.stockQuantity > 0 || p.allowBackorders);
    }

    // Sorting
    if (filters?.sort === "price_asc") {
      prods.sort((a, b) => Number(a.salePrice || a.regularPrice) - Number(b.salePrice || b.regularPrice));
    } else if (filters?.sort === "price_desc") {
      prods.sort((a, b) => Number(b.salePrice || b.regularPrice) - Number(a.salePrice || a.regularPrice));
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
    const prod = store.products.find((p) => p.slug === slug);
    if (!prod) return null;
    const cat = store.categories.find((c) => c.id === prod.categoryId);
    return { ...prod, category: cat };
  },

  async getProductById(id: string) {
    const prod = store.products.find((p) => p.id === id);
    if (!prod) return null;
    const cat = store.categories.find((c) => c.id === prod.categoryId);
    return { ...prod, category: cat };
  },

  async createProduct(data: any) {
    const id = data.id || `prod_${Date.now()}`;
    const newProduct = {
      ...data,
      id,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      regularPrice: Number(data.regularPrice).toFixed(2),
      salePrice: data.salePrice ? Number(data.salePrice).toFixed(2) : null,
      stockQuantity: Number(data.stockQuantity) || 0,
      images: data.images || [],
      variants: data.variants || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.products.unshift(newProduct);

    // Record initial inventory movement if tracking
    if (newProduct.trackInventory && newProduct.stockQuantity > 0) {
      store.inventoryMovements.unshift({
        id: `mov_${Date.now()}`,
        productId: id,
        variantId: null,
        previousQuantity: 0,
        newQuantity: newProduct.stockQuantity,
        changeAmount: newProduct.stockQuantity,
        reason: "Initial Product Creation",
        adminUserId: "admin",
        createdAt: new Date(),
      });
    }

    return newProduct;
  },

  async updateProduct(id: string, data: any) {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const prev = store.products[idx];
    const newStock = data.stockQuantity !== undefined ? Number(data.stockQuantity) : prev.stockQuantity;

    // Track stock change
    if (data.stockQuantity !== undefined && newStock !== prev.stockQuantity) {
      store.inventoryMovements.unshift({
        id: `mov_${Date.now()}`,
        productId: id,
        variantId: null,
        previousQuantity: prev.stockQuantity,
        newQuantity: newStock,
        changeAmount: newStock - prev.stockQuantity,
        reason: "Admin Product Edit",
        adminUserId: "admin",
        createdAt: new Date(),
      });
    }

    store.products[idx] = {
      ...prev,
      ...data,
      regularPrice: data.regularPrice !== undefined ? Number(data.regularPrice).toFixed(2) : prev.regularPrice,
      salePrice: data.salePrice !== undefined && data.salePrice !== null ? Number(data.salePrice).toFixed(2) : data.salePrice === null ? null : prev.salePrice,
      stockQuantity: newStock,
      updatedAt: new Date(),
    };

    return store.products[idx];
  },

  async duplicateProduct(id: string) {
    const original = store.products.find((p) => p.id === id);
    if (!original) return null;

    const newId = `prod_${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: `${original.sku}-CPY`,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.products.unshift(duplicated);
    return duplicated;
  },

  async deleteProduct(id: string) {
    // Check if product is in orders
    const hasOrders = store.orders.some((o) =>
      o.items?.some((item: any) => item.productId === id)
    );

    if (hasOrders) {
      // Archive instead of permanent deletion to preserve historical order accuracy
      await this.updateProduct(id, { status: "archived" });
      return { archived: true, message: "Product is associated with existing orders and has been safely archived." };
    }

    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.products.splice(idx, 1);
      return { deleted: true };
    }
    return { notFound: true };
  },

  async bulkUpdateProductStatus(ids: string[], status: "draft" | "published" | "archived") {
    store.products.forEach((p) => {
      if (ids.includes(p.id)) {
        p.status = status;
        p.updatedAt = new Date();
      }
    });
    return true;
  },

  // ---------------- INVENTORY ----------------
  async getInventoryOverview() {
    return store.products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: store.categories.find((c) => c.id === p.categoryId)?.name || "Uncategorized",
      trackInventory: p.trackInventory,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      allowBackorders: p.allowBackorders,
      isLowStock: p.trackInventory && p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0,
      isOutOfStock: p.trackInventory && p.stockQuantity <= 0,
      variants: p.variants || [],
    }));
  },

  async adjustStock(productId: string, variantId: string | null, changeAmount: number, reason: string, adminUserId = "admin") {
    const prod = store.products.find((p) => p.id === productId);
    if (!prod) throw new Error("Product not found");

    if (variantId && prod.variants) {
      const v = prod.variants.find((v: any) => v.id === variantId);
      if (!v) throw new Error("Variant not found");
      const prev = v.inventory;
      v.inventory = Math.max(0, prev + changeAmount);
      store.inventoryMovements.unshift({
        id: `mov_${Date.now()}`,
        productId,
        variantId,
        previousQuantity: prev,
        newQuantity: v.inventory,
        changeAmount,
        reason,
        adminUserId,
        createdAt: new Date(),
      });
      return { previousQuantity: prev, newQuantity: v.inventory };
    }

    const prev = prod.stockQuantity;
    prod.stockQuantity = Math.max(0, prev + changeAmount);
    store.inventoryMovements.unshift({
      id: `mov_${Date.now()}`,
      productId,
      variantId: null,
      previousQuantity: prev,
      newQuantity: prod.stockQuantity,
      changeAmount,
      reason,
      adminUserId,
      createdAt: new Date(),
    });

    return { previousQuantity: prev, newQuantity: prod.stockQuantity };
  },

  async getInventoryMovements(productId?: string) {
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
            internal_notes as "internalNotes",
            order_source as "orderSource",
            is_discarded as "isDiscarded",
            discarded_at as "discardedAt",
            secure_lookup_token as "secureLookupToken",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          ORDER BY created_at DESC;
        `;

        if (rows && rows.length > 0) {
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
    let ord = store.orders.find((o) => o.id === id);
    if (!ord && sql) {
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
            internal_notes as "internalNotes",
            order_source as "orderSource",
            is_discarded as "isDiscarded",
            discarded_at as "discardedAt",
            secure_lookup_token as "secureLookupToken",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM orders
          WHERE id = ${id}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          ord = rows[0];
          const items = await sql`
            SELECT 
              id, product_id as "productId", variant_id as "variantId",
              product_name as "productName", variant_name as "variantName",
              sku, unit_price as "unitPrice", quantity, total_price as "totalPrice",
              personalization_details as "personalizationDetails",
              reference_image_url as "referenceImageUrl"
            FROM order_items
            WHERE order_id = ${ord.id};
          `;
          ord.items = items || [];
        }
      } catch (err) {
        console.error("DB getOrderById error:", err);
      }
    }
    return ord || null;
  },

  async getOrderByNumber(orderNumber: string, verificationInput?: string) {
    let ord = store.orders.find((o) => o.orderNumber === orderNumber);

    if (!ord && sql) {
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
            internal_notes as "internalNotes",
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
              id, product_id as "productId", variant_id as "variantId",
              product_name as "productName", variant_name as "variantName",
              sku, unit_price as "unitPrice", quantity, total_price as "totalPrice",
              personalization_details as "personalizationDetails",
              reference_image_url as "referenceImageUrl"
            FROM order_items
            WHERE order_id = ${ord.id};
          `;
          ord.items = items || [];
        }
      } catch (err) {
        console.error("DB getOrderByNumber err:", err);
      }
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
    const id = data.id || `ord_${Date.now()}`;
    const orderNumber = data.orderNumber || `RA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const secureLookupToken = `sec_${Math.random().toString(36).substring(2, 12)}`;

    const newOrder = {
      ...data,
      id,
      orderNumber,
      secureLookupToken,
      subtotal: Number(data.subtotal).toFixed(2),
      discountAmount: Number(data.discountAmount || 0).toFixed(2),
      shippingCharge: Number(data.shippingCharge || 0).toFixed(2),
      taxAmount: Number(data.taxAmount || 0).toFixed(2),
      totalAmount: Number(data.totalAmount).toFixed(2),
      orderStatus: data.orderStatus || "confirmed",
      paymentStatus: data.paymentStatus || "pending_verification",
      paymentMethod: data.paymentMethod || "upi",
      orderSource: data.orderSource || "online",
      isDiscarded: false,
      upiTransactionId: data.upiTransactionId || null,
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
            shipping_postal_code, shipping_country, order_notes, subtotal, discount_amount,
            shipping_charge, tax_amount, total_amount, order_status, payment_status,
            payment_method, upi_transaction_id, secure_lookup_token, order_source, is_discarded,
            created_at, updated_at
          ) VALUES (
            ${id}, ${orderNumber}, ${data.customerId || null}, ${data.customerName}, ${data.customerEmail}, ${data.customerPhone},
            ${data.shippingAddressLine1}, ${data.shippingAddressLine2 || null}, ${data.shippingCity}, ${data.shippingState},
            ${data.shippingPostalCode}, ${data.shippingCountry || 'India'}, ${data.orderNotes || null},
            ${Number(data.subtotal).toFixed(2)}, ${Number(data.discountAmount || 0).toFixed(2)},
            ${Number(data.shippingCharge || 0).toFixed(2)}, ${Number(data.taxAmount || 0).toFixed(2)},
            ${Number(data.totalAmount).toFixed(2)}, ${newOrder.orderStatus}, ${newOrder.paymentStatus},
            ${newOrder.paymentMethod}, ${newOrder.upiTransactionId}, ${secureLookupToken}, ${newOrder.orderSource}, false,
            NOW(), NOW()
          );
        `;

        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await sql`
              INSERT INTO order_items (
                id, order_id, product_id, variant_id, product_name, variant_name,
                sku, unit_price, quantity, total_price, personalization_details, reference_image_url
              ) VALUES (
                ${itemId}, ${id}, ${item.productId || null}, ${item.variantId || null},
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

  async updateOrderStatus(id: string, newStatus: string, notes?: string, updatedBy = "admin") {
    const ord = store.orders.find((o) => o.id === id);
    if (ord) {
      ord.orderStatus = newStatus;
      if (notes) ord.internalNotes = `${ord.internalNotes || ""}\n[${new Date().toISOString()}] ${notes}`.trim();
      ord.updatedAt = new Date();
    }

    if (sql) {
      try {
        await sql`
          UPDATE orders
          SET 
            order_status = ${newStatus},
            internal_notes = CASE 
              WHEN ${notes || null} IS NOT NULL 
              THEN CONCAT(COALESCE(internal_notes, ''), E'\n', ${notes || ''}) 
              ELSE internal_notes 
            END,
            updated_at = NOW()
          WHERE id = ${id} OR order_number = ${id};
        `;
      } catch (err) {
        console.error("DB updateOrderStatus err:", err);
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
    const ord = store.orders.find((o) => o.id === id);
    if (!ord) return null;

    ord.trackingNumber = trackingNumber;
    ord.courierName = courierName;
    ord.orderStatus = "shipped";
    ord.updatedAt = new Date();
    return ord;
  },

  // ---------------- COUPONS ----------------
  async getCoupons() {
    return [...store.coupons];
  },

  async getCouponByCode(code: string) {
    return store.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase()) || null;
  },

  async validateCoupon(code: string, cartAmount: number, customerEmail?: string) {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) return { valid: false, message: "Invalid coupon code." };
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

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (cartAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Math.min(Number(coupon.discountValue), cartAmount);
    }

    return {
      valid: true,
      coupon,
      discountAmount: Number(discount.toFixed(2)),
    };
  },

  async createCoupon(data: any) {
    const newCoupon = {
      ...data,
      id: `cpn_${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      discountValue: Number(data.discountValue).toFixed(2),
      minCartAmount: Number(data.minCartAmount || 0).toFixed(2),
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount).toFixed(2) : null,
      currentRedemptions: 0,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.coupons.unshift(newCoupon);
    return newCoupon;
  },

  async updateCoupon(id: string, data: any) {
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.coupons[idx] = {
      ...store.coupons[idx],
      ...data,
      code: data.code ? data.code.toUpperCase().trim() : store.coupons[idx].code,
      updatedAt: new Date(),
    };
    return store.coupons[idx];
  },

  async deleteCoupon(id: string) {
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.coupons.splice(idx, 1);
      return true;
    }
    return false;
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
            id, store_name, store_tagline, store_description, contact_email,
            contact_phone, whatsapp_number, instagram_url, facebook_url, pinterest_url,
            default_shipping_charge, free_shipping_threshold, production_time_message,
            shipping_policy, return_policy, privacy_policy, terms_policy, care_instructions_default,
            upi_id, upi_qr_code_url, account_holder_name, updated_at
          ) VALUES (
            'default',
            ${data.storeName ?? store.siteSettings.storeName},
            ${data.storeTagline ?? store.siteSettings.storeTagline},
            ${data.storeDescription ?? store.siteSettings.storeDescription},
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
            ${data.upiId ?? store.siteSettings.upiId ?? 'devangi0403@okaxis'},
            ${data.upiQrCodeUrl ?? store.siteSettings.upiQrCodeUrl ?? ''},
            ${data.accountHolderName ?? store.siteSettings.accountHolderName ?? 'Devangi Resin Studio'},
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            store_name = EXCLUDED.store_name,
            store_tagline = EXCLUDED.store_tagline,
            store_description = EXCLUDED.store_description,
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
            upi_id = EXCLUDED.upi_id,
            upi_qr_code_url = EXCLUDED.upi_qr_code_url,
            account_holder_name = EXCLUDED.account_holder_name,
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
    return null;
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
    return null;
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
    if (sql) {
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
    }
    return {
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
    if (sql) {
      await sql`
        UPDATE customers
        SET
          name = COALESCE(${data.name || null}, name),
          phone = COALESCE(${data.phone || null}, phone),
          address_line1 = COALESCE(${data.addressLine1 || null}, address_line1),
          address_line2 = COALESCE(${data.addressLine2 || null}, address_line2),
          city = COALESCE(${data.city || null}, city),
          state = COALESCE(${data.state || null}, state),
          postal_code = COALESCE(${data.postalCode || null}, postal_code),
          country = COALESCE(${data.country || null}, country),
          updated_at = NOW()
        WHERE id = ${id};
      `;
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

  // ---------------- DASHBOARD ANALYTICS ----------------
  async getDashboardStats() {
    const paidOrders = store.orders.filter((o) => o.paymentStatus === "paid");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const awaitingPayment = store.orders.filter((o) => o.paymentStatus === "pending").length;
    const awaitingFulfilment = store.orders.filter(
      (o) => o.paymentStatus === "paid" && ["confirmed", "processing", "ready_to_ship"].includes(o.orderStatus)
    ).length;
    const completedOrders = store.orders.filter((o) => o.orderStatus === "delivered").length;

    const lowStockProducts = store.products.filter(
      (p) => p.trackInventory && p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
    );
    const outOfStockProducts = store.products.filter(
      (p) => p.trackInventory && p.stockQuantity <= 0
    );

    return {
      totalOrders: store.orders.length,
      paidOrdersCount: paidOrders.length,
      awaitingPayment,
      awaitingFulfilment,
      completedOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      recentOrders: store.orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentMovements: store.inventoryMovements.slice(0, 5),
    };
  },
};
