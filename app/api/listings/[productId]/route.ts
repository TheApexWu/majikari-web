/**
 * Get marketplace listings for a canonical product
 * Uses live search through listings for better matches
 */

import { NextRequest, NextResponse } from 'next/server'
import products from '@/data/goodsmile-products.json'

// Load listings data
import listingsData from '@/data/mercari-listings.json'

interface Product {
  id: string
  name: string
  name_jp?: string
  series?: string
  category?: string
}

interface Listing {
  id: string
  name: string
  price: number
  condition?: string
  thumbnails?: string[]
}

const productList = products as Product[]
const listings = (listingsData as any).items as Listing[]

function normalize(text: string): string {
  return text?.toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || ''
}

function searchListings(product: Product): Array<{
  listing_id: string
  name: string
  price: number
  condition: string | null
  image: string | null
  url: string
  score: number
}> {
  // Build search terms from product
  const searchTerms: string[] = []
  
  // Add JP name if exists (most important for JP listings)
  if (product.name_jp) {
    // Extract key parts - remove parenthetical readings
    const jpName = product.name_jp.replace(/\s*[\(（][^\)）]+[\)）]\s*/g, '').trim()
    searchTerms.push(jpName)
  }
  
  // Add EN name parts
  if (product.name) {
    // Extract character/product name without generic prefixes
    const nameParts = product.name
      .replace(/^(Nendoroid|figma|POP UP PARADE|PLAMAX)\s+/i, '')
      .replace(/:\s+.+$/, '') // Remove subtitle after colon
      .trim()
    if (nameParts.length > 2) {
      searchTerms.push(nameParts.toLowerCase())
    }
  }
  
  // Add category for matching (nendoroid, figma, etc)
  const category = product.category?.toLowerCase() || ''
  const categoryJp = category === 'nendoroid' ? 'ねんどろいど' : 
                     category === 'figma' ? 'figma' : ''
  
  if (!searchTerms.length) return []
  
  // Search listings
  const results: Array<{
    listing_id: string
    name: string
    price: number
    condition: string | null
    image: string | null
    url: string
    score: number
  }> = []
  
  for (const listing of listings) {
    const listingName = normalize(listing.name)
    let score = 0
    
    // Check each search term
    for (const term of searchTerms) {
      const normTerm = normalize(term)
      if (normTerm.length < 2) continue
      
      if (listingName.includes(normTerm)) {
        score += 0.5
      } else {
        // Check for partial matches (split into words)
        const termWords = normTerm.split(' ').filter(w => w.length > 1)
        const matchedWords = termWords.filter(w => listingName.includes(w))
        if (matchedWords.length > 0) {
          score += 0.2 * (matchedWords.length / termWords.length)
        }
      }
    }
    
    // Boost if category matches
    if (categoryJp && listingName.includes(categoryJp)) {
      score += 0.3
    }
    
    if (score >= 0.3) {
      results.push({
        listing_id: listing.id,
        name: listing.name,
        price: listing.price,
        condition: listing.condition || null,
        image: listing.thumbnails?.[0] || null,
        url: `https://jp.mercari.com/item/${listing.id}`,
        score: Math.round(score * 100) / 100
      })
    }
  }
  
  // Sort by score then price
  results.sort((a, b) => b.score - a.score || (a.price || 0) - (b.price || 0))
  
  return results.slice(0, 10)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const productId = params.productId
  
  // Find the product
  const product = productList.find(p => p.id === productId)
  
  if (!product) {
    return NextResponse.json({
      productId,
      count: 0,
      listings: [],
      error: 'Product not found'
    })
  }
  
  // Search for matching listings
  const matchedListings = searchListings(product)
  
  return NextResponse.json({
    productId,
    productName: product.name,
    productNameJp: product.name_jp,
    count: matchedListings.length,
    listings: matchedListings.map(l => ({
      ...l,
      source: 'mercari',
      source_name: 'Mercari JP'
    }))
  })
}
