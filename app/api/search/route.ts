/**
 * Product Search API
 * 
 * Searches the Good Smile canonical database by EN or JP name.
 * This is the core technical moat - bilingual product matching.
 */

import { NextRequest, NextResponse } from 'next/server'
import products from '@/data/goodsmile-products.json'

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
  specifications?: string
  sculptor?: string
}

// Type assertion for imported JSON
const productList = products as Product[]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  
  if (!query && !category) {
    // Return featured products (Miku, popular series)
    const featured = productList
      .filter(p => 
        p.series?.toLowerCase().includes('miku') ||
        p.series?.toLowerCase().includes('kancolle') ||
        p.series?.toLowerCase().includes('fate')
      )
      .slice(0, limit)
    
    return NextResponse.json({
      query: '',
      count: featured.length,
      products: featured,
    })
  }
  
  // Search by EN name, JP name, JP reading, series
  let results = productList.filter(p => {
    // Text search
    if (query) {
      const nameMatch = p.name?.toLowerCase().includes(query)
      const jpMatch = p.name_jp?.toLowerCase().includes(query)
      const readingMatch = p.name_jp_reading?.toLowerCase().includes(query)
      const seriesMatch = p.series?.toLowerCase().includes(query)
      const seriesJpMatch = p.series_jp?.toLowerCase().includes(query)
      
      if (!nameMatch && !jpMatch && !readingMatch && !seriesMatch && !seriesJpMatch) {
        return false
      }
    }
    
    // Category filter
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) {
      return false
    }
    
    return true
  })
  
  // Sort by relevance (exact name match first, then partial)
  results.sort((a, b) => {
    const aExact = a.name?.toLowerCase() === query || a.name_jp?.toLowerCase() === query
    const bExact = b.name?.toLowerCase() === query || b.name_jp?.toLowerCase() === query
    if (aExact && !bExact) return -1
    if (!aExact && bExact) return 1
    return 0
  })
  
  return NextResponse.json({
    query,
    count: results.length,
    products: results.slice(0, limit),
  })
}
