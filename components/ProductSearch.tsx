'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    setDebouncedQuery(q)
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
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

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name... 名前で検索 (e.g., Miku, ねんどろいど)"
          className="w-full px-6 py-4 text-lg bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-600 focus:outline-none transition-colors placeholder-zinc-600"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results count */}
      {results && (
        <div className="mb-4 text-zinc-400">
          {results.count > 0 ? (
            <span>
              Found <span className="text-white font-semibold">{results.count}</span> products
              {results.query && <> matching &ldquo;<span className="text-white">{results.query}</span>&rdquo;</>}
            </span>
          ) : (
            <span>No products found. Try searching for &ldquo;Miku&rdquo; or &ldquo;ねんどろいど&rdquo;</span>
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

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = product.images?.[0] || null

  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors group block"
    >
      {/* Image */}
      <div className="aspect-square bg-zinc-800 relative overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-black/70 text-zinc-300 rounded">
            {product.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-2 mb-1 text-sm">
          {product.name}
        </h3>

        {product.name_jp && (
          <p className="text-zinc-500 text-xs mb-2 line-clamp-1">
            {product.name_jp}
          </p>
        )}

        {product.series && (
          <p className="text-zinc-600 text-xs mb-2 line-clamp-1">
            {product.series}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
          {product.price ? (
            <span className="text-sm text-zinc-400">
              MSRP: ¥{product.price.toLocaleString()}
            </span>
          ) : (
            <span className="text-zinc-600 text-sm">MSRP N/A</span>
          )}

          {product.release_date && (
            <span className="text-xs text-zinc-600">
              {product.release_date}
            </span>
          )}
        </div>

        <div className="mt-3 py-2 text-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
          View Details →
        </div>
      </div>
    </Link>
  )
}
