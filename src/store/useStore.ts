import { create } from "zustand";
import type { Product, CartItem, Order, Category, Message } from "@/lib/firebase";

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  categories: Category[];
  messages: Message[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isAdminLoggedIn: boolean;

  setProducts: (products: Product[]) => void;
  setOrders: (orders: Order[]) => void;
  setCategories: (categories: Category[]) => void;
  setMessages: (messages: Message[]) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, change: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartItemCount: () => number;

  toggleCart: () => void;
  setCheckoutOpen: (open: boolean) => void;

  setAdminLoggedIn: (logged: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  products: [],
  cart: [],
  orders: [],
  categories: [],
  messages: [],
  isCartOpen: false,
  isCheckoutOpen: false,
  isAdminLoggedIn: localStorage.getItem("stickzone_admin_logged") === "true",

  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),
  setCategories: (categories) => set({ categories }),
  setMessages: (messages) => set({ messages }),

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    })),

  updateQuantity: (productId, change) =>
    set((state) => {
      const updated = state.cart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + change } : item
        )
        .filter((item) => item.quantity > 0);
      return { cart: updated };
    }),

  clearCart: () => set({ cart: [] }),

  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

  cartItemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

  setAdminLoggedIn: (logged) => {
    if (logged) {
      localStorage.setItem("stickzone_admin_logged", "true");
    } else {
      localStorage.removeItem("stickzone_admin_logged");
      localStorage.removeItem("stickzone_current_user");
    }
    set({ isAdminLoggedIn: logged });
  },
}));
