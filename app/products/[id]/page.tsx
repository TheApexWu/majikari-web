'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const JPY_USD_RATE = 155
const EMS_SHIPPING = 2700

interface Product {
  id: string
  source_id: number
  name: string
  name_jp?: string
  series?: string
  category?: string
  price?: number
  release_date?: string
  images?: string
  specifications?: string
  sculptor?: string
  manufacturer?: string
}

interface Listing {
  listing_id: string
  name: string
  price: number
  condition: string | null
  image: string | null
  url: string
  score: number
}

interface ProxyCost {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  total_jpy: number
  total_usd: number
}

function calculateProxyCosts(priceJpy: number): ProxyCost[] {
  const proxies = [
    {
      proxy: 'Buyee',
      serviceFee: 500,
      fxRate: 0.035,
      paymentRate: 0.03,
    },
    {
      proxy: 'ZenMarket',
      serviceFee: 300,
      fxRate: 0.03,
      paymentRate: 0.035,
    },
    {
      proxy: 'FromJapan',
      serviceFee: 200,
      fxRate: 0.08,
      paymentRate: 0,
    },
    {
      proxy: 'Neokyo',
      serviceFee: 350,
      fxRate: 0,
      paymentRate: 0.029,
    },
  ]

  return proxies.map((p) => {
    const fees = p.serviceFee + Math.round(priceJpy * p.fxRate) + Math.round(priceJpy * p.paymentRate)
    const total = priceJpy + fees + EMS_SHIPPING
    return {
      proxy: p.proxy,
      item_jpy: priceJpy,
      fees_jpy: fees,
      shipping_jpy: EMS_SHIPPING,
      total_jpy: total,
      total_usd: Math.round((total / JPY_USD_RATE) * 100) / 100,
    }
  }).sort((a, b) => a.total_jpy - b.total_jpy)
}

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/search?q=&limit=100`)
        const data = await res.json()
        // Find the product by ID
        const found = data.products?.find((p: Product) => p.id === productId)
        if (!found) {
          // Try fetching all and searching
          const res2 = await fetch(`/api/search?q=${productId.replace('GSC-', '')}&limit=10`)
          const data2 = await res2.json()
          setProduct(data2.products?.[0] || null)
        } else {
          setProduct(found)
        }
      } catch (err) {
        console.error('Failed to load product:', err)
      } finally {
        setLoading(false)
      }
    }

    async function loadListings() {
      try {
        const res = await fetch(`/api/listings/${productId}`)
        const data = await res.json()
        setListings(data.listings || [])
        // Also try to get product info from listings response
        if (data.productName) {
          setProduct((prev) => prev || {
            id: productId,
            source_id: 0,
            name: data.productName,
            name_jp: data.productNameJp,
          })
        }
      } catch (err) {
        console.error('Failed to load listings:', err)
      } finally {
        setListingsLoading(false)
      }
    }

    loadProduct()
    loadListings()
  }, [productId])

  if (loading && listingsLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-zinc-500">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-zinc-500">Could not find product {productId}</p>
          <Link href="/products" className="mt-4 inline-block text-zinc-400 hover:text-white transition-colors">
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  // Parse images from the product
  let images: string[] = []
  if (product.images) {
    try {
      images = JSON.parse(product.images)
    } catch {
      images = []
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-zinc-500 mb-6">
          <Link href="/products" className="hover:text-white transition-colors">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">{product.name}</span>
        </div>

        {/* Product Info */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image */}
          <div className="md:w-1/3">
            {images[0] ? (
              <img
                src={images[0]}
                alt={product.name}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800"
              />
            ) : (
              <div className="w-full aspect-square bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                No Image
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-2/3">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.name_jp && (
              <p className="mt-1 text-zinc-400">{product.name_jp}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              {product.series && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Series</span>
                  <p className="text-sm text-white mt-1">{product.series}</p>
                </div>
              )}
              {product.category && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Category</span>
                  <p className="text-sm text-white mt-1">{product.category}</p>
                </div>
              )}
              {product.price && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">MSRP</span>
                  <p className="text-sm text-white mt-1">¥{product.price.toLocaleString()}</p>
                </div>
              )}
              {product.release_date && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Release Date</span>
                  <p className="text-sm text-white mt-1">{product.release_date}</p>
                </div>
              )}
              {product.sculptor && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Sculptor</span>
                  <p className="text-sm text-white mt-1">{product.sculptor}</p>
                </div>
              )}
              {product.manufacturer && (
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Manufacturer</span>
                  <p className="text-sm text-white mt-1">{product.manufacturer}</p>
                </div>
              )}
            </div>

            {product.specifications && (
              <div className="mt-6">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Specifications</span>
                <p className="text-sm text-zinc-400 mt-1">{product.specifications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mercari Listings */}
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6">
            Mercari JP Listings
            {listings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {listings.length} found
              </span>
            )}
          </h2>

          {listingsLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-2 text-sm text-zinc-500">Searching listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
              <p className="text-zinc-400">No matching listings found on Mercari JP</p>
            </div>
          ) : (
            <div className="space-y-6">
              {listings.map((listing) => {
                const costs = calculateProxyCosts(listing.price)
                const cheapest = costs[0]
                const mostExpensive = costs[costs.length - 1]

                return (
                  <div
                    key={listing.listing_id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {listing.image && (
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="w-20 h-20 rounded-lg object-cover bg-zinc-800 flex-shrink-0"
                        />
                      )}

                      {/* Listing info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-white text-sm line-clamp-2">
                              {listing.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-lg font-bold text-white">
                                ¥{listing.price.toLocaleString()}
                              </span>
                              {listing.condition && (
                                <span className="text-xs text-zinc-500 px-2 py-0.5 bg-zinc-800 rounded">
                                  {listing.condition}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                          >
                            View →
                          </a>
                        </div>

                        {/* Proxy cost comparison */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {costs.map((cost) => {
                            const isCheapest = cost.proxy === cheapest.proxy
                            return (
                              <div
                                key={cost.proxy}
                                className={`p-3 rounded-lg border text-center ${
                                  isCheapest
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-zinc-800 bg-zinc-800/30'
                                }`}
                              >
                                <div className={`text-xs font-medium ${
                                  isCheapest ? 'text-emerald-400' : 'text-zinc-500'
                                }`}>
                                  {cost.proxy}{isCheapest ? ' ★' : ''}
                                </div>
                                <div className={`text-sm font-bold mt-1 ${
                                  isCheapest ? 'text-emerald-400' : 'text-white'
                                }`}>
                                  ${cost.total_usd}
                                </div>
                                <div className="text-[10px] text-zinc-600 mt-0.5">
                                  ¥{cost.total_jpy.toLocaleString()}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Savings note */}
                        {mostExpensive.total_jpy - cheapest.total_jpy > 0 && (
                          <p className="mt-2 text-xs text-zinc-500">
                            Save <span className="text-emerald-400">
                              ¥{(mostExpensive.total_jpy - cheapest.total_jpy).toLocaleString()}
                            </span> with {cheapest.proxy} vs {mostExpensive.proxy}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-600">
          <span>Majikari (マジカリ)</span>
          <span>Built by a collector, for collectors</span>
        </div>
      </footer>
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-zinc-800/50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          マジカリ
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/discover" className="text-zinc-400 hover:text-white transition-colors">
            Browse
          </Link>
          <Link href="/products" className="text-zinc-400 hover:text-white transition-colors">
            Products
          </Link>
        </nav>
      </div>
    </header>
  )
}
