import { defineStore } from "pinia";
import { mockOrders } from "~/data/mock";
import type { Address, Order, PaymentMethod, PickupType } from "~/types/domain";

export interface CheckoutInput {
  recipientName: string;
  recipientPhone: string;
  address: Address;
  deliveryMemo: string;
  pickupType: PickupType;
  pointUsed: number;
  paymentMethod: PaymentMethod;
}

const ordersKey = "blend-on-orders";

const readOrders = (): Order[] => {
  if (!import.meta.client) return [...mockOrders];
  const raw = localStorage.getItem(ordersKey);
  return raw ? (JSON.parse(raw) as Order[]) : [...mockOrders];
};

const writeOrders = (orders: Order[]) => {
  if (import.meta.client)
    localStorage.setItem(ordersKey, JSON.stringify(orders));
};

export const useOrderStore = defineStore("order", {
  state: () => ({
    orders: [...mockOrders] as Order[],
    loading: false,
  }),
  getters: {
    myOrders: (state) => {
      const uid = useAuthStore().profile?.uid;
      return state.orders.filter(
        (order) => !uid || order.userId === uid || order.userId === "mock-user",
      );
    },
    pendingPaymentCount: (state) =>
      state.orders.filter(
        (order) =>
          order.paymentStatus === "pending" || order.paymentStatus === "ready",
      ).length,
    preparingDeliveryCount: (state) =>
      state.orders.filter((order) => order.deliveryStatus === "ready").length,
    todayOrderCount: (state) => state.orders.length,
    todayRevenue: (state) =>
      state.orders
        .filter((order) => order.paymentStatus === "paid")
        .reduce((sum, order) => sum + order.totalAmount, 0),
    recentOrders: (state) =>
      [...state.orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
  },
  actions: {
    hydrate() {
      this.orders = readOrders();
    },
    async createPendingOrder(input: CheckoutInput) {
      const auth = useAuthStore();
      const cart = useCartStore();
      if (!auth.profile) throw new Error("로그인이 필요합니다.");
      if (cart.items.length === 0) throw new Error("장바구니가 비어 있습니다.");
      this.loading = true;
      try {
        const firebase = useNuxtApp().$firebase;
        const token =
          firebase.enabled && firebase.auth?.currentUser
            ? await firebase.auth.currentUser.getIdToken()
            : "";
        const order = await useGlobalLoading().withLoading(
          () =>
            $fetch<Order>("/api/orders/create", {
              method: "POST",
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              body: {
                user: auth.profile,
                cartItems: cart.items,
                checkout: input,
              },
            }),
          "주문을 생성하는 중",
        );
        this.orders.unshift(order);
        writeOrders(this.orders);
        return order;
      } finally {
        this.loading = false;
      }
    },
    async verifyPayment(orderId: string, paymentId: string) {
      const result = await useGlobalLoading().withLoading(
        () =>
          $fetch<{ order: Order }>("/api/payments/verify", {
            method: "POST",
            body: { orderId, paymentId },
          }),
        "결제를 검증하는 중",
      );
      const index = this.orders.findIndex(
        (order) => order.id === result.order.id,
      );
      if (index >= 0) this.orders[index] = result.order;
      else this.orders.unshift(result.order);
      writeOrders(this.orders);
      return result.order;
    },
    updateOrder(order: Order) {
      const index = this.orders.findIndex((item) => item.id === order.id);
      if (index >= 0) this.orders[index] = order;
      else this.orders.unshift(order);
      writeOrders(this.orders);
    },
    setOrderStatus(orderId: string, status: Order["orderStatus"]) {
      const order = this.orders.find((item) => item.id === orderId);
      if (order) {
        order.orderStatus = status;
        order.updatedAt = new Date().toISOString();
        writeOrders(this.orders);
      }
    },
    setDeliveryStatus(orderId: string, status: Order["deliveryStatus"]) {
      const order = this.orders.find((item) => item.id === orderId);
      if (order) {
        order.deliveryStatus = status;
        order.updatedAt = new Date().toISOString();
        writeOrders(this.orders);
      }
    },
  },
});
