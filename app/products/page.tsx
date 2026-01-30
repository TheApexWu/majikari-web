/**
 * Products Search Page
 * 
 * The core demo: Search 1800+ Good Smile products by EN or JP name.
 * Shows the technical moat - bilingual product matching.
 */

'use client'

import { Suspense } from 'react'
import ProductSearch from '@/components/ProductSearch'
import Link from 'next/link'

function SearchFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-14 bg-gray-800 rounded-xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg h-80" />
        ))}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50 bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            マジカリ
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
              Home
            </Link>
            <Link href="/products" className="text-white font-medium text-sm">
              Products
            </Link>
            <Link href="/discover" className="text-gray-400 hover:text-white transition text-sm">
              Listings
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                Product Database
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-6">
              Search <span className="text-cyan-400 font-semibold">1,800+</span> figures from Good Smile Company.
              <br />
              <span className="text-gray-500">Search in English or Japanese — we match both.</span>
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm">
                🔍 Bilingual Search
              </span>
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                🎌 EN ↔ JP Matching
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                📊 Canonical Database
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Suggestions */}
      <section className="border-b border-gray-800/50 bg-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Try:</span>
            <Link 
              href="/products?q=Miku"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Miku
            </Link>
            <Link 
              href="/products?q=ねんどろいど"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              ねんどろいど
            </Link>
            <Link 
              href="/products?q=Fate"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Fate
            </Link>
            <Link 
              href="/products?q=figma"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              figma
            </Link>
          </div>
        </div>
      </section>

      {/* Main Search */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<SearchFallback />}>
          <ProductSearch />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              <span className="text-cyan-400">マジカリ</span> — Canonical product database from Good Smile Company
            </p>
            <p>
              Next: Match products to Mercari JP, Mandarake, Surugaya listings
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
