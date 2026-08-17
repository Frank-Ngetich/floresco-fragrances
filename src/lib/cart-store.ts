'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { cartTotal, cartCount } from './utils';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (idx >= 0) {
            const items = [...state.items];
            items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
            return { items };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.size === size)),
        })),
      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => !(i.productId === productId && i.size === size))
            : state.items.map((i) =>
                i.productId === productId && i.size === size ? { ...i, quantity } : i
              ),
        })),
      clearCart: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      total: () => cartTotal(get().items),
      count: () => cartCount(get().items),
    }),
    { name: 'floresco-cart-v2', skipHydration: true }
  )
);
