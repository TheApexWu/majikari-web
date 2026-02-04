'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface FieldCoverage {
  filled: number
  total: number
  pct: number
}

interface Metrics {
  timestamp: string
  catalog: {
    total_products: number
    by_category: Record<string, number>
    by_manufacturer: Record<string, number>
    top_series: Record<string, number>
    jp_name_coverage: number
  }
  listings: {
    total: number
    by_category: Record<string, number>
    uncategorized: number
    price_min: number
    price_avg: number
    price_max: number
    price_median: number
    by_price_tier: Record<string, number>
  }
  search_index: {
    total: number
    field_coverage: Record<string, FieldCoverage>
  }
  matching: {
    products_with_listings: number
    total_matched_listings: number
    match_rate: number
  }
  data_freshness: Record<string, { exists: boolean; size_bytes: number; age_seconds: number }>
  issues: string[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatAge(seconds: number): string {
  if (seconds < 0) return '—'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function HealthDot({ value, good, warn }: { value: number; good: number; warn: number }) {
  const color = value >= good ? '#22c55e' : value >= warn ? '#eab308' : '#ef4444'
  return <span style={{ color, fontSize: '10px', marginRight: '6px' }}>●</span>
}

function Bar({ pct, color = 'var(--accent)' }: { pct: number; color?: string }) {
  return (
    <div style={{ background: 'var(--surface-alt)', borderRadius: '2px', height: '8px', width: '100%', overflow: 'hidden' }}>
      <div style={{ background: color, height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: '2px', transition: 'width 0.5s ease' }} />
    </div>
  )
}

function HBar({ items, max }: { items: [string, number][]; max: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map(([label, count]) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 50px', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <Bar pct={(count / max) * 100} color="var(--cyan)" />
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, status }: { label: string; value: string | number; sub?: string; status?: 'good' | 'warn' | 'bad' }) {
  const borderColor = status === 'good' ? '#22c55e' : status === 'warn' ? '#eab308' : status === 'bad' ? '#ef4444' : 'var(--border)'
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${borderColor}`, borderRadius: '6px',
      padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px',
      borderTopWidth: status ? '3px' : '1px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/metrics')
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setMetrics(data)
      setLastRefresh(new Date())
      setError('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // refresh every 60s
    return () => clearInterval(interval)
  }, [fetchMetrics])

  if (loading && !metrics) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '80px 0' }}>
          Loading metrics...
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', color: '#ef4444', padding: '80px 0' }}>
          Failed to load metrics: {error}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const m = metrics
  const maxCat = Math.max(...Object.values(m.catalog.by_category))
  const maxMfr = Math.max(...Object.values(m.catalog.by_manufacturer))
  const maxListCat = Math.max(...Object.values(m.listings.by_category))
  const maxPriceTier = Math.max(...Object.values(m.listings.by_price_tier))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Majikari Operations
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {lastRefresh ? `Updated ${formatAge(Math.floor((Date.now() - lastRefresh.getTime()) / 1000))}` : ''}
            {' · '}Auto-refreshes every 60s
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchMetrics} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            {loading ? '↻' : '⟳'} Refresh
          </button>
          <Link href="/" style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px',
            padding: '6px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', color: 'inherit',
          }}>
            ← Back
          </Link>
        </div>
      </div>

      {/* Issues banner */}
      {m.issues.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
          padding: '14px 18px', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {m.issues.length} Issue{m.issues.length > 1 ? 's' : ''} Detected
          </div>
          {m.issues.map((issue, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#7f1d1d', padding: '2px 0' }}>• {issue}</div>
          ))}
        </div>
      )}

      {/* Top-level stats */}
      <Section title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <StatCard label="Products" value={m.catalog.total_products} sub="canonical catalog" status={m.catalog.total_products >= 10000 ? 'good' : m.catalog.total_products >= 5000 ? 'warn' : 'bad'} />
          <StatCard label="Listings" value={m.listings.total} sub="Mercari JP indexed" status={m.listings.total >= 40000 ? 'good' : 'warn'} />
          <StatCard label="Match Rate" value={`${m.matching.match_rate}%`} sub={`${m.matching.total_matched_listings.toLocaleString()} matched`} status={m.matching.match_rate >= 40 ? 'good' : m.matching.match_rate >= 20 ? 'warn' : 'bad'} />
          <StatCard label="Products w/ Listings" value={m.matching.products_with_listings} sub={`of ${m.catalog.total_products}`} />
          <StatCard label="JP Coverage" value={`${Math.round(m.catalog.jp_name_coverage * 100)}%`} sub="products with JP names" status={m.catalog.jp_name_coverage >= 0.9 ? 'good' : 'warn'} />
          <StatCard label="Median Price" value={`¥${m.listings.price_median.toLocaleString()}`} sub={`avg ¥${m.listings.price_avg.toLocaleString()}`} />
        </div>
      </Section>

      {/* Search Index Quality */}
      <Section title="Search Index Quality">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(m.search_index.field_coverage).map(([field, cov]) => (
            <div key={field} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{field}</span>
              <Bar pct={cov.pct} color={cov.pct >= 70 ? '#22c55e' : cov.pct >= 30 ? '#eab308' : '#ef4444'} />
              <span style={{ fontSize: '13px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: cov.pct >= 70 ? '#22c55e' : cov.pct >= 30 ? '#eab308' : '#ef4444', fontWeight: 700 }}>
                {cov.pct}%
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Two columns: Catalog & Listings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Section title="Product Catalog">
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>By Category</div>
            <HBar items={Object.entries(m.catalog.by_category).slice(0, 10)} max={maxCat} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>By Manufacturer</div>
            <HBar items={Object.entries(m.catalog.by_manufacturer).slice(0, 8)} max={maxMfr} />
          </div>
        </Section>

        <Section title="Listings Breakdown">
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>By Category (inferred)</div>
            <HBar items={Object.entries(m.listings.by_category).slice(0, 10)} max={maxListCat} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>By Price Tier</div>
            <HBar items={Object.entries(m.listings.by_price_tier)} max={maxPriceTier} />
          </div>
        </Section>
      </div>

      {/* Data Files */}
      <Section title="Data Files">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>File</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Size</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(m.data_freshness).map(([name, info]) => (
                <tr key={name} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '12px' }}>{name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ color: info.exists ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '11px' }}>
                      {info.exists ? '✓ OK' : '✗ MISSING'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {info.exists ? formatBytes(info.size_bytes) : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {info.exists ? formatAge(info.age_seconds) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Top Series */}
      <Section title="Top Series (Product Catalog)">
        <HBar items={Object.entries(m.catalog.top_series).slice(0, 15)} max={Math.max(...Object.values(m.catalog.top_series))} />
      </Section>

      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
        Majikari Operations Dashboard · {m.timestamp}
      </div>
    </div>
  )
}
