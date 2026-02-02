/**
 * Item Types & Data Loading
 */

export interface CostBreakdown {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  duty_jpy: number
  total_jpy: number
  total_usd: number
}

export interface CostEstimates {
  cheapest_proxy: string
  cheapest_total_jpy: number
  cheapest_total_usd: number
  most_expensive_proxy: string
  most_expensive_total_jpy: number
  savings_jpy: number
  savings_usd: number
  breakdown: Record<string, CostBreakdown>
}

export interface TrustInfo {
  score: number
  risk: 'low' | 'medium' | 'high'
  flags: string[]
}

export interface Item {
  id: string
  url: string
  name: string
  description: string | null
  price: number
  price_usd: number

  condition: string | null
  condition_id: number | null

  image_url: string | null
  image_urls: string[]

  category_source: string | null
  keyword: string | null
  franchise: string | null
  franchise_jp: string | null
  mercari_category: string | null

  seller_id: string | null
  seller_name: string | null
  seller_rating_good: number | null
  seller_rating_bad: number | null
  seller_total_sales: number | null

  shipping_payer: string | null
  shipping_from: string | null
  shipping_days_min: number | null
  shipping_days_max: number | null

  num_likes: number

  cost_estimates: CostEstimates
  trust: TrustInfo

  scraped_at: string
  source: string
  sort_method: string | null
  price_tier: string | null
}

export async function loadItems(): Promise<Item[]> {
  const response = await fetch(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/data/items.json'
      : '/data/items.json',
    { cache: 'force-cache' }
  )

  if (!response.ok) {
    throw new Error('Failed to load items')
  }

  return response.json()
}

export function getCategories(items: Item[]): string[] {
  const categories = new Set(items.map(item => item.category_source).filter((c): c is string => c != null && c !== ''))
  return Array.from(categories).sort()
}

export function getFranchises(items: Item[]): string[] {
  const franchises = new Set(items.map(item => item.franchise).filter((f): f is string => f != null && f !== ''))
  return Array.from(franchises).sort()
}

export function getPriceRange(items: Item[]): { min: number; max: number } {
  const prices = items.map(item => item.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

export function filterItems(
  items: Item[],
  filters: {
    category?: string
    franchise?: string
    minPrice?: number
    maxPrice?: number
    condition?: number
    search?: string
    priceTier?: string
  }
): Item[] {
  return items.filter(item => {
    if (filters.category && (item.category_source || '') !== filters.category) return false
    if (filters.franchise && (item.franchise || '') !== filters.franchise) return false
    if (filters.minPrice !== undefined && item.price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false
    if (filters.condition !== undefined && item.condition_id !== filters.condition) return false
    if (filters.priceTier && item.price_tier !== filters.priceTier) return false

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(q)
      const descMatch = item.description?.toLowerCase().includes(q) ?? false
      const franchiseMatch = item.franchise?.toLowerCase().includes(q) ?? false
      const franchiseJpMatch = item.franchise_jp?.toLowerCase().includes(q) ?? false
      if (!nameMatch && !descMatch && !franchiseMatch && !franchiseJpMatch) return false
    }

    return true
  })
}

export type SortOption = 'price-asc' | 'price-desc' | 'likes' | 'newest' | 'savings'

export function sortItems(items: Item[], sort: SortOption): Item[] {
  const sorted = [...items]

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'likes':
      return sorted.sort((a, b) => b.num_likes - a.num_likes)
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
      )
    case 'savings':
      return sorted.sort((a, b) =>
        (b.cost_estimates?.savings_jpy ?? 0) - (a.cost_estimates?.savings_jpy ?? 0)
      )
    default:
      return sorted
  }
}

export function formatPrice(priceYen: number): string {
  return `¥${priceYen.toLocaleString()}`
}

export function formatPriceUSD(priceYen: number, rate: number = 155): string {
  const usd = priceYen / rate
  return `$${usd.toFixed(2)}`
}
