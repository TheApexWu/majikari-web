'use client'

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react'

interface Product {
  id: string
  source_id: number
  name: string
  name_jp?: string
  series?: string
  category?: string
  price?: number
  release_date?: string
  images?: string[]
  listing_count: number
}

interface Listing {
  listing_id: string
  name: string
  price: number
  condition: string | null
  image: string | null
  url: string
  score: number
  match_reason: string
  risk: 'low' | 'medium' | 'high'
  risk_flags: string[]
  source_name: string
}

const CATEGORY_COLORS: Record<string, string> = {
  nendoroid: 'var(--cyan)',
  figma: 'var(--lavender)',
  scale: 'var(--accent)',
  'pop up parade': 'var(--mint)',
  default: 'var(--accent-soft)',
}

function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.default
  const key = category.toLowerCase()
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default
}

function formatPrice(yen?: number): string {
  if (!yen) return '—'
  return `¥${yen.toLocaleString()}`
}

function ListingRow({ listing, index }: { listing: Listing; index: number }) {
  const usdEst = listing.price ? `~$${(listing.price * 0.0067).toFixed(0)}` : ''
  const riskClass = listing.risk === 'high' ? 'risk-high' : listing.risk === 'medium' ? 'risk-med' : 'risk-low'
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`listing-row ${riskClass}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="listing-top-row">
        <div className="listing-name">{listing.name}</div>
        <span className={`risk-badge ${riskClass}`}>
          {listing.risk === 'low' ? '✓' : listing.risk === 'high' ? '⚠' : '~'}
        </span>
      </div>
      <div className="listing-meta">
        <span className="listing-price">¥{listing.price.toLocaleString()}</span>
        <span className="listing-usd">{usdEst}</span>
        {listing.condition && <span className="listing-condition">{listing.condition}</span>}
        {listing.risk_flags.length > 0 && (
          <span className="listing-flags">{listing.risk_flags[0]}</span>
        )}
        <span className="listing-source">{listing.source_name}</span>
        <span className="listing-arrow">→</span>
      </div>
    </a>
  )
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingsError, setListingsError] = useState('')
  const [imgLoaded, setImgLoaded] = useState(false)

  const handleFindListings = useCallback(async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (listings.length > 0) return

    setLoadingListings(true)
    setListingsError('')
    try {
      const res = await fetch(`/api/listings/${product.id}`)
      const data = await res.json()
      setListings(data.listings || [])
      if (!data.listings?.length) {
        setListingsError('No listings found yet — check back soon')
      }
    } catch {
      setListingsError('Failed to load listings')
    } finally {
      setLoadingListings(false)
    }
  }, [expanded, listings.length, product.id])

  const imageUrl = product.images?.[0]
  const catColor = getCategoryColor(product.category)
  const msrpUsd = product.price ? `~$${(product.price * 0.0067).toFixed(0)}` : null

  return (
    <div
      className="result-card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="card-image-wrap">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`card-image ${imgLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-kanji">狩</span>
          </div>
        )}
        {product.category && (
          <span className="card-category-float" style={{ background: catColor }}>
            {product.category}
          </span>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        {product.name_jp && <p className="card-title-jp">{product.name_jp}</p>}
        {product.series && <p className="card-series">{product.series}</p>}

        <div className="card-footer">
          <div className="card-price-group">
            <span className="card-price">{formatPrice(product.price)}</span>
            {msrpUsd && <span className="card-price-usd">{msrpUsd}</span>}
          </div>
          {product.listing_count > 0 ? (
            <button
              className={`card-listings-btn ${expanded ? 'active' : ''}`}
              onClick={handleFindListings}
            >
              {loadingListings ? (
                <span className="btn-loading">
                  <span className="btn-spinner" />
                  Searching…
                </span>
              ) : expanded ? (
                '▾ Hide'
              ) : (
                `🛒 ${product.listing_count} listing${product.listing_count !== 1 ? 's' : ''}`
              )}
            </button>
          ) : (
            <span className="card-no-listings">Catalog only</span>
          )}
        </div>

        {product.listing_count > 0 && (
          <div className={`card-listings ${expanded ? 'open' : ''}`}>
            {listingsError && (
              <div className="listings-empty">{listingsError}</div>
            )}
            {listings.map((l, i) => (
              <ListingRow key={l.listing_id} listing={l} index={i} />
            ))}
            {listings.length > 0 && (
              <div className="listings-tip">Prices from Mercari JP · Proxy fees not included</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing-v4' }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setMessage(data.message || "You're on the list!")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Network error — try again')
    }
  }

  return (
    <div className="waitlist">
      <div className="waitlist-badge">Coming Soon</div>
      <h2>Get notified when we launch</h2>
      <p>
        Live price tracking. Automatic proxy comparison. Push alerts when your grail drops in price.
        <br />Be first.
      </p>
      {status === 'success' ? (
        <div className="waitlist-confirmed">
          <span className="waitlist-check">✓</span>
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="waitlist-form">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <div className="waitlist-status error">{message}</div>
      )}
    </div>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalMatching, setTotalMatching] = useState(0)
  const [totalWithListings, setTotalWithListings] = useState(0)
  const [showFullCatalog, setShowFullCatalog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (query: string, showAll = false) => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)
    setSubmittedQuery(query.trim())
    try {
      const availParam = showAll ? 'false' : 'true'
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=50&available=${availParam}`)
      const data = await res.json()
      setProducts(data.products || [])
      setTotalCount(data.count || 0)
      setTotalMatching(data.totalMatching || 0)
      setTotalWithListings(data.totalWithListings || 0)
      setAnimKey((k) => k + 1)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  return (
    <>
      <nav>
        <div className="nav-logo">
          <a href="/" onClick={(e) => { e.preventDefault(); clearSearch() }} style={{ textDecoration: 'none', color: 'inherit' }}>
            majikari<span className="jp">マジカリ</span>
          </a>
        </div>
        {hasSearched && (
          <button onClick={clearSearch} className="nav-back-btn">
            ← Home
          </button>
        )}
      </nav>

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
            placeholder="Try: Blue Archive, ねんどろいど, chainsaw man, marisa fumo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); inputRef.current?.focus() }}>✕</button>
          )}
        </form>

        {!hasSearched && (
          <div className="stats-bar">
            <span className="stat-chip"><strong>5,033</strong> listings tracked</span>
            <span className="stat-chip"><strong>7,374</strong> products indexed</span>
            <span className="stat-chip"><strong>6,453</strong> JP names mapped</span>
          </div>
        )}

        <div className="stats-bar" style={{ marginTop: '0.5rem' }}>
          {['Blue Archive', 'Miku', 'Chainsaw Man', 'Fate', 'ねんどろいど', 'Touhou'].map((pill) => (
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
              <div className="results-loading-bar">
                <div className="loading-shimmer" />
              </div>
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
                <button
                  className={`catalog-toggle ${showFullCatalog ? 'active' : ''}`}
                  onClick={toggleCatalog}
                >
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
              <div className="empty-kanji">無</div>
              <p>Nothing found for &ldquo;{submittedQuery}&rdquo;</p>
              <p className="results-empty-hint">Try English or Japanese — both work here.</p>
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

      {/* Landing sections */}
      {!hasSearched && (
        <>
          <hr className="divider" />

          <div className="compare-section">
            <div className="compare-header">
              <h2>See the real cost breakdown</h2>
              <p>Same figure, different proxies. Prices vary more than you&apos;d expect.</p>
            </div>

            <div className="compare-item">
              <div className="compare-item-name">Nendoroid Mami Tomoe — Walpurgisnacht Ver.</div>
              <div className="compare-item-jp">ねんどろいど 巴マミ ワルプルギスの廻天 Ver.</div>
              <div className="compare-item-price">Mercari JP listing: <strong>¥3,900</strong> (~$26)</div>
            </div>

            <table className="compare-table">
              <thead>
                <tr>
                  <th>Proxy Service</th>
                  <th>Service Fee</th>
                  <th>Shipping (est.)</th>
                  <th>Total Landed</th>
                </tr>
              </thead>
              <tbody>
                <tr className="best-row">
                  <td className="proxy-name">Buyee<span className="tag-best">Best</span></td>
                  <td className="fee">$3.90</td>
                  <td className="fee">$14.00</td>
                  <td className="total-cell">$43.90</td>
                </tr>
                <tr>
                  <td className="proxy-name">ZenMarket</td>
                  <td className="fee">$3.50</td>
                  <td className="fee">$18.00</td>
                  <td className="total-cell">$47.50</td>
                </tr>
                <tr>
                  <td className="proxy-name">FromJapan</td>
                  <td className="fee">$5.20</td>
                  <td className="fee">$16.00</td>
                  <td className="total-cell">$47.20</td>
                </tr>
                <tr>
                  <td className="proxy-name">Neokyo</td>
                  <td className="fee">$5.50</td>
                  <td className="fee">$19.00</td>
                  <td className="total-cell">$50.50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="divider" />

          <div className="how-section">
            <div className="how-header">
              <h2>How it works</h2>
            </div>
            <div className="how-steps">
              <div className="how-step">
                <div className="step-num s1">01</div>
                <div className="step-title">Search in any language</div>
                <div className="step-desc">
                  Type in English or Japanese. &quot;chainsaw man&quot; and &quot;チェンソーマン&quot; both find the same figures. 7,374 products mapped across languages.
                </div>
              </div>
              <div className="how-step">
                <div className="step-num s2">02</div>
                <div className="step-title">Find real listings</div>
                <div className="step-desc">
                  Each product links to actual Mercari JP listings. See prices, conditions, photos. Real inventory, not estimates.
                </div>
              </div>
              <div className="how-step">
                <div className="step-num s3">03</div>
                <div className="step-title">Compare the true cost</div>
                <div className="step-desc">
                  Proxy fees, international shipping, customs. All estimated upfront. The landed price, not the listing price.
                </div>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <WaitlistForm />

          <hr className="divider" />
        </>
      )}

      {/* Footer — always visible */}
      <footer>
        <div>
          <span className="footer-brand">majikari マジカリ</span> · real prices from Japan
        </div>
      </footer>
    </>
  )
}
