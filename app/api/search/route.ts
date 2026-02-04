/**
 * Product Search API
 * 
 * Searches the Good Smile canonical database by EN or JP name.
 * Uses pre-computed availability.json to tag products with listing counts.
 * Default: only returns products that have verified listings.
 * Pass ?available=false to show the full catalog.
 * 
 * Search features:
 * - Franchise alias expansion ("one piece" → also searches "ワンピース")
 * - Fuzzy matching via Fuse.js ("chainsawman" → "Chainsaw Man")
 * - Combined scoring: exact > substring > fuzzy, weighted by listing count
 */

import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import products from '@/data/goodsmile-products.json'
import availabilityData from '@/data/availability.json'
import { expandQuery, normalizeQuery, matchesAny } from '@/lib/search'

interface Product {
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
}

const productList = products as unknown as Product[]
const availability = availabilityData as Record<string, number>

// Pre-build Fuse index (runs once at module load)
const fuseIndex = new Fuse(productList, {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'name_jp', weight: 2 },
    { name: 'name_jp_reading', weight: 1.5 },
    { name: 'series', weight: 1.5 },
    { name: 'series_jp', weight: 1.5 },
  ],
  threshold: 0.35,
  distance: 300,
  includeScore: true,
  ignoreLocation: true,
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawQuery = searchParams.get('q')?.trim() || ''
  const query = normalizeQuery(rawQuery)
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const availableOnly = searchParams.get('available') !== 'false'

  if (!query && !category) {
    const featured = productList
      .filter(p => availability[p.id])
      .slice(0, limit)

    return NextResponse.json({
      query: '',
      count: featured.length,
      totalMatching: featured.length,
      totalWithListings: featured.length,
      products: featured.map(p => ({
        ...p,
        listing_count: availability[p.id] || 0,
      })),
    })
  }

  // Expand query with franchise aliases
  const expandedQueries = expandQuery(query)

  // Phase 1: Substring match against all expanded queries (high precision)
  const substringMatches = new Map<string, { product: Product; score: number }>()

  for (const p of productList) {
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) continue

    const fields = [
      p.name, p.name_jp, p.name_jp_reading, p.series, p.series_jp,
    ].filter(Boolean) as string[]

    let bestScore = 0
    for (const field of fields) {
      const lower = field.toLowerCase()
      for (const eq of expandedQueries) {
        const eql = eq.toLowerCase()
        if (lower === eql) bestScore = Math.max(bestScore, 100)
        else if (lower.includes(eql)) bestScore = Math.max(bestScore, 50)
      }
    }

    if (bestScore > 0) {
      substringMatches.set(p.id, { product: p, score: bestScore })
    }
  }

  // Phase 2: Fuzzy search via Fuse.js (catches typos, compound words)
  // Search with each expanded query and merge results
  const fuseResults = new Map<string, { product: Product; score: number }>()

  for (const eq of expandedQueries) {
    const results = fuseIndex.search(eq, { limit: 100 })
    for (const r of results) {
      if (category && r.item.category?.toLowerCase() !== category.toLowerCase()) continue
      // Fuse score is 0 (perfect) to 1 (worst). Invert and scale.
      const fuseScore = Math.max(0, (1 - (r.score || 1)) * 40)
      const existing = fuseResults.get(r.item.id)
      if (!existing || fuseScore > existing.score) {
        fuseResults.set(r.item.id, { product: r.item, score: fuseScore })
      }
    }
  }

  // Merge: substring matches take priority, fuzzy fills gaps
  const merged = new Map<string, { product: Product; score: number }>()

  substringMatches.forEach((entry, id) => {
    merged.set(id, entry)
  })
  fuseResults.forEach((entry, id) => {
    if (!merged.has(id)) {
      merged.set(id, entry)
    }
  })

  // Tag with availability and filter
  const tagged = Array.from(merged.values()).map(({ product: p, score }) => ({
    ...p,
    listing_count: availability[p.id] || 0,
    _searchScore: score,
  }))

  const totalMatching = tagged.length
  const totalWithListings = tagged.filter(p => p.listing_count > 0).length
  const filtered = availableOnly ? tagged.filter(p => p.listing_count > 0) : tagged

  // Sort: search score * listing count gives best results
  filtered.sort((a, b) => {
    // Exact match always first
    if (a._searchScore >= 100 && b._searchScore < 100) return -1
    if (b._searchScore >= 100 && a._searchScore < 100) return 1
    // Then by combined score: relevance weighted heavily, listing count as tiebreaker
    const aCombo = a._searchScore * 10 + Math.min(a.listing_count, 50)
    const bCombo = b._searchScore * 10 + Math.min(b.listing_count, 50)
    return bCombo - aCombo
  })

  // Strip internal score before returning
  const results = filtered.slice(0, limit).map(({ _searchScore, ...rest }) => rest)

  return NextResponse.json({
    query: rawQuery,
    count: results.length,
    totalMatching,
    totalWithListings,
    expandedTo: expandedQueries.length > 1 ? expandedQueries : undefined,
    products: results,
  })
}
