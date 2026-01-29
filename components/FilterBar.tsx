/**
 * FilterBar Component
 * 
 * CONCEPT: Controlled vs Uncontrolled Components
 * ──────────────────────────────────────────────
 * "Controlled" means React controls the value via state.
 * "Uncontrolled" means the DOM controls the value (default HTML behavior).
 * 
 * We use controlled components here so:
 * 1. We can sync filters to URL params (future)
 * 2. Parent can set initial values
 * 3. Filter logic is predictable
 */

'use client'

import { SortOption } from '@/lib/items'

interface FilterBarProps {
  // Current filter values
  category: string
  minPrice: string
  maxPrice: string
  search: string
  sort: SortOption
  
  // Available options
  categories: string[]
  
  // Change handlers
  onCategoryChange: (category: string) => void
  onMinPriceChange: (price: string) => void
  onMaxPriceChange: (price: string) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: SortOption) => void
  onReset: () => void
  
  // Stats
  totalItems: number
  filteredItems: number
}

export default function FilterBar({
  category,
  minPrice,
  maxPrice,
  search,
  sort,
  categories,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSearchChange,
  onSortChange,
  onReset,
  totalItems,
  filteredItems,
}: FilterBarProps) {
  /**
   * CONCEPT: Capitalize Helper
   * ──────────────────────────
   * Display "figures" as "Figures" in the UI
   */
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>
      
      {/* Category */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {capitalize(cat)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Price Range */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Price (¥)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="Min"
            className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Max"
            className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      
      {/* Sort */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Sort By</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="likes">Most Popular</option>
        </select>
      </div>
      
      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
      >
        Reset Filters
      </button>
      
      {/* Results Count */}
      <div className="text-sm text-gray-400 text-center pt-2 border-t border-gray-700">
        Showing {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} items
      </div>
    </div>
  )
}
