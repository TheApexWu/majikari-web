'use client'

import { useState, useMemo, useEffect } from 'react'
import { Item, filterItems, sortItems, getCategories, getFranchises, SortOption } from '@/lib/items'
import { getWishlistCount } from '@/lib/wishlist'
import ItemCard from './ItemCard'
import FilterBar from './FilterBar'

interface ItemGridProps {
  items: Item[]
}

const PAGE_SIZE = 48

export default function ItemGrid({ items }: ItemGridProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [franchise, setFranchise] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [wishlistCount, setWishlistCount] = useState(0)
  const [page, setPage] = useState(1)

  const categories = useMemo(() => getCategories(items), [items])
  const franchises = useMemo(() => getFranchises(items), [items])

  const filteredItems = useMemo(() => {
    const filtered = filterItems(items, {
      search: search || undefined,
      category: category || undefined,
      franchise: franchise || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    })
    return sortItems(filtered, sort)
  }, [items, search, category, franchise, minPrice, maxPrice, sort])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, category, franchise, minPrice, maxPrice, sort])

  const visibleItems = filteredItems.slice(0, page * PAGE_SIZE)
  const hasMore = visibleItems.length < filteredItems.length

  useEffect(() => {
    setWishlistCount(getWishlistCount())
  }, [])

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setFranchise('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setPage(1)
  }

  const handleWishlistChange = () => {
    setWishlistCount(getWishlistCount())
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="lg:w-60 flex-shrink-0">
        <div className="lg:sticky lg:top-4">
          <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
            <span className="text-white text-sm">❤️ Wishlist</span>
            <span className="px-2 py-0.5 bg-white text-black text-xs font-bold rounded-full">
              {wishlistCount}
            </span>
          </div>

          <FilterBar
            category={category}
            franchise={franchise}
            minPrice={minPrice}
            maxPrice={maxPrice}
            search={search}
            sort={sort}
            categories={categories}
            franchises={franchises}
            onCategoryChange={setCategory}
            onFranchiseChange={setFranchise}
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

      {/* Grid */}
      <main className="flex-1">
        {/* Stats bar */}
        <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
          <span>{filteredItems.length.toLocaleString()} items</span>
          {filteredItems.length > 0 && (
            <span>
              Avg savings: ¥{Math.round(
                filteredItems.reduce((s, i) => s + (i.cost_estimates?.savings_jpy ?? 0), 0) / filteredItems.length
              ).toLocaleString()} per item
            </span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No items found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onWishlistChange={handleWishlistChange}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Load more ({filteredItems.length - visibleItems.length} remaining)
                </button>
              </div>
            )}

            {!hasMore && filteredItems.length > PAGE_SIZE && (
              <div className="mt-8 text-center text-zinc-600 text-sm">
                All {filteredItems.length.toLocaleString()} items loaded
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
