'use client'

import { useState, FormEvent } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleWaitlist(e: FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage("You're on the list. We'll be in touch.")
        setEmail('')
      } else {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again.')
    }
  }

  return (
    <>
      <nav>
        <div className="nav-logo">majikari<span className="jp">マジカリ</span></div>
        <div className="nav-links">
          <a href="#">Search</a>
          <a href="#">Compare</a>
          <a href="#">Alerts</a>
        </div>
        <a className="nav-cta" href="#waitlist">Get Alerts</a>
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
          Price intelligence for Japanese collectibles. Track Mercari JP listings,
          compare proxy fees, see the real landed cost.
        </p>

        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search any figure, nendoroid, scale... (JP or EN)"
            readOnly
          />
        </div>

        <div className="stats-bar">
          <span className="stat-chip"><strong>16,302</strong> listings tracked</span>
          <span className="stat-chip"><strong>7,374</strong> products indexed</span>
          <span className="stat-chip">Updated <strong>2h ago</strong></span>
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
            <tr>
              <td className="proxy-name">Dejapan</td>
              <td className="fee">$2.60</td>
              <td className="fee">$22.00</td>
              <td className="total-cell">$50.60</td>
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
            <div className="step-title">Scrape Japan</div>
            <div className="step-desc">
              16K+ listings pulled from Mercari JP every 6 hours. Prices, conditions, photos. Raw data.
            </div>
          </div>
          <div className="how-step">
            <div className="step-num s2">02</div>
            <div className="step-title">Match products</div>
            <div className="step-desc">
              Listings get matched to a catalog of 7,374 known items. Every listing for the same figure, in one place.
            </div>
          </div>
          <div className="how-step">
            <div className="step-num s3">03</div>
            <div className="step-title">You see the real cost</div>
            <div className="step-desc">
              Proxy fees, international shipping, customs. All estimated upfront. The landed price, not the listing price.
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Waitlist */}
      <div className="waitlist" id="waitlist">
        <h2>Launching soon</h2>
        <p>Get notified when Majikari goes live. No spam.</p>
        <form className="waitlist-form" onSubmit={handleWaitlist}>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Joining...' : 'Notify Me'}
          </button>
        </form>
        {status === 'success' && <div className="waitlist-status success">{message}</div>}
        {status === 'error' && <div className="waitlist-status error">{message}</div>}
      </div>

      <hr className="divider" />

      <footer>
        <div>
          <span className="footer-brand">majikari マジカリ</span> · real prices from Japan
        </div>
        <div className="footer-links">
          <a href="#">GitHub</a>
          <a href="#">Twitter</a>
        </div>
      </footer>
    </>
  )
}
