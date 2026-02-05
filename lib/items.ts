/**
 * Item Utilities
 * 
 * Filtering, sorting, and categorization helpers for item lists.
 * Types imported from @/types.
 */

import type { Item } from '@/types'
import { JPY_USD_RATE } from './constants'

// ── Data Loading ───────────────────────────────────────────────

export async function loadItems(): Promise<Item[]> {
  const response = await fetch('/data/items.json', { cache: 'force-cache' })
  if (!response.ok) throw new Error('Failed to load items')
  return response.json()
}

// ── Aggregations ───────────────────────────────────────────────

export function getCategories(items: Item[]): string[] {
  const categories = new Set(
    items
      .map(item => item.category_source)
      .filter((c): c is string => c != null && c !== '')
  )
  return Array.from(categories).sort()
}

export function getFranchises(items: Item[]): string[] {
  const franchises = new Set(
    items
      .map(item => item.franchise)
      .filter((f): f is string => f != null && f !== '')
  )
  return Array.from(franchises).sort()
}

export function getPriceRange(items: Item[]): { min: number; max: number } {
  const prices = items.map(item => item.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

// ── Filtering ──────────────────────────────────────────────────

interface ItemFilters {
  category?: string
  franchise?: string
  minPrice?: number
  maxPrice?: number
  condition?: number
  search?: string
  priceTier?: string
}

export function filterItems(items: Item[], filters: ItemFilters): Item[] {
  return items.filter(item => {
    if (filters.category && (item.category_source || '') !== filters.category) return false
    if (filters.franchise && (item.franchise || '') !== filters.franchise) return false
    if (filters.minPrice !== undefined && item.price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false
    if (filters.condition !== undefined && item.condition_id !== filters.condition) return false
    if (filters.priceTier && item.price_tier !== filters.priceTier) return false

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const searchable = [
        item.name,
        item.description,
        item.franchise,
        item.franchise_jp,
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchable.includes(q)) return false
    }

    return true
  })
}

// ── Sorting ────────────────────────────────────────────────────

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

// ── Formatting ─────────────────────────────────────────────────
// Note: Also available in lib/proxy-costs.ts as formatJpy/formatUsd

export function formatPrice(priceYen: number): string {
  return `¥${priceYen.toLocaleString()}`
}

export function formatPriceUSD(priceYen: number): string {
  return `$${(priceYen / JPY_USD_RATE).toFixed(2)}`
}
