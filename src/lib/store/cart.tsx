"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // unique composite key for item + variant + personalization
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  isFestivalSpecial?: boolean;
  festivalDiscountPercentage?: number | string | null;
  image: string;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
  personalizationDetails?: {
    customName?: string;
    initials?: string;
    color?: string;
    design?: string;
    notes?: string;
  } | null;
  referenceImageUrl?: string | null;
  giftWrapped?: boolean;
  giftWrapCharge?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedCoupon: { code: string; discountAmount: number } | null;
  setAppliedCoupon: (coupon: { code: string; discountAmount: number } | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [storageKey, setStorageKey] = useState<string>("resin_cart_guest");

  // Synchronize cart with active customer account
  const syncUserCart = async () => {
    try {
      const res = await fetch("/api/customer/me");
      const data = await res.json();
      const isAuthenticated = Boolean(data?.authenticated && data?.customer?.id);
      const key = isAuthenticated ? `resin_cart_${data.customer.id}` : "resin_cart_guest";
      setStorageKey(key);
      const stored = localStorage.getItem(key);
      let userItems: CartItem[] = stored ? JSON.parse(stored) : [];

      // If just logged in and had guest items, merge guest cart into user cart
      if (isAuthenticated) {
        const guestStored = localStorage.getItem("resin_cart_guest");
        if (guestStored) {
          try {
            const guestItems: CartItem[] = JSON.parse(guestStored);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const gItem of guestItems) {
                const existingIdx = userItems.findIndex((u) => u.id === gItem.id);
                if (existingIdx !== -1) {
                  userItems[existingIdx].quantity += gItem.quantity;
                } else {
                  userItems.push(gItem);
                }
              }
              localStorage.removeItem("resin_cart_guest");
              localStorage.setItem(key, JSON.stringify(userItems));
            }
          } catch {}
        }
      }

      setItems(userItems);
    } catch (e) {
      console.error("Failed to sync cart key:", e);
      try {
        const stored = localStorage.getItem("resin_cart_guest");
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    syncUserCart();
    window.addEventListener("customer-auth-changed", syncUserCart);
    return () => window.removeEventListener("customer-auth-changed", syncUserCart);
  }, []);

  // Save cart to active account's localStorage key
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to storage:", e);
      }
    }
  }, [items, isLoaded, storageKey]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === newItem.id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...newItem,
          quantity: updated[existingIdx].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem("resin_cart");
      localStorage.removeItem("resin_cart_guest");
    } catch {}
  };

  const subtotal = items.reduce((sum, item) => {
    let itemTotal = item.price * item.quantity;
    if (item.giftWrapped && item.giftWrapCharge) {
      itemTotal += item.giftWrapCharge * item.quantity;
    }
    return sum + itemTotal;
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        appliedCoupon,
        setAppliedCoupon,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
