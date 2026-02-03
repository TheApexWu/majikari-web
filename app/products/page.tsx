'use client'

import { Suspense } from 'react'
import ProductSearch from '@/components/ProductSearch'
import Link from 'next/link'

function SearchFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-14 bg-zinc-800 rounded-xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-zinc-800 rounded-lg h-80" />
        ))}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            マジカリ
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-white font-medium">
              Products
            </Link>
            <Link href="/discover" className="text-zinc-400 hover:text-white transition-colors">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold">
              Product Database
            </h1>
            <p className="text-lg text-zinc-400 mt-3">
              Search <span className="text-white font-semibold">7,300+</span> figures from Good Smile Company.
              Search in English or Japanese — we match both.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-sm">
                🔍 Bilingual Search
              </span>
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-sm">
                🎌 EN ↔ JP Matching
              </span>
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-sm">
                📊 Canonical Database
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Suggestions */}
      <section className="border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Try:</span>
            <Link href="/products?q=Miku" className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition">
              Miku
            </Link>
            <Link href="/products?q=ねんどろいど" className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition">
              ねんどろいど
            </Link>
            <Link href="/products?q=Fate" className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition">
              Fate
            </Link>
            <Link href="/products?q=figma" className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition">
              figma
            </Link>
          </div>
        </div>
      </section>

      {/* Main Search */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Suspense fallback={<SearchFallback />}>
          <ProductSearch />
        </Suspense>
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
