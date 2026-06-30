import { mockOrders } from '~/data/mock'
import type { Order } from '~/types/domain'

declare global {
  var __blendOnOrders: Order[] | undefined
}

export const getServerOrders = () => {
  globalThis.__blendOnOrders ||= [...mockOrders]
  return globalThis.__blendOnOrders
}

export const saveServerOrder = (order: Order) => {
  const orders = getServerOrders()
  const index = orders.findIndex((item) => item.id === order.id)
  if (index >= 0) orders[index] = order
  else orders.unshift(order)
  return order
}

export const findServerOrder = (orderId: string) => getServerOrders().find((order) => order.id === orderId)
