'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  source_id: number
  name: string
  name_jp?: string
  series?: string
  category?: string
  price?: number
  release_date?: string
  images?: string[]
}

interface SearchResult {
  query: string
  count: number
  products: Product[]
}

export default function ProductSearch() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  // Sync query with URL params
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    setDebouncedQuery(q)
  }, [searchParams])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      // Update URL without navigation
      if (query !== searchParams.get('q')) {
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
          params.set('q', query)
        } else {
          params.delete('q')
        }
        router.replace(`/products?${params.toString()}`, { scroll: false })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, router, searchParams])

  // Fetch results when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=50`)
        const data = await res.json()
        setResults(data)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  const formatPrice = (price?: number) => {
    if (!price) return null
    return `¥${price.toLocaleString()}`
  }

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name... 名前で検索 (e.g., Miku, ねんどろいど)"
          className="w-full px-6 py-4 text-lg bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors placeholder-gray-500"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results count */}
      {results && (
        <div className="mb-4 text-gray-400">
          {results.count > 0 ? (
            <span>
              Found <span className="text-cyan-400 font-semibold">{results.count}</span> products
              {results.query && <> matching "<span className="text-white">{results.query}</span>"</>}
            </span>
          ) : (
            <span>No products found. Try searching for "Miku" or "ねんどろいど"</span>
          )}
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {results?.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

interface Listing {
  listing_id: string
  name: string
  price: number
  condition: string | null
  url: string
  score: number
  source_name: string
}

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [showListings, setShowListings] = useState(false)
  const [loadingListings, setLoadingListings] = useState(false)
  
  const imageUrl = product.images?.[0] || null
  
  const fetchListings = async () => {
    if (listings.length > 0) {
      setShowListings(!showListings)
      return
    }
    setLoadingListings(true)
    try {
      const res = await fetch(`/api/listings/${product.id}`)
      const data = await res.json()
      setListings(data.listings || [])
      setShowListings(true)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoadingListings(false)
    }
  }
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-500 transition-colors group">
      {/* Image */}
      <div className="aspect-square bg-gray-900 relative overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category badge */}
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-black/70 text-cyan-400 rounded">
            {product.category}
          </span>
        )}
      </div>
      
      {/* Info */}
      <div className="p-4">
        {/* EN Name */}
        <h3 className="font-semibold text-white line-clamp-2 mb-1 text-sm">
          {product.name}
        </h3>
        
        {/* JP Name */}
        {product.name_jp && (
          <p className="text-cyan-400 text-xs mb-2 line-clamp-1">
            {product.name_jp}
          </p>
        )}
        
        {/* Series */}
        {product.series && (
          <p className="text-gray-500 text-xs mb-2 line-clamp-1">
            {product.series}
          </p>
        )}
        
        {/* Price & Date */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
          {product.price ? (
            <span className="text-sm text-gray-400">
              MSRP: ¥{product.price.toLocaleString()}
            </span>
          ) : (
            <span className="text-gray-500 text-sm">MSRP N/A</span>
          )}
          
          {product.release_date && (
            <span className="text-xs text-gray-500">
              {product.release_date}
            </span>
          )}
        </div>
        
        {/* Buy Button */}
        <button
          onClick={fetchListings}
          disabled={loadingListings}
          className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {loadingListings ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </span>
          ) : showListings ? (
            'Hide Listings'
          ) : (
            '🛒 Find Best Price'
          )}
        </button>
        
        {/* Listings */}
        {showListings && listings.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-400">{listings.length} listings found:</p>
            {listings.slice(0, 3).map((listing, i) => (
              <a
                key={listing.listing_id}
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 bg-gray-900 rounded border border-gray-700 hover:border-cyan-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">
                    ¥{listing.price?.toLocaleString() || '???'}
                  </span>
                  <span className="text-xs text-gray-500">{listing.source_name}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">{listing.name}</p>
                {listing.condition && (
                  <span className="text-xs text-gray-500">{listing.condition}</span>
                )}
              </a>
            ))}
            {listings.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{listings.length - 3} more listings
              </p>
            )}
          </div>
        )}
        
        {showListings && listings.length === 0 && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            No listings found yet
          </p>
        )}
      </div>
    </div>
  )
}
