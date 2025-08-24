import { CartCustomization, CartStore } from "@/types";
import { create } from "zustand";

// feat: Enhance search functionality with Appwrite integration and UI components

// - Implemented search functionality in the search tab with FlatList for menu items.
// - Added Searchbar component for user input and filtering.
// - Created Filter component for category selection.
// - Integrated MenuCard component to display menu items.
// - Developed useAppwrite hook for data fetching from Appwrite.
// - Added dummy data for categories, customizations, and menu items.
// - Established cart store for managing cart items and quantities.
// - Updated Appwrite configuration for menu and category management.

function areCustomizationsEqual(
  a: CartCustomization[] = [],
  b: CartCustomization[] = []
): boolean {
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));

  return aSorted.every((item, idx) => item.id === bSorted[idx].id);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    const customizations = item.customizations ?? [];

    const existing = get().items.find(
      (i) =>
        i.id === item.id &&
        areCustomizationsEqual(i.customizations ?? [], customizations)
    );

    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({
        items: [...get().items, { ...item, quantity: 1, customizations }],
      });
    }
  },

  removeItem: (id, customizations = []) => {
    set({
      items: get().items.filter(
        (i) =>
          !(
            i.id === id &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
          )
      ),
    });
  },

  increaseQty: (id, customizations = []) => {
    set({
      items: get().items.map((i) =>
        i.id === id &&
        areCustomizationsEqual(i.customizations ?? [], customizations)
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ),
    });
  },

  decreaseQty: (id, customizations = []) => {
    set({
      items: get()
        .items.map((i) =>
          i.id === id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0),
    });
  },

  clearCart: () => set({ items: [] }),

  getTotalItems: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),

  getTotalPrice: () =>
    get().items.reduce((total, item) => {
      const base = item.price;
      const customPrice =
        item.customizations?.reduce(
          (s: number, c: CartCustomization) => s + c.price,
          0
        ) ?? 0;
      return total + item.quantity * (base + customPrice);
    }, 0),
}));
