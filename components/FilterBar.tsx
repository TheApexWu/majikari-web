'use client'

import { SortOption } from '@/lib/items'

interface FilterBarProps {
  category: string
  franchise: string
  minPrice: string
  maxPrice: string
  search: string
  sort: SortOption

  categories: string[]
  franchises: string[]

  onCategoryChange: (category: string) => void
  onFranchiseChange: (franchise: string) => void
  onMinPriceChange: (price: string) => void
  onMaxPriceChange: (price: string) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: SortOption) => void
  onReset: () => void

  totalItems: number
  filteredItems: number
}

const capitalize = (s: string | null | undefined) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function FilterBar({
  category, franchise, minPrice, maxPrice, search, sort,
  categories, franchises,
  onCategoryChange, onFranchiseChange, onMinPriceChange, onMaxPriceChange,
  onSearchChange, onSortChange, onReset,
  totalItems, filteredItems,
}: FilterBarProps) {
  const selectClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 focus:outline-none text-sm"
  const inputClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none text-sm"

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items, franchises..."
          className={inputClass}
        />
      </div>

      {/* Franchise */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1 font-medium">Franchise</label>
        <select value={franchise} onChange={(e) => onFranchiseChange(e.target.value)} className={selectClass}>
          <option value="">All Franchises</option>
          {franchises.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1 font-medium">Category</label>
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{capitalize(cat)}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1 font-medium">Price (¥)</label>
        <div className="flex gap-2">
          <input type="number" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} placeholder="Min" className={inputClass} />
          <input type="number" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} placeholder="Max" className={inputClass} />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1 font-medium">Sort</label>
        <select value={sort} onChange={(e) => onSortChange(e.target.value as SortOption)} className={selectClass}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="likes">Most Popular</option>
          <option value="savings">Biggest Savings</option>
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded-lg transition"
      >
        Reset Filters
      </button>

      {/* Count */}
      <div className="text-xs text-zinc-500 text-center pt-2 border-t border-zinc-800">
        {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} items
      </div>
    </div>
  )
}
