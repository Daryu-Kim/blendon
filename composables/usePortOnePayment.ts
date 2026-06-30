import type { Order } from '~/types/domain'

interface PortOnePaymentResult {
  paymentId?: string
  code?: string
  message?: string
}

export const usePortOnePayment = () => {
  const runtime = useRuntimeConfig()
  const loading = ref(false)
  const error = ref('')

  const requestPayment = async (order: Order) => {
    loading.value = true
    error.value = ''
    try {
      const paymentId = order.portonePaymentId || order.paymentId || `payment-${order.orderNo}`

      const storeId = String(runtime.public.portoneStoreId || '')
      const channelKey = String(runtime.public.portoneChannelKey || '')
      if (runtime.public.enableMockPayments) {
        return {
          paymentId,
          code: undefined,
          message: 'mock payment completed'
        } satisfies PortOnePaymentResult
      }
      if (!storeId || !channelKey) throw new Error('PortOne 공개 설정이 필요합니다.')

      const PortOne = await import('@portone/browser-sdk/v2')
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: `${order.items[0]?.productName || '주문'}${order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}`,
        totalAmount: order.totalAmount,
        currency: 'KRW',
        payMethod: ({
          card: 'CARD',
          transfer: 'TRANSFER',
          'virtual-account': 'VIRTUAL_ACCOUNT',
          mobile: 'MOBILE',
          kakaopay: 'EASY_PAY',
          naverpay: 'EASY_PAY'
        }[order.paymentMethod] || 'CARD') as Parameters<typeof PortOne.requestPayment>[0]['payMethod'],
        customer: {
          fullName: order.recipientName,
          phoneNumber: order.recipientPhone
        }
      })
      return response as PortOnePaymentResult
    } catch (e) {
      error.value = e instanceof Error ? e.message : '결제창 호출에 실패했어요.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, requestPayment }
}
