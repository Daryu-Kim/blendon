import { defineStore } from "pinia";
import {
  canBuyProduct,
  currentUnitPrice,
  gradeDiscountAmount,
  regularMemberUnitPrice,
} from "~/utils/access";
import type { CartItem } from "~/types/domain";

const cartStorageKey = "blend-on-cart";

const readCart = (): CartItem[] => {
  if (!import.meta.client) return [];
  const raw = localStorage.getItem(cartStorageKey);
  return raw ? (JSON.parse(raw) as CartItem[]) : [];
};

const writeCart = (items: CartItem[]) => {
  if (import.meta.client)
    localStorage.setItem(cartStorageKey, JSON.stringify(items));
};

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [] as CartItem[],
  }),
  getters: {
    count: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    detailedItems: (state) => {
      const productStore = useProductStore();
      const auth = useAuthStore();
      return state.items
        .map((item) => {
          const product = productStore.findById(item.productId);
          const option = product?.options.find(
            (candidate) => candidate.optionId === item.optionId,
          );
          if (!product || !option) return null;
          const unitPrice =
            currentUnitPrice(product, auth.profile, productStore.gradeBenefits) +
            option.additionalPrice;
          const regularUnitPrice =
            regularMemberUnitPrice(product) + option.additionalPrice;
          return {
            ...item,
            product,
            option,
            unitPrice,
            regularUnitPrice,
            gradeDiscountAmount: gradeDiscountAmount(
              product,
              auth.profile,
              productStore.gradeBenefits,
            ),
            totalPrice: unitPrice * item.quantity,
          };
        })
        .filter(Boolean);
    },
    subtotal(): number {
      return this.detailedItems.reduce(
        (sum, item) => sum + (item?.totalPrice || 0),
        0,
      );
    },
    deliveryFee(): number {
      if (this.subtotal === 0 || this.subtotal >= 50000) return 0;
      return 3000;
    },
    total(): number {
      return this.subtotal + this.deliveryFee;
    },
  },
  actions: {
    hydrate() {
      this.items = readCart();
    },
    add(productId: string, optionId: string, quantity = 1) {
      const auth = useAuthStore();
      const productStore = useProductStore();
      const product = productStore.findById(productId);
      if (
        !product ||
        !canBuyProduct(product, auth.profile, productStore.gradeBenefits)
      ) {
        throw new Error("구매 권한 또는 재고를 확인해 주세요.");
      }
      const option = product.options.find((item) => item.optionId === optionId);
      if (!option || !option.isActive || option.stock < quantity) {
        throw new Error("선택한 옵션의 재고를 확인해 주세요.");
      }
      const existing = this.items.find(
        (item) => item.productId === productId && item.optionId === optionId,
      );
      const now = new Date().toISOString();
      if (existing) existing.quantity += quantity;
      else {
        this.items.push({
          id: `${productId}-${optionId}`,
          userId: auth.profile?.uid || "guest",
          productId,
          optionId,
          quantity,
          createdAt: now,
          updatedAt: now,
        });
      }
      writeCart(this.items);
    },
    updateQuantity(id: string, quantity: number) {
      const item = this.items.find((candidate) => candidate.id === id);
      if (!item) return;
      item.quantity = Math.max(1, quantity);
      item.updatedAt = new Date().toISOString();
      writeCart(this.items);
    },
    remove(id: string) {
      this.items = this.items.filter((item) => item.id !== id);
      writeCart(this.items);
    },
    clear() {
      this.items = [];
      writeCart(this.items);
    },
  },
});
