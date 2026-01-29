/**
 * Discovery Page
 * 
 * CONCEPT: Next.js App Router Pages
 * ─────────────────────────────────
 * In the App Router, every folder inside `app/` can have a `page.tsx`.
 * The folder path becomes the URL path:
 * 
 * app/discover/page.tsx → yoursite.com/discover
 * 
 * This file is a Server Component by default.
 * It can fetch data, access environment variables, etc.
 */

import { Suspense } from 'react'
import ItemGrid from '@/components/ItemGrid'
import { Item } from '@/lib/items'
import Link from 'next/link'

/**
 * CONCEPT: Server-side Data Fetching
 * ──────────────────────────────────
 * In Server Components, we can fetch data directly.
 * This runs on the server, not in the browser.
 * 
 * Benefits:
 * - Faster initial load (data arrives with HTML)
 * - Better SEO (search engines see the content)
 * - Smaller JavaScript bundle (fetch code stays on server)
 */
async function getItems(): Promise<Item[]> {
  /**
   * CONCEPT: Data Loading Strategy
   * ──────────────────────────────
   * Option 1: Import JSON directly (bundled at build time)
   * Option 2: Fetch from API route (runtime)
   * Option 3: Read from filesystem (server only)
   * 
   * We use Option 1 for MVP — simplest, works with static export.
   * The JSON gets bundled into the server code.
   * 
   * Trade-off: Large JSON = larger bundle. OK for 1,500 items (~1MB).
   * For 100K+ items, you'd want a database.
   */
  const items = (await import('@/data/items.json')).default
  return items as Item[]
}

/**
 * CONCEPT: Loading States with Suspense
 * ─────────────────────────────────────
 * Suspense lets you show a fallback while content loads.
 * This is built into React 18+.
 */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-700" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-6 bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * CONCEPT: Metadata Export
 * ────────────────────────
 * Next.js uses this export to set the page's <title> and meta tags.
 * Good for SEO.
 */
export const metadata = {
  title: 'Discover | Majikari',
  description: 'Browse Japanese collectibles from Mercari Japan. Figures, cards, plush, and more.',
}

/**
 * Main Page Component
 */
export default async function DiscoverPage() {
  // Fetch items on the server
  const items = await getItems()
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            マジカリ
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              Calculator
            </Link>
            <Link href="/discover" className="text-white font-medium">
              Discover
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <section className="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Discover Japanese Collectibles
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Browse {items.length.toLocaleString()} items from Mercari Japan. 
            Filter by category, price, or search for something specific.
            Save items to your wishlist to track them.
          </p>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<LoadingGrid />}>
          <ItemGrid items={items} />
        </Suspense>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Majikari (マジカリ) — The Real Deal on Japanese Goods</p>
          <p className="mt-2">Data scraped from Mercari Japan. Not affiliated with Mercari.</p>
        </div>
      </footer>
    </div>
  )
}
