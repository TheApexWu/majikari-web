/**
 * Home Page — Majikari Search & Landing
 * 
 * Search interface for Japanese collectibles with real-time pricing.
 * Components extracted to keep this file focused on state & composition.
 */

'use client'

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react'
import type { Product } from '@/types'
import ProductCard from '@/components/ProductCard'
import LandingSections from '@/components/LandingSections'

// Rotating placeholder hints
const FRANCHISE_HINTS = [
  'Hatsune Miku', 'Fate/Grand Order', 'Demon Slayer', 'Re:ZERO',
  'My Hero Academia', 'hololive', 'Attack on Titan', 'Jujutsu Kaisen',
  'Evangelion', 'Chainsaw Man', 'Touken Ranbu', 'Spy x Family',
  'One Piece', 'Genshin Impact', 'Bocchi the Rock!', 'Frieren',
]

// Quick-access search pills
const SEARCH_PILLS = ['Miku', 'Chainsaw Man', 'Fate', 'ねんどろいど', 'Frieren', 'hololive']

export default function Home() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Results metadata
  const [totalCount, setTotalCount] = useState(0)
  const [totalMatching, setTotalMatching] = useState(0)
  const [totalWithListings, setTotalWithListings] = useState(0)
  const [showFullCatalog, setShowFullCatalog] = useState(false)
  
  // Fallback listings (when no products match but raw listings exist)
  const [listingFallbacks, setListingFallbacks] = useState<any[]>([])
  
  // UI state
  const [hintIndex, setHintIndex] = useState(() => Math.floor(Math.random() * FRANCHISE_HINTS.length))
  const [animKey, setAnimKey] = useState(0)
  
  // Refs
  const resultsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Rotate placeholder hints
  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex(i => (i + 1) % FRANCHISE_HINTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Core search function
  const doSearch = useCallback(async (query: string, showAll = false) => {
    if (!query.trim()) return
    
    setLoading(true)
    setHasSearched(true)
    setSubmittedQuery(query.trim())
    setListingFallbacks([])
    
    try {
      const availParam = showAll ? 'false' : 'true'
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=50&available=${availParam}`)
      const data = await res.json()
      
      setProducts(data.products || [])
      setTotalCount(data.count || 0)
      setTotalMatching(data.totalMatching || 0)
      setTotalWithListings(data.totalWithListings || 0)
      setAnimKey(k => k + 1)

      // Fallback: if no products, try raw listing search
      if ((data.products || []).length === 0) {
        try {
          const listRes = await fetch(`/api/lookup?q=${encodeURIComponent(query.trim())}`)
          const listData = await listRes.json()
          if (listData.results?.length > 0) {
            setListingFallbacks(listData.results)
          }
        } catch { /* best-effort */ }
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch {
      setProducts([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    doSearch(searchQuery, showFullCatalog)
  }

  function handlePillClick(query: string) {
    setSearchQuery(query)
    doSearch(query, showFullCatalog)
  }

  function toggleCatalog() {
    const next = !showFullCatalog
    setShowFullCatalog(next)
    if (submittedQuery) doSearch(submittedQuery, next)
  }

  function clearSearch() {
    setSearchQuery('')
    setSubmittedQuery('')
    setProducts([])
    setTotalCount(0)
    setTotalMatching(0)
    setTotalWithListings(0)
    setHasSearched(false)
    setShowFullCatalog(false)
    setListingFallbacks([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="nav-logo">
          <a href="/" onClick={(e) => { e.preventDefault(); clearSearch() }} style={{ textDecoration: 'none', color: 'inherit' }}>
            majikari<span className="jp">マジカリ</span>
          </a>
        </div>
        {hasSearched && (
          <button onClick={clearSearch} className="nav-back-btn">← Home</button>
        )}
      </nav>

      {/* Hero / Search */}
      <div className={`hero ${hasSearched ? 'hero-compact' : ''}`}>
        {!hasSearched && (
          <>
            <div className="name-box">
              <div className="name-word">
                <span className="name-jp maji">マジ</span>
                <span className="name-en">maji — &quot;for real&quot;</span>
              </div>
              <span className="name-plus">+</span>
              <div className="name-word">
                <span className="name-jp kari">狩り</span>
                <span className="name-en">kari — &quot;hunting&quot;</span>
              </div>
            </div>
            <h1>Know what it <em>actually</em> costs<br />to buy from Japan.</h1>
            <p className="hero-sub">
              Search 7,300+ figures by name (EN or JP). Find listings on Mercari JP.
              Compare proxy fees. See the real landed cost.
            </p>
          </>
        )}

        <form onSubmit={handleSearch} className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Try "${FRANCHISE_HINTS[hintIndex]}"...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); inputRef.current?.focus() }}>✕</button>
          )}
        </form>

        {!hasSearched && (
          <div className="stats-bar">
            <span className="stat-chip"><strong>10,960</strong> listings tracked</span>
            <span className="stat-chip"><strong>7,374</strong> products indexed</span>
            <span className="stat-chip"><strong>6,453</strong> JP names mapped</span>
          </div>
        )}

        <div className="stats-bar" style={{ marginTop: '0.5rem' }}>
          {SEARCH_PILLS.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(pill)}
              className={`stat-chip pill-btn ${submittedQuery === pill ? 'pill-active' : ''}`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div ref={resultsRef} className="results-section" key={animKey}>
          <div className="results-header">
            {loading ? (
              <div className="results-loading-bar"><div className="loading-shimmer" /></div>
            ) : (
              <div className="results-header-row">
                <p className="results-count">
                  <strong>{totalCount}</strong>
                  {showFullCatalog ? ' products' : ' with listings'}
                  {' '}for &ldquo;<span className="results-query">{submittedQuery}</span>&rdquo;
                  {!showFullCatalog && totalMatching > totalWithListings && (
                    <span className="results-note"> · {totalMatching - totalWithListings} more in catalog</span>
                  )}
                </p>
                <button className={`catalog-toggle ${showFullCatalog ? 'active' : ''}`} onClick={toggleCatalog}>
                  {showFullCatalog ? '🛒 With listings only' : '📚 Show full catalog'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="results-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="result-card skeleton" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="card-image-wrap skeleton-img" />
                  <div className="card-body">
                    <div className="skeleton-line w60" />
                    <div className="skeleton-line w80" />
                    <div className="skeleton-line w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="results-empty">
              {listingFallbacks.length > 0 ? (
                <>
                  <p style={{ marginBottom: '0.5rem' }}>
                    No cataloged products for &ldquo;{submittedQuery}&rdquo; yet, but we found <strong>{listingFallbacks.length}</strong> marketplace listings:
                  </p>
                  <div className="results-grid" style={{ marginTop: '1rem' }}>
                    {listingFallbacks.map((l: any, i: number) => (
                      <a key={l.id || i} href={l.url} target="_blank" rel="noopener noreferrer" className="result-card listing-fallback-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {l.image_url && (
                          <div className="card-image-wrap">
                            <img src={l.image_url} alt={l.name} loading="lazy" />
                          </div>
                        )}
                        <div className="card-body">
                          <div className="card-name">{l.name}</div>
                          <div className="card-price">¥{l.price?.toLocaleString()}</div>
                          {l.cheapest_proxy && l.cheapest_total_usd && (
                            <div className="card-proxy" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                              Best via {l.cheapest_proxy}: ${l.cheapest_total_usd.toFixed(2)} landed
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                  <p className="results-empty-hint" style={{ marginTop: '1rem' }}>
                    These are raw Mercari JP listings — not yet matched to our product catalog.
                  </p>
                </>
              ) : (
                <>
                  <div className="empty-kanji">無</div>
                  <p>Nothing found for &ldquo;{submittedQuery}&rdquo;</p>
                  <p className="results-empty-hint">Try English or Japanese — both work here.</p>
                </>
              )}
            </div>
          ) : (
            <div className="results-grid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Landing Content (shown before search) */}
      {!hasSearched && <LandingSections />}

      {/* Footer */}
      <footer>
        <div>
          <span className="footer-brand">majikari マジカリ</span> · real prices from Japan
        </div>
      </footer>
    </>
  )
}
