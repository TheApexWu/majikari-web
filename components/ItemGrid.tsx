/**
 * ItemGrid Component
 * 
 * CONCEPT: Container vs Presentational Components
 * ───────────────────────────────────────────────
 * - "Container" components manage state and logic
 * - "Presentational" components just render UI
 * 
 * ItemGrid is a Container: it manages filters and passes data to children.
 * ItemCard is Presentational: it just renders what it's given.
 * 
 * This separation makes code easier to test and maintain.
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Item, filterItems, sortItems, getCategories, SortOption } from '@/lib/items'
import { getWishlistCount } from '@/lib/wishlist'
import ItemCard from './ItemCard'
import FilterBar from './FilterBar'

interface ItemGridProps {
  items: Item[]
}

/**
 * CONCEPT: Custom Hook Pattern (inline for now)
 * ─────────────────────────────────────────────
 * Hooks let you reuse stateful logic.
 * We're keeping it inline for simplicity.
 */

export default function ItemGrid({ items }: ItemGridProps) {
  // ============================================
  // STATE
  // ============================================
  
  /**
   * CONCEPT: useState
   * ─────────────────
   * useState(initialValue) returns [currentValue, setterFunction]
   * 
   * When you call the setter, React re-renders the component.
   */
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [wishlistCount, setWishlistCount] = useState(0)
  
  // ============================================
  // DERIVED STATE
  // ============================================
  
  /**
   * CONCEPT: useMemo
   * ────────────────
   * useMemo caches the result of a calculation.
   * It only re-runs when its dependencies change.
   * 
   * Without useMemo: filtering runs on EVERY render (expensive)
   * With useMemo: filtering only runs when filters change (efficient)
   */
  const categories = useMemo(() => getCategories(items), [items])
  
  const filteredItems = useMemo(() => {
    const filtered = filterItems(items, {
      search: search || undefined,
      category: category || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    })
    return sortItems(filtered, sort)
  }, [items, search, category, minPrice, maxPrice, sort])
  
  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * CONCEPT: useEffect
   * ──────────────────
   * useEffect runs "side effects" — things that happen outside React:
   * - Fetching data
   * - Setting up subscriptions
   * - Interacting with browser APIs (localStorage)
   * 
   * The array at the end is "dependencies" — effect re-runs when these change.
   * Empty array [] means "run once on mount"
   */
  useEffect(() => {
    // Load wishlist count on mount
    setWishlistCount(getWishlistCount())
  }, [])
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleReset = () => {
    setSearch('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
  }
  
  const handleWishlistChange = () => {
    // Re-read wishlist count when it changes
    setWishlistCount(getWishlistCount())
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  /**
   * CONCEPT: Responsive Grid with Tailwind
   * ──────────────────────────────────────
   * Tailwind's grid classes:
   * - grid: enable CSS grid
   * - grid-cols-2: 2 columns on mobile
   * - md:grid-cols-3: 3 columns on medium screens
   * - lg:grid-cols-4: 4 columns on large screens
   * - gap-4: 1rem gap between items
   */
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar with Filters */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-4">
          {/* Wishlist Counter */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
            <span className="text-white">❤️ Wishlist</span>
            <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded-full">
              {wishlistCount}
            </span>
          </div>
          
          <FilterBar
            category={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            search={search}
            sort={sort}
            categories={categories}
            onCategoryChange={setCategory}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onSearchChange={setSearch}
            onSortChange={setSort}
            onReset={handleReset}
            totalItems={items.length}
            filteredItems={filteredItems.length}
          />
        </div>
      </aside>
      
      {/* Main Grid */}
      <main className="flex-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">No items found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>
        )}
        
        {/* Load More (pagination placeholder) */}
        {filteredItems.length > 0 && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            Showing all {filteredItems.length} items
          </div>
        )}
      </main>
    </div>
  )
}
