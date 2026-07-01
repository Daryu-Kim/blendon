import { defineStore } from "pinia";

export const useAdminStore = defineStore("admin", {
  getters: {
    dashboard() {
      const orders = useOrderStore();
      const products = useProductStore();
      const users = useUserStore();
      return {
        todayOrderCount: orders.todayOrderCount,
        todayRevenue: orders.todayRevenue,
        pendingPaymentCount: orders.pendingPaymentCount,
        preparingDeliveryCount: orders.preparingDeliveryCount,
        lowStockProducts: products.lowStockProducts,
        newUserCount: users.newUserCount,
        adultVerifiedCount: users.adultVerifiedCount,
        recentOrders: orders.recentOrders,
      };
    },
  },
});
