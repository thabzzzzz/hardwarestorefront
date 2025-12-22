export interface ProductImage {
  url: string
  alt?: string
}

export interface InventoryInfo {
  stock: number
  reserved?: number
  status?: 'in_stock' | 'out_of_stock' | 'limited' | 'preorder'
}

export interface Dimensions {
  w: number
  h: number
  d: number
}

export interface Product {
  id: string
  sku: string
  title: string
  slug?: string
  description?: string
  brand?: string
  categories?: string[]
  price_cents: number
  list_price_cents?: number
  currency: string
  inventory: InventoryInfo
  images?: ProductImage[]
  weight_grams?: number
  dimensions_mm?: Dimensions
  attributes?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

export type Products = Product[]
