'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { CartResponse } from '@seethapaati/contracts';
import { fetchApi } from '../lib/api-client';

interface CartContextValue {
  cart: CartResponse | null;
  itemCount: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  coupon: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  removeItem: (variantId: string) => Promise<boolean>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  refreshCart: (activeCoupon?: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [coupon, setCoupon] = useState<string>('');

  // Restore saved coupon from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('seethapaati_coupon');
      if (saved) {
        setCoupon(saved);
      }
    } catch {
      // ignore in environments without localStorage
    }
  }, []);

  const refreshCart = useCallback(async (activeCoupon?: string) => {
    setIsLoading(true);
    try {
      const c = activeCoupon !== undefined ? activeCoupon : coupon;
      const endpoint = c ? `/cart?coupon=${encodeURIComponent(c)}` : '/cart';
      const data = await fetchApi<CartResponse>(endpoint);
      setCart(data);
    } catch {
      // Keep previous cart or null
    } finally {
      setIsLoading(false);
    }
  }, [coupon]);

  // Initial cart load
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = next ? 'hidden' : '';
      }
      return next;
    });
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await fetchApi<CartResponse>('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ variantId, quantity }),
        });
        setCart(updated);
        // Instant visual feedback: slide open the luxury cart drawer!
        openDrawer();
        return true;
      } catch (err) {
        console.error('Failed to add item to bag:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [openDrawer]
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await fetchApi<CartResponse>(`/cart/items/${variantId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        setCart(updated);
        return true;
      } catch (err) {
        console.error('Failed to update quantity:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeItem = useCallback(
    async (variantId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const updated = await fetchApi<CartResponse>(`/cart/items/${variantId}`, {
          method: 'DELETE',
        });
        setCart(updated);
        return true;
      } catch (err) {
        console.error('Failed to remove item:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; message?: string }> => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        return { success: false, message: 'Please enter a coupon code' };
      }
      setIsLoading(true);
      try {
        const data = await fetchApi<CartResponse>(`/cart?coupon=${encodeURIComponent(trimmed)}`);
        setCart(data);
        if (data.pricing?.couponCode) {
          setCoupon(trimmed);
          try {
            localStorage.setItem('seethapaati_coupon', trimmed);
          } catch {
            // ignore
          }
          return { success: true, message: `Coupon ${trimmed} applied successfully!` };
        } else {
          return {
            success: false,
            message: 'Coupon code not applicable or minimum order threshold not met.',
          };
        }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Invalid promo code.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeCoupon = useCallback(async () => {
    setCoupon('');
    try {
      localStorage.removeItem('seethapaati_coupon');
    } catch {
      // ignore
    }
    await refreshCart('');
  }, [refreshCart]);

  const itemCount = useMemo(() => {
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      isLoading,
      isDrawerOpen,
      coupon,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refreshCart,
    }),
    [
      cart,
      itemCount,
      isLoading,
      isDrawerOpen,
      coupon,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
