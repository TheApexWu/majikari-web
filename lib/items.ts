/**
 * Item Types & Data Loading
 * 
 * CONCEPT: TypeScript Interfaces
 * ─────────────────────────────
 * An interface defines the "shape" of data. It's like a contract:
 * "Any object claiming to be an Item MUST have these fields."
 * 
 * Benefits:
 * 1. Autocomplete in your editor
 * 2. Errors if you misspell a field
 * 3. Documentation for other developers
 */

// This matches the structure from our scraper
export interface Item {
  id: string
  url: string
  name: string
  description: string | null
  price: number  // In Japanese Yen
  
  // Condition
  condition: string | null
  condition_id: number | null
  
  // Images
  image_url: string | null
  image_urls: string[]
  
  // Categorization
  category_source: string  // "figures", "cards", etc.
  keyword: string
  mercari_category: string | null
  
  // Seller trust
  seller_id: number | null
  seller_name: string | null
  seller_rating_good: number | null
  seller_rating_bad: number | null
  seller_total_sales: number | null
  
  // Shipping
  shipping_payer: string | null  // "seller" or "buyer"
  shipping_from: string | null
  shipping_days_min: number | null
  shipping_days_max: number | null
  
  // Engagement
  num_likes: number
  
  // Metadata
  scraped_at: string
  sort_method: string | null
  price_tier: string | null
}

/**
 * CONCEPT: Server-side Data Loading
 * ─────────────────────────────────
 * This function runs ONLY on the server (in a Server Component).
 * It reads from the filesystem, which browsers can't do.
 * 
 * In production, this could be a database query instead.
 */
export async function loadItems(): Promise<Item[]> {
  // In development/production, fetch from the public folder
  // This works both server-side and client-side
  const response = await fetch(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/data/items.json'
      : '/data/items.json',
    { cache: 'force-cache' }  // Cache the result
  )
  
  if (!response.ok) {
    throw new Error('Failed to load items')
  }
  
  return response.json()
}

/**
 * CONCEPT: Static Import Alternative
 * ───────────────────────────────────
 * For Server Components, we can also import JSON directly.
 * This is simpler but bundles ALL items into the server code.
 * 
 * We're using fetch instead because:
 * 1. More flexible (can switch to API later)
 * 2. Doesn't bloat the server bundle
 */

// Helper to get unique categories from items
export function getCategories(items: Item[]): string[] {
  const categories = new Set(items.map(item => item.category_source))
  return Array.from(categories).sort()
}

// Helper to get price range from items
export function getPriceRange(items: Item[]): { min: number; max: number } {
  const prices = items.map(item => item.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

/**
 * CONCEPT: Filtering
 * ──────────────────
 * Pure function that filters items based on criteria.
 * "Pure" means: same input always gives same output, no side effects.
 */
export function filterItems(
  items: Item[],
  filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    condition?: number  // 1-5 scale
    search?: string
  }
): Item[] {
  return items.filter(item => {
    // Category filter
    if (filters.category && item.category_source !== filters.category) {
      return false
    }
    
    // Price filters
    if (filters.minPrice !== undefined && item.price < filters.minPrice) {
      return false
    }
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice) {
      return false
    }
    
    // Condition filter
    if (filters.condition !== undefined && item.condition_id !== filters.condition) {
      return false
    }
    
    // Search filter (simple substring match)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(searchLower)
      const descMatch = item.description?.toLowerCase().includes(searchLower) ?? false
      if (!nameMatch && !descMatch) {
        return false
      }
    }
    
    return true
  })
}

/**
 * CONCEPT: Sorting
 * ────────────────
 * Another pure function for sorting items.
 */
export type SortOption = 'price-asc' | 'price-desc' | 'likes' | 'newest'

export function sortItems(items: Item[], sort: SortOption): Item[] {
  // Create a copy so we don't mutate the original
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
    default:
      return sorted
  }
}

/**
 * CONCEPT: Price Formatting
 * ─────────────────────────
 * Display prices in a user-friendly format.
 */
export function formatPrice(priceYen: number): string {
  return `¥${priceYen.toLocaleString()}`
}

export function formatPriceUSD(priceYen: number, rate: number = 150): string {
  const usd = priceYen / rate
  return `$${usd.toFixed(2)}`
}
