import { z } from "zod";

// Admin Auth
export const adminLoginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const adminSetupSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().min(2, "Full name is required."),
  setupKey: z.string().min(1, "Setup key is required."),
});

// Category
export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().min(2, "Category slug is required."),
  description: z.string().optional().nullable().or(z.literal("")),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  displayOrder: z.coerce.number().default(0),
  isPublished: z.boolean().default(true),
});

// Product
export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  slug: z.string().min(2, "Slug is required."),
  shortDescription: z.string().optional().nullable(),
  description: z.string().min(3, "Description must be at least 3 characters."),
  categoryId: z.string().min(1, "Category is required."),
  sku: z.string().optional().nullable(),
  productType: z.enum(["ready_made", "made_to_order", "customised"]).default("ready_made"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),

  regularPrice: z.coerce.number().positive("Regular price must be greater than 0."),
  salePrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().positive("Sale price must be positive.").nullable().optional()
  ),
  costPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().nonnegative().nullable().optional()
  ),
  currency: z.string().default("INR"),

  trackInventory: z.boolean().default(true),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(3),
  allowBackorders: z.boolean().default(false),

  enableVariants: z.boolean().default(false),

  enablePersonalization: z.boolean().default(false),
  customNameEnabled: z.boolean().default(false),
  customInitialsEnabled: z.boolean().default(false),
  customColorEnabled: z.boolean().default(false),
  customDesignEnabled: z.boolean().default(false),
  customImageUploadEnabled: z.boolean().default(false),
  personalizationSurcharge: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  customizationInstructions: z.string().optional().nullable(),
  productionTimeDays: z.coerce.number().int().nonnegative().default(3),
  giftWrappingAvailable: z.boolean().default(true),
  giftWrappingCharge: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 49 : Number(val)),
    z.number().nonnegative().default(49)
  ),
  customOrderNotesEnabled: z.boolean().default(true),

  weight: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().nonnegative().nullable().optional()
  ),
  dimensions: z.string().optional().nullable(),
  shippingClass: z.string().default("standard"),
  isFreeShipping: z.boolean().default(false),
  careInstructions: z.string().optional().nullable(),
  materials: z.string().optional().nullable(),
  dispatchTimeDays: z.coerce.number().int().nonnegative().default(2),

  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),

  images: z
    .array(
      z.object({
        id: z.string().optional(),
        imageUrl: z.string().min(1, "Valid image URL required"),
        altText: z.string().optional().nullable(),
        isPrimary: z.boolean().default(false),
        displayOrder: z.number().default(0),
      })
    )
    .optional()
    .default([]),

  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Variant name required"),
        sku: z.string().min(1, "Variant SKU required"),
        priceAdjustment: z.coerce.number().default(0),
        inventory: z.coerce.number().int().nonnegative().default(0),
        imageUrl: z.string().optional().nullable(),
        isActive: z.boolean().default(true),
      })
    )
    .optional()
    .default([]),
});

// Checkout
export const checkoutItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  personalizationDetails: z
    .object({
      customName: z.string().optional(),
      initials: z.string().optional(),
      color: z.string().optional(),
      design: z.string().optional(),
      notes: z.string().optional(),
    })
    .nullable()
    .optional(),
  referenceImageUrl: z.string().nullable().optional(),
  giftWrapped: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Full name is required."),
  customerEmail: z.string().email("Valid email address required."),
  customerPhone: z.string().regex(/^[0-9+ -]{10,15}$/, "Valid 10-digit phone number required."),
  shippingAddressLine1: z.string().min(5, "Address line 1 is required."),
  shippingAddressLine2: z.string().optional().nullable(),
  shippingCity: z.string().min(2, "City is required."),
  shippingState: z.string().min(2, "State is required."),
  shippingPostalCode: z.string().regex(/^[0-9]{6}$/, "Valid 6-digit postal code required."),
  shippingCountry: z.string().default("India"),
  orderNotes: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  upiTransactionId: z.string().min(4, "Please enter your UPI transaction reference / UTR number."),
  paymentScreenshotUrl: z.string().optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty."),
});

// Coupon
export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters."),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive("Discount value must be positive."),
  minCartAmount: z.coerce.number().nonnegative().default(0),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  maxRedemptions: z.coerce.number().int().positive().optional().nullable(),
  perCustomerLimit: z.coerce.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

// Stock Adjustment
export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  variantId: z.string().nullable().optional(),
  changeAmount: z.coerce.number().int(),
  reason: z.string().min(2, "Reason is required"),
});

// Newsletter
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
