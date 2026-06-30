const pendingCount = ref(0)
const loadingLabel = ref('처리 중')

export const useGlobalLoading = () => {
  const isLoading = computed(() => pendingCount.value > 0)

  const start = (label = '처리 중') => {
    loadingLabel.value = label
    pendingCount.value += 1
  }

  const stop = () => {
    pendingCount.value = Math.max(0, pendingCount.value - 1)
    if (pendingCount.value === 0) loadingLabel.value = '처리 중'
  }

  const withLoading = async <T>(task: () => Promise<T>, label = '처리 중') => {
    start(label)
    try {
      return await task()
    } finally {
      stop()
    }
  }

  return { isLoading, label: loadingLabel, start, stop, withLoading }
}
