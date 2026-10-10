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
      storeName: "Aura Resin Art Studio",
      storeTagline: "Handmade Resin Elegance, Preserved Forever",
      storeDescription: "Boutique handmade resin art, bespoke jewellery, personalized gifts, keychains, and coasters crafted with passion.",
      logoUrl: null,
      contactEmail: "hello@auraresinart.com",
      contactPhone: "+91 98765 43210",
      whatsappNumber: "+919876543210",
      instagramUrl: "https://instagram.com/auraresinart",
      facebookUrl: "https://facebook.com/auraresinart",
      pinterestUrl: "https://pinterest.com/auraresinart",
      currency: "INR",
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
  async getOrders(filters?: { status?: string; paymentStatus?: string; search?: string }) {
    let ords = [...store.orders];

    if (filters?.status) {
      ords = ords.filter((o) => o.orderStatus === filters.status);
    }
    if (filters?.paymentStatus) {
      ords = ords.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      ords = ords.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }

    return ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string) {
    return store.orders.find((o) => o.id === id) || null;
  },

  async getOrderByNumber(orderNumber: string, verificationInput?: string) {
    const ord = store.orders.find((o) => o.orderNumber === orderNumber);
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
      orderStatus: data.orderStatus || "pending_payment",
      paymentStatus: data.paymentStatus || "pending",
      items: data.items || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.orders.unshift(newOrder);
    return newOrder;
  },

  async updateOrderStatus(id: string, newStatus: string, notes?: string, updatedBy = "admin") {
    const ord = store.orders.find((o) => o.id === id);
    if (!ord) return null;

    ord.orderStatus = newStatus;
    if (notes) ord.internalNotes = `${ord.internalNotes || ""}\n[${new Date().toISOString()}] ${notes}`.trim();
    ord.updatedAt = new Date();
    return ord;
  },

  async updateOrderPaymentStatus(orderNumberOrId: string, paymentStatus: string, cashfreeDetails?: any) {
    const ord = store.orders.find((o) => o.id === orderNumberOrId || o.orderNumber === orderNumberOrId);
    if (!ord) return null;

    const previousPaymentStatus = ord.paymentStatus;
    ord.paymentStatus = paymentStatus;
    if (paymentStatus === "paid" && previousPaymentStatus !== "paid") {
      ord.orderStatus = "confirmed";

      // Decrement inventory exactly once
      if (ord.items && Array.isArray(ord.items)) {
        for (const item of ord.items) {
          if (item.productId) {
            try {
              await this.adjustStock(
                item.productId,
                item.variantId || null,
                -Number(item.quantity),
                `Order Placed (${ord.orderNumber})`,
                "system"
              );
            } catch (err) {
              console.error("Stock adjustment err:", err);
            }
          }
        }
      }
    }

    ord.updatedAt = new Date();
    return ord;
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
    return { ...store.siteSettings };
  },

  async updateSiteSettings(data: any) {
    store.siteSettings = {
      ...store.siteSettings,
      ...data,
      updatedAt: new Date(),
    };
    return store.siteSettings;
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
