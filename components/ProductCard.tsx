/**
 * ProductCard — Displays a product with expandable listings
 * 
 * Shows product image, name, price, and on-demand fetches listings
 * from Mercari JP when user clicks "View Details".
 */

'use client'

import { useState, useCallback } from 'react'
import { JPY_USD_RATE, CATEGORY_COLORS, STAGGER_DELAY_MS } from '@/lib/constants'
import type { Product, Listing } from '@/types'
import ListingRow from './ListingRow'

interface ProductCardProps {
  product: Product
  index: number
}

function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.default
  const key = category.toLowerCase()
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default
}

function formatPrice(yen?: number): string {
  if (!yen) return '—'
  return `¥${yen.toLocaleString()}`
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingsError, setListingsError] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState('')
  const [fallbackMsg, setFallbackMsg] = useState('')
  const [imgLoaded, setImgLoaded] = useState(false)

  const handleFindListings = useCallback(async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (listings.length > 0 || fallbackUrl) return

    setLoadingListings(true)
    setListingsError('')
    try {
      const res = await fetch(`/api/listings/${product.id}`)
      const data = await res.json()
      setListings(data.listings || [])
      if (data.fallback) {
        setFallbackUrl(data.fallback.url)
        setFallbackMsg(data.fallback.message)
      }
      if (!data.listings?.length && !data.fallback) {
        setListingsError('No listings found yet — check back soon')
      }
    } catch {
      setListingsError('Failed to load listings')
    } finally {
      setLoadingListings(false)
    }
  }, [expanded, listings.length, fallbackUrl, product.id])

  const imageUrl = product.images?.[0]
  const catColor = getCategoryColor(product.category)
  const msrpUsd = product.price ? `~$${(product.price / JPY_USD_RATE).toFixed(0)}` : null

  return (
    <div
      className="result-card"
      style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
    >
      <div className="card-image-wrap">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`card-image ${imgLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-kanji">狩</span>
          </div>
        )}
        {product.category && (
          <span className="card-category-float" style={{ background: catColor }}>
            {product.category}
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        {product.name_jp && <p className="card-title-jp">{product.name_jp}</p>}
        {product.series && <p className="card-series">{product.series}</p>}

        <div className="card-footer">
          <div className="card-price-group">
            <span className="card-price">{formatPrice(product.price)}</span>
            {msrpUsd && <span className="card-price-usd">{msrpUsd}</span>}
          </div>
          <button
            className={`card-listings-btn ${expanded ? 'active' : ''}`}
            onClick={handleFindListings}
          >
            {loadingListings ? (
              <span className="btn-loading">
                <span className="btn-spinner" />
                Searching…
              </span>
            ) : expanded ? (
              '▾ Hide'
            ) : (
              '🔍 View Details'
            )}
          </button>
        </div>

        <div className={`card-listings ${expanded ? 'open' : ''}`}>
          {listingsError && !fallbackUrl && (
            <div className="listings-empty">{listingsError}</div>
          )}
          {listings.map((l, i) => (
            <ListingRow key={l.listing_id} listing={l} index={i} />
          ))}
          {listings.length > 0 && (
            <div className="listings-tip">Prices from Mercari JP · Proxy fees not included</div>
          )}
          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="listing-row gsc-fallback"
            >
              <div className="listing-top-row">
                <div className="listing-name">{fallbackMsg}</div>
              </div>
              <div className="listing-meta">
                <span className="listing-source">Good Smile Company</span>
                <span className="listing-arrow">→</span>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
