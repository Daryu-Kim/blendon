import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { defineStore } from "pinia";
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

const timestampToIso = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
};

const normalizeOrder = (id: string, data: Partial<Order>): Order =>
  ({
    ...data,
    id,
    orderNo: data.orderNo || id,
    userId: data.userId || "",
    items: data.items || [],
    subtotalAmount: Number(data.subtotalAmount || 0),
    deliveryFee: Number(data.deliveryFee || 0),
    discountAmount: Number(data.discountAmount || 0),
    pointUsed: Number(data.pointUsed || 0),
    totalAmount: Number(data.totalAmount || 0),
    paymentStatus: data.paymentStatus || "pending",
    paymentMethod: data.paymentMethod || "card",
    orderStatus: data.orderStatus || "pending",
    deliveryStatus: data.deliveryStatus || "none",
    claimStatus: data.claimStatus || "none",
    paymentProvider: "portone",
    portonePaymentId: data.portonePaymentId || null,
    portoneImpUid: data.portoneImpUid || null,
    paymentId: data.paymentId || null,
    recipientName: data.recipientName || "",
    recipientPhone: data.recipientPhone || "",
    address: data.address || { zipCode: "", address1: "", address2: "" },
    deliveryMemo: data.deliveryMemo || "",
    pickupType: data.pickupType || "delivery",
    deliveryCompany: data.deliveryCompany || "",
    trackingNumber: data.trackingNumber || "",
    shippedAt: data.shippedAt || null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    paidAt: data.paidAt || null,
    completedAt: data.completedAt || null,
    adminMemo: data.adminMemo || "",
  }) satisfies Order;

export const useOrderStore = defineStore("order", {
  state: () => ({
    orders: [] as Order[],
    initialized: false,
    loading: false,
  }),
  getters: {
    myOrders: (state) => {
      const uid = useAuthStore().profile?.uid;
      return uid
        ? state.orders.filter((order) => order.userId === uid)
        : [];
    },
    pendingPaymentCount: (state) =>
      state.orders.filter(
        (order) =>
          order.paymentStatus === "pending" || order.paymentStatus === "ready",
      ).length,
    preparingDeliveryCount: (state) =>
      state.orders.filter((order) => order.deliveryStatus === "ready").length,
    todayOrderCount: (state) => {
      const today = new Date().toISOString().slice(0, 10);
      return state.orders.filter((order) => order.createdAt.startsWith(today))
        .length;
    },
    todayRevenue: (state) => {
      const today = new Date().toISOString().slice(0, 10);
      return state.orders
        .filter(
          (order) =>
            order.paymentStatus === "paid" && order.createdAt.startsWith(today),
        )
        .reduce((sum, order) => sum + order.totalAmount, 0);
    },
    recentOrders: (state) =>
      [...state.orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
  },
  actions: {
    async fetchOrders(force = false) {
      if (this.initialized && !force) return;
      const firebase = useNuxtApp().$firebase;
      const auth = useAuthStore();
      this.loading = true;
      try {
        await useGlobalLoading().withLoading(async () => {
          if (!firebase.enabled || !firebase.db || !auth.profile) {
            this.orders = [];
            this.initialized = true;
            return;
          }
          const base = collection(firebase.db, "orders");
          const ordersQuery = auth.isAdmin
            ? query(base, orderBy("createdAt", "desc"))
            : query(
                base,
                where("userId", "==", auth.profile.uid),
                orderBy("createdAt", "desc"),
              );
          const snap = await getDocs(ordersQuery);
          this.orders = snap.docs.map((item) =>
            normalizeOrder(item.id, item.data() as Partial<Order>),
          );
          this.initialized = true;
        }, "주문 정보를 불러오는 중");
      } finally {
        this.loading = false;
      }
    },
    hydrate() {
      return this.fetchOrders();
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
        this.updateOrder(order);
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
      this.updateOrder(result.order);
      return result.order;
    },
    updateOrder(order: Order) {
      const normalized = normalizeOrder(order.id, order);
      const index = this.orders.findIndex((item) => item.id === normalized.id);
      if (index >= 0) this.orders[index] = normalized;
      else this.orders.unshift(normalized);
    },
    async patchOrder(orderId: string, updates: Partial<Order>) {
      const order = this.orders.find((item) => item.id === orderId);
      if (order) Object.assign(order, updates, { updatedAt: new Date().toISOString() });
      const firebase = useNuxtApp().$firebase;
      if (!firebase.enabled || !firebase.db) return;
      await useGlobalLoading().withLoading(async () => {
        await updateDoc(doc(firebase.db!, "orders", orderId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }, "주문 정보를 저장하는 중");
    },
    setOrderStatus(orderId: string, status: Order["orderStatus"]) {
      return this.patchOrder(orderId, {
        orderStatus: status,
        completedAt: status === "completed" ? new Date().toISOString() : null,
      });
    },
    setDeliveryStatus(orderId: string, status: Order["deliveryStatus"]) {
      return this.patchOrder(orderId, { deliveryStatus: status });
    },
    saveTrackingInfo(
      orderId: string,
      payload: Pick<Order, "deliveryCompany" | "trackingNumber">,
    ) {
      const order = this.orders.find((item) => item.id === orderId);
      const trackingNumber = payload.trackingNumber?.trim() || "";
      const deliveryCompany = payload.deliveryCompany?.trim() || "";
      const shippedAt = trackingNumber
        ? order?.shippedAt || new Date().toISOString()
        : null;
      return this.patchOrder(orderId, {
        deliveryCompany,
        trackingNumber,
        shippedAt,
      });
    },
  },
});
