import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { categorySeed, gradeBenefitSeed } from '~/config/catalog'
import { mockProducts } from '~/data/mock'
import { canViewProduct } from '~/utils/access'
import type { Category, GradeBenefit, Product } from '~/types/domain'

const timestampToIso = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  return typeof value === 'string' ? value : new Date().toISOString()
}

const normalizeProduct = (id: string, data: Partial<Product>): Product => ({
  id,
  name: data.name || '',
  slug: data.slug || id,
  shortDescription: data.shortDescription || '',
  description: data.description || '',
  categoryIds: data.categoryIds || [],
  brandName: data.brandName || '',
  thumbnailUrl: data.thumbnailUrl || '',
  imageUrls: data.imageUrls || [],
  basePrice: Number(data.basePrice || 0),
  memberPrice: Number(data.memberPrice || data.basePrice || 0),
  compareAtPrice: data.compareAtPrice ?? null,
  gradePrices: data.gradePrices || {},
  stock: Number(data.stock || 0),
  options: data.options || [],
  badges: data.badges || [],
  tags: data.tags || [],
  flavorProfile: data.flavorProfile || { sweetness: 0, coolness: 0, body: 0, mood: [], notes: [] },
  deviceType: data.deviceType || 'none',
  nicotineType: data.nicotineType || 'not-applicable',
  isNicotineFree: Boolean(data.isNicotineFree),
  isAlternativeNicotine: Boolean(data.isAlternativeNicotine),
  isAdultOnly: Boolean(data.isAdultOnly),
  isVisible: data.isVisible ?? true,
  minUserGradeToView: data.minUserGradeToView || 'BASIC',
  minUserGradeToBuy: data.minUserGradeToBuy || 'BASIC',
  isPriceHiddenBeforeLogin: data.isPriceHiddenBeforeLogin ?? true,
  isPriceHiddenBeforeAdultVerification: data.isPriceHiddenBeforeAdultVerification ?? Boolean(data.isAdultOnly),
  status: data.status || 'draft',
  detailImageUrls: data.detailImageUrls || [],
  viewRoles: data.viewRoles || [],
  buyRoles: data.buyRoles || [],
  seoTitle: data.seoTitle || '',
  seoDescription: data.seoDescription || '',
  adminMemo: data.adminMemo || '',
  createdAt: timestampToIso(data.createdAt),
  updatedAt: timestampToIso(data.updatedAt)
})

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[],
    categories: [...categorySeed] as Category[],
    gradeBenefits: [...gradeBenefitSeed] as GradeBenefit[],
    query: '',
    selectedCategoryId: '',
    initialized: false,
    loading: false
  }),
  getters: {
    visibleProducts: (state) => {
      const user = useAuthStore().profile
      return state.products.filter((product) => canViewProduct(product, user))
    },
    filteredProducts(): Product[] {
      const q = this.query.trim().toLowerCase()
      return this.visibleProducts.filter((product) => {
        const matchesCategory = !this.selectedCategoryId || product.categoryIds.includes(this.selectedCategoryId)
        const matchesQuery =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.shortDescription.toLowerCase().includes(q) ||
          product.tags.some((tag) => tag.toLowerCase().includes(q))
        return matchesCategory && matchesQuery
      })
    },
    rootCategories: (state) => state.categories.filter((category) => !category.parentId && category.isVisible).sort((a, b) => a.order - b.order),
    lowStockProducts: (state) => state.products.filter((product) => product.stock > 0 && product.stock <= 10)
  },
  actions: {
    async fetchCatalog(force = false) {
      if (this.initialized && !force) return
      const runtime = useRuntimeConfig()
      const firebase = useNuxtApp().$firebase
      const loading = useGlobalLoading()
      this.loading = true
      try {
        await loading.withLoading(async () => {
          if (firebase.enabled && firebase.db) {
            const [productSnap, categorySnap, gradeSnap] = await Promise.all([
              getDocs(query(collection(firebase.db, 'products'), orderBy('updatedAt', 'desc'))),
              getDocs(query(collection(firebase.db, 'categories'), orderBy('order', 'asc'))),
              getDocs(query(collection(firebase.db, 'gradeBenefits'), orderBy('order', 'asc')))
            ])
            this.products = productSnap.docs.map((item) => normalizeProduct(item.id, item.data() as Partial<Product>))
            this.categories = categorySnap.empty ? [...categorySeed] : categorySnap.docs.map((item) => ({ id: item.id, ...item.data() }) as Category)
            this.gradeBenefits = gradeSnap.empty ? [...gradeBenefitSeed] : gradeSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as GradeBenefit)
          } else {
            this.products = runtime.public.enableMockAuth ? [...mockProducts] : []
            this.categories = [...categorySeed]
            this.gradeBenefits = [...gradeBenefitSeed]
          }
          this.initialized = true
        }, '카탈로그를 불러오는 중')
      } finally {
        this.loading = false
      }
    },
    findBySlug(slug: string) {
      return this.products.find((product) => product.slug === slug)
    },
    findById(id: string) {
      return this.products.find((product) => product.id === id)
    },
    setQuery(query: string) {
      this.query = query
    },
    setCategory(categoryId: string) {
      this.selectedCategoryId = categoryId
    },
    async upsertProduct(product: Product) {
      const now = new Date().toISOString()
      const payload = { ...product, updatedAt: now }
      const index = this.products.findIndex((item) => item.id === product.id)
      if (index >= 0) this.products[index] = payload
      else this.products.unshift(payload)
      const firebase = useNuxtApp().$firebase
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(doc(firebase.db!, 'products', payload.id), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
        }, '상품을 저장하는 중')
      }
    },
    async softDeleteProduct(id: string) {
      const product = this.findById(id)
      if (!product) return
      await this.upsertProduct({ ...product, status: 'deleted', isVisible: false })
    },
    async toggleVisibility(id: string) {
      const product = this.findById(id)
      if (!product) return
      await this.upsertProduct({ ...product, isVisible: !product.isVisible })
    },
    async upsertCategory(category: Category) {
      const index = this.categories.findIndex((item) => item.id === category.id)
      if (index >= 0) this.categories[index] = category
      else this.categories.push(category)
      const firebase = useNuxtApp().$firebase
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(doc(firebase.db!, 'categories', category.id), category, { merge: true })
        }, '카테고리를 저장하는 중')
      }
    },
    async removeCategory(id: string) {
      this.categories = this.categories.filter((category) => category.id !== id)
      const firebase = useNuxtApp().$firebase
      if (firebase.enabled && firebase.db) await deleteDoc(doc(firebase.db, 'categories', id))
    },
    async upsertGradeBenefit(benefit: GradeBenefit) {
      const now = new Date().toISOString()
      const payload = { ...benefit, updatedAt: now }
      const index = this.gradeBenefits.findIndex((item) => item.gradeCode === benefit.gradeCode)
      if (index >= 0) this.gradeBenefits[index] = payload
      else this.gradeBenefits.push(payload)
      const firebase = useNuxtApp().$firebase
      if (firebase.enabled && firebase.db) {
        await useGlobalLoading().withLoading(async () => {
          await setDoc(doc(firebase.db!, 'gradeBenefits', payload.gradeCode), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
        }, '회원 등급을 저장하는 중')
      }
    },
    async patchProduct(id: string, updates: Partial<Product>) {
      const product = this.findById(id)
      if (!product) return
      Object.assign(product, updates, { updatedAt: new Date().toISOString() })
      const firebase = useNuxtApp().$firebase
      if (firebase.enabled && firebase.db) await updateDoc(doc(firebase.db, 'products', id), { ...updates, updatedAt: serverTimestamp() })
    }
  }
})
