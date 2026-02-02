'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <>
      <nav>
        <div className="nav-logo">
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            majikari<span className="jp">マジカリ</span>
          </a>
        </div>
        <div className="nav-links">
          <a href="/products">Products</a>
          <a href="/discover">Listings</a>
        </div>
      </nav>

      <div className="hero">
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

        <form onSubmit={handleSearch} className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Try: Blue Archive, ねんどろいど, chainsaw man, marisa fumo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="stats-bar">
          <span className="stat-chip"><strong>5,033</strong> listings tracked</span>
          <span className="stat-chip"><strong>7,374</strong> products indexed</span>
          <span className="stat-chip"><strong>6,453</strong> JP names mapped</span>
        </div>

        {/* Quick search pills */}
        <div className="stats-bar" style={{ marginTop: '0.5rem' }}>
          <a href="/products?q=Blue+Archive" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>Blue Archive</a>
          <a href="/products?q=Miku" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>Miku</a>
          <a href="/products?q=chainsaw+man" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>Chainsaw Man</a>
          <a href="/products?q=Fate" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>Fate</a>
          <a href="/products?q=ねんどろいど" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>ねんどろいど</a>
          <a href="/products?q=touhou" className="stat-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>Touhou</a>
        </div>
      </div>

      <hr className="divider" />

      {/* Cost Comparison Demo */}
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

      {/* How It Works */}
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

      {/* URL Lookup Feature */}
      <div className="how-section">
        <div className="how-header">
          <h2>Paste a Mercari URL, get the real price</h2>
          <p>Found something on Mercari JP? Paste the link and see what it&apos;ll actually cost you through every proxy service.</p>
        </div>
      </div>

      <hr className="divider" />

      <footer>
        <div>
          <span className="footer-brand">majikari マジカリ</span> · real prices from Japan
        </div>
        <div className="footer-links">
          <a href="/products">Products</a>
          <a href="/discover">Listings</a>
        </div>
      </footer>
    </>
  )
}
