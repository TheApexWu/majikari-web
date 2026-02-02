/**
 * Product Search API
 * 
 * Searches the Good Smile canonical database by EN or JP name.
 * Uses pre-computed availability.json to tag products with listing counts.
 * Default: only returns products that have verified listings.
 * Pass ?available=false to show the full catalog.
 */

import { NextRequest, NextResponse } from 'next/server'
import products from '@/data/goodsmile-products.json'
import availabilityData from '@/data/availability.json'

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
const totalAvailable = Object.keys(availability).length

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
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

  // Search
  let results = productList.filter(p => {
    if (query) {
      const nameMatch = p.name?.toLowerCase().includes(query)
      const jpMatch = p.name_jp?.toLowerCase().includes(query)
      const readingMatch = p.name_jp_reading?.toLowerCase().includes(query)
      const seriesMatch = p.series?.toLowerCase().includes(query)
      const seriesJpMatch = p.series_jp?.toLowerCase().includes(query)
      if (!nameMatch && !jpMatch && !readingMatch && !seriesMatch && !seriesJpMatch) return false
    }
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false
    return true
  })

  const tagged = results.map(p => ({
    ...p,
    listing_count: availability[p.id] || 0,
  }))

  const totalMatching = tagged.length
  const totalWithListings = tagged.filter(p => p.listing_count > 0).length
  const filtered = availableOnly ? tagged.filter(p => p.listing_count > 0) : tagged

  // Sort: exact match first, then by listing count
  filtered.sort((a, b) => {
    const aExact = a.name?.toLowerCase() === query || a.name_jp?.toLowerCase() === query
    const bExact = b.name?.toLowerCase() === query || b.name_jp?.toLowerCase() === query
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    return b.listing_count - a.listing_count
  })

  return NextResponse.json({
    query,
    count: filtered.length,
    totalMatching,
    totalWithListings,
    products: filtered.slice(0, limit),
  })
}
