/**
 * ItemCard Component
 * 
 * CONCEPT: React Component Structure
 * ──────────────────────────────────
 * A component is a reusable piece of UI.
 * 
 * This component displays one item from our scraped data.
 * It receives the item data as "props" (properties passed from parent).
 * 
 * PATTERN: Props Interface
 * Define an interface for the props so TypeScript can check them.
 */

'use client'  // This component uses onClick, so it must be a Client Component

import { useState } from 'react'
import { Item, formatPrice, formatPriceUSD } from '@/lib/items'
import { isInWishlist, toggleWishlist } from '@/lib/wishlist'

interface ItemCardProps {
  item: Item
  onWishlistChange?: () => void  // Callback when wishlist changes
}

export default function ItemCard({ item, onWishlistChange }: ItemCardProps) {
  // Local state for wishlist status
  // We track this in state so the heart icon updates immediately
  const [wishlisted, setWishlisted] = useState(() => isInWishlist(item.id))
  
  /**
   * CONCEPT: Event Handlers
   * ───────────────────────
   * Functions that run when user interacts (click, hover, etc.)
   * Convention: name them handle[Event] (e.g., handleClick)
   */
  const handleWishlistClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the card link
    e.preventDefault()
    e.stopPropagation()
    
    const newState = toggleWishlist(item.id)
    setWishlisted(newState)
    
    // Notify parent component if callback provided
    onWishlistChange?.()
  }
  
  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Open Mercari link in new tab
    window.open(item.url, '_blank')
  }
  
  /**
   * CONCEPT: Conditional Rendering
   * ──────────────────────────────
   * Show different UI based on data.
   * We use the ternary operator: condition ? ifTrue : ifFalse
   */
  const conditionBadge = item.condition_id ? {
    1: { label: '新品', color: 'bg-green-500' },
    2: { label: '未使用に近い', color: 'bg-green-400' },
    3: { label: '目立った傷なし', color: 'bg-yellow-500' },
    4: { label: 'やや傷あり', color: 'bg-orange-500' },
    5: { label: '傷あり', color: 'bg-red-500' },
  }[item.condition_id] : null
  
  /**
   * CONCEPT: Seller Trust Score
   * ───────────────────────────
   * Calculate a simple trust percentage from ratings.
   */
  const sellerTrust = item.seller_rating_good && item.seller_rating_bad
    ? Math.round((item.seller_rating_good / (item.seller_rating_good + item.seller_rating_bad)) * 100)
    : null
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition group">
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-700">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"  // Browser lazy-loads images below the fold
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
        
        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 p-2 rounded-full transition ${
            wishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
        
        {/* Condition Badge */}
        {conditionBadge && (
          <span className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs text-white ${conditionBadge.color}`}>
            {conditionBadge.label}
          </span>
        )}
        
        {/* Likes Badge */}
        {item.num_likes > 0 && (
          <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 text-xs text-white">
            ❤️ {item.num_likes}
          </span>
        )}
      </div>
      
      {/* Info Section */}
      <div className="p-3">
        {/* Title - truncated to 2 lines */}
        <h3 className="text-sm font-medium text-white line-clamp-2 h-10">
          {item.name}
        </h3>
        
        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-white">
            {formatPrice(item.price)}
          </span>
          <span className="text-xs text-gray-400">
            ({formatPriceUSD(item.price)})
          </span>
        </div>
        
        {/* Seller Info */}
        {sellerTrust !== null && (
          <div className="mt-1 text-xs text-gray-400">
            Seller: {sellerTrust}% positive
          </div>
        )}
        
        {/* Shipping Info */}
        <div className="mt-1 text-xs text-gray-500">
          {item.shipping_payer === 'seller' ? '送料込み (Free ship)' : '送料別 (Buyer pays)'}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleBuyClick}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
          >
            View on Mercari
          </button>
        </div>
      </div>
    </div>
  )
}
