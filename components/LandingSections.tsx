/**
 * LandingSections — Marketing content shown on homepage before search
 * 
 * Contains: comparison table, how-it-works steps, waitlist form.
 * Extracted from page.tsx to keep the main component focused on search.
 */

'use client'

import { useState, FormEvent } from 'react'

// Inline WaitlistForm for landing page styling (matches existing CSS)
function LandingWaitlist() {
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

export default function LandingSections() {
  return (
    <>
      <hr className="divider" />

      {/* Cost Comparison Table */}
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

      {/* Waitlist */}
      <LandingWaitlist />

      <hr className="divider" />
    </>
  )
}
