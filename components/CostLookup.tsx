'use client'

import { useState, useCallback } from 'react'

interface ProxyCost {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  duty_jpy: number
  total_jpy: number
  total_usd: number
}

interface LookupResult {
  id: string
  name: string
  price: number
  price_usd: number
  image_url: string | null
  url: string
  category: string
  franchise: string
  condition: string | null
  trust_risk: string
  cheapest_proxy: string
  cheapest_total_usd: number
  most_expensive_proxy: string
  most_expensive_total_usd: number
  savings_jpy: number
  savings_usd: number
  proxies: ProxyCost[]
}

type SearchState = 'idle' | 'loading' | 'results' | 'no-results' | 'error'

export default function CostLookup() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>('idle')
  const [results, setResults] = useState<LookupResult[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return

    setState('loading')
    setError('')

    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`)
      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setError(data.error || 'Something went wrong')
        return
      }

      if (data.results.length === 0) {
        setState('no-results')
      } else {
        setState('results')
        setResults(data.results)
        setExpanded(data.results[0]?.id ?? null)
      }
    } catch {
      setState('error')
      setError('Network error — try again')
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const fmt = (n: number) => `¥${n.toLocaleString()}`
  const fmtUsd = (n: number) => `$${n.toFixed(2)}`

  return (
    <div>
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste Mercari link or search (e.g. ねんどろいど Miku, Fate figma)"
          className="flex-1 px-4 py-3.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none transition-colors text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={state === 'loading' || !query.trim()}
          className="px-6 py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
        >
          {state === 'loading' ? 'Searching...' : 'Calculate'}
        </button>
      </div>

      <p className="mt-2 text-[11px] text-zinc-600">
        Compares Buyee, ZenMarket, FromJapan, and Neokyo — shows total landed cost to the US
      </p>

      {/* Results */}
      {state === 'no-results' && (
        <div className="mt-8 text-center py-10 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400">No listings found for "{query}"</p>
          <p className="mt-1 text-xs text-zinc-600">Try a different search or paste a direct Mercari link</p>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-8 text-center py-10 border border-red-900/50 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {state === 'results' && (
        <div className="mt-6 space-y-3">
          <div className="text-xs text-zinc-500 mb-2">
            {results.length} listing{results.length !== 1 ? 's' : ''} found
          </div>

          {results.map((item) => {
            const isExpanded = expanded === item.id

            return (
              <div
                key={item.id}
                className="border border-zinc-800 rounded-xl overflow-hidden transition-colors hover:border-zinc-700"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  {/* Thumbnail */}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-zinc-800 shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{fmt(item.price)} ({fmtUsd(item.price_usd)})</span>
                      {item.franchise && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span>{item.franchise}</span>
                        </>
                      )}
                      {item.category && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span>{item.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side: the answer, not the question */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">
                      {fmtUsd(item.cheapest_total_usd)} total
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      via {item.cheapest_proxy} · all fees included
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded: full breakdown */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-900/50 p-4">
                    {/* Proxy comparison table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 text-[10px] text-zinc-600 uppercase tracking-wider pb-1 border-b border-zinc-800">
                        <span>Proxy</span>
                        <span className="text-right">Fees</span>
                        <span className="text-right">Shipping</span>
                        <span className="text-right">Duty</span>
                        <span className="text-right">Total</span>
                      </div>

                      {item.proxies
                        .sort((a, b) => a.total_jpy - b.total_jpy)
                        .map((proxy, i) => {
                          const isCheapest = i === 0
                          const textClass = isCheapest ? 'text-emerald-400' : 'text-zinc-400'

                          return (
                            <div key={proxy.proxy} className={`grid grid-cols-5 text-xs ${textClass}`}>
                              <span className="font-medium">
                                {proxy.proxy}
                                {isCheapest && ' ★'}
                              </span>
                              <span className="text-right font-mono">{fmt(proxy.fees_jpy)}</span>
                              <span className="text-right font-mono">{fmt(proxy.shipping_jpy)}</span>
                              <span className="text-right font-mono">{proxy.duty_jpy ? fmt(proxy.duty_jpy) : '—'}</span>
                              <span className="text-right font-mono font-medium">{fmtUsd(proxy.total_usd)}</span>
                            </div>
                          )
                        })}
                    </div>

                    {/* Confidence builder — not raw numbers, a verdict */}
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <div className="flex items-start gap-3 text-xs">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between text-zinc-500">
                            <span>Listed price</span>
                            <span className="font-mono">{fmt(item.price)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>+ Proxy fees ({item.cheapest_proxy})</span>
                            <span className="font-mono">
                              {fmt(item.proxies.sort((a: ProxyCost, b: ProxyCost) => a.total_jpy - b.total_jpy)[0]?.fees_jpy ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>+ Int'l shipping (EMS est.)</span>
                            <span className="font-mono">
                              {fmt(item.proxies[0]?.shipping_jpy ?? 0)}
                            </span>
                          </div>
                          {item.proxies[0]?.duty_jpy > 0 && (
                            <div className="flex justify-between text-zinc-500">
                              <span>+ US customs duty</span>
                              <span className="font-mono">{fmt(item.proxies[0].duty_jpy)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white font-medium pt-1 border-t border-zinc-800">
                            <span>You pay</span>
                            <span className="font-mono">{fmtUsd(item.cheapest_total_usd)}</span>
                          </div>
                        </div>
                      </div>

                      {/* The verdict — not a number, an opinion */}
                      <div className={`mt-3 p-2.5 rounded-lg text-xs ${
                        item.savings_jpy > 1000
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : item.savings_jpy > 300
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {item.savings_jpy > 1000
                          ? `💰 ${item.cheapest_proxy} saves you ${fmtUsd(item.savings_usd)} over ${item.most_expensive_proxy}. Worth comparing.`
                          : item.savings_jpy > 300
                            ? `Proxy costs are similar (${fmtUsd(item.savings_usd)} spread). Go with whichever you have an account with.`
                            : `Minimal difference between proxies. Pick whatever's convenient.`
                        }
                      </div>
                    </div>

                    {/* CTA — direct to cheapest proxy, not raw Mercari */}
                    <div className="mt-4 space-y-2">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                          View on Mercari JP →
                        </a>
                      )}
                      <p className="text-[10px] text-zinc-600 text-center">
                        Use {item.cheapest_proxy} as your proxy for the best rate on this item
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
