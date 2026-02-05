/**
 * Shared type definitions for Majikari
 * 
 * Import from '@/types' throughout the app.
 */

// ── Products (from Good Smile catalog) ─────────────────────────

export interface Product {
  id: string
  source_id: number
  name: string
  name_jp?: string
  name_jp_reading?: string
  series?: string
  series_jp?: string
  category?: string
  manufacturer?: string
  price?: number
  release_date?: string
  images?: string[]
  listing_count?: number
}

// ── Listings (from Mercari/marketplace) ────────────────────────

export interface Listing {
  listing_id: string
  name: string
  price: number
  condition: string | null
  image: string | null
  url: string
  score: number
  match_reason: string
  risk: 'low' | 'medium' | 'high'
  risk_flags: string[]
  source_name: string
}

// ── Proxy Cost Calculation ─────────────────────────────────────

export interface ProxyCost {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  total_jpy: number
  total_usd: number
}

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

// ── Trust Signals ──────────────────────────────────────────────

export interface TrustInfo {
  score: number
  risk: 'low' | 'medium' | 'high'
  flags: string[]
}

// ── Full Item (for web display) ────────────────────────────────

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

// ── API Response Types ─────────────────────────────────────────

export interface SearchResponse {
  query: string
  count: number
  totalMatching: number
  totalWithListings: number
  expandedTo?: string[]
  products: Product[]
}

export interface LookupResult {
  id: string
  name: string
  price: number
  price_usd: number
  image_url: string | null
  url: string
  category: string | null
  franchise: string | null
  condition: string | null
  trust_risk: string
  cheapest_proxy: string
  cheapest_total_usd: number
  most_expensive_proxy: string
  most_expensive_total_usd: number
  savings_jpy: number
  savings_usd: number
  proxies: CostBreakdown[]
}
