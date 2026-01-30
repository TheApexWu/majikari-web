'use client'

import { useState } from 'react'
import { Item, formatPrice, formatPriceUSD } from '@/lib/items'
import { isInWishlist, toggleWishlist } from '@/lib/wishlist'

interface ItemCardProps {
  item: Item
  onWishlistChange?: () => void
}

export default function ItemCard({ item, onWishlistChange }: ItemCardProps) {
  const [wishlisted, setWishlisted] = useState(() => isInWishlist(item.id))
  const [showCosts, setShowCosts] = useState(false)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newState = toggleWishlist(item.id)
    setWishlisted(newState)
    onWishlistChange?.()
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(item.url, '_blank')
  }

  const cost = item.cost_estimates
  const trust = item.trust

  // Risk badge color
  const riskColor = {
    low: 'bg-emerald-500/20 text-emerald-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  }[trust?.risk ?? 'medium']

  // Price tier badge
  const tierBadge = {
    budget: { label: 'Budget', color: 'text-emerald-400' },
    mid: { label: 'Mid-range', color: 'text-blue-400' },
    premium: { label: 'Premium', color: 'text-purple-400' },
    grail: { label: 'Grail', color: 'text-amber-400' },
  }[item.price_tier ?? 'mid']

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-600 transition group">
      {/* Image */}
      <div className="relative aspect-square bg-zinc-800">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            No Image
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition ${
            wishlisted
              ? 'bg-red-500 text-white'
              : 'bg-black/60 text-white hover:bg-black/80'
          }`}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>

        {/* Franchise badge */}
        {item.franchise && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-zinc-300 font-medium">
            {item.franchise}
          </span>
        )}

        {/* Likes */}
        {item.num_likes > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">
            ♥ {item.num_likes}
          </span>
        )}

        {/* Savings badge */}
        {cost && cost.savings_jpy > 500 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-[10px] text-white font-medium">
            Save {formatPrice(cost.savings_jpy)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-white line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* Price row */}
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">
              {formatPrice(item.price)}
            </span>
            <span className="text-xs text-zinc-500">
              ${item.price_usd}
            </span>
          </div>
          {tierBadge && (
            <span className={`text-[10px] font-medium ${tierBadge.color}`}>
              {tierBadge.label}
            </span>
          )}
        </div>

        {/* True cost */}
        {cost && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">True landed cost</span>
              <span className="text-white font-medium">
                ${cost.cheapest_total_usd} via {cost.cheapest_proxy}
              </span>
            </div>
          </div>
        )}

        {/* Trust + Category row */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {trust && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${riskColor}`}>
              {trust.risk === 'low' ? '✓ Low risk' : trust.risk === 'medium' ? '~ Medium risk' : '⚠ High risk'}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
            {item.category_source}
          </span>
          {item.condition && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
              {item.condition}
            </span>
          )}
        </div>

        {/* Cost breakdown toggle */}
        {cost && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCosts(!showCosts) }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition"
            >
              {showCosts ? '▾ Hide proxy costs' : '▸ Compare proxy costs'}
            </button>

            {showCosts && (
              <div className="mt-1.5 space-y-1">
                {Object.entries(cost.breakdown)
                  .sort(([, a], [, b]) => a.total_jpy - b.total_jpy)
                  .map(([key, proxy]) => (
                    <div key={key} className="flex items-center justify-between text-[10px]">
                      <span className={`${proxy.proxy === cost.cheapest_proxy ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {proxy.proxy}
                        {proxy.proxy === cost.cheapest_proxy && ' ★'}
                      </span>
                      <span className={`font-mono ${proxy.proxy === cost.cheapest_proxy ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {formatPrice(proxy.total_jpy)} (${proxy.total_usd})
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Buy button */}
        <div className="mt-3">
          <button
            onClick={handleBuyClick}
            className="w-full px-3 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition"
          >
            View on Mercari →
          </button>
        </div>
      </div>
    </div>
  )
}
