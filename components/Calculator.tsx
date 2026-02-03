'use client'

import { useState, FormEvent } from 'react'

const JPY_USD_RATE = 155
const EMS_SHIPPING = 2700

interface ProxyCost {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  total_jpy: number
  total_usd: number
}

interface CostBreakdown {
  proxy: string
  item_jpy: number
  fees_jpy: number
  shipping_jpy: number
  duty_jpy: number
  total_jpy: number
  total_usd: number
}

interface CostEstimates {
  cheapest_proxy: string
  cheapest_total_jpy: number
  cheapest_total_usd: number
  most_expensive_proxy: string
  most_expensive_total_jpy: number
  savings_jpy: number
  savings_usd: number
  breakdown: Record<string, CostBreakdown>
}

interface ItemResult {
  id: string
  name: string
  price: number
  price_usd: number
  image_url: string | null
  cost_estimates: CostEstimates
}

function calculateProxyCosts(priceJpy: number): ProxyCost[] {
  const proxies = [
    { proxy: 'Buyee', serviceFee: 500, fxRate: 0.035, paymentRate: 0.03 },
    { proxy: 'ZenMarket', serviceFee: 300, fxRate: 0.03, paymentRate: 0.035 },
    { proxy: 'FromJapan', serviceFee: 200, fxRate: 0.08, paymentRate: 0 },
    { proxy: 'Neokyo', serviceFee: 350, fxRate: 0, paymentRate: 0.029 },
  ]

  return proxies
    .map((p) => {
      const fees = p.serviceFee + Math.round(priceJpy * p.fxRate) + Math.round(priceJpy * p.paymentRate)
      const total = priceJpy + fees + EMS_SHIPPING
      return {
        proxy: p.proxy,
        item_jpy: priceJpy,
        fees_jpy: fees,
        shipping_jpy: EMS_SHIPPING,
        total_jpy: total,
        total_usd: Math.round((total / JPY_USD_RATE) * 100) / 100,
      }
    })
    .sort((a, b) => a.total_jpy - b.total_jpy)
}

export default function Calculator() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<ItemResult | null>(null)
  const [computedCosts, setComputedCosts] = useState<ProxyCost[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCalculate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    setComputedCosts(null)

    const match = url.match(/jp\.mercari\.com\/item\/(m\w+)/)
    if (!match) {
      setError('Please enter a valid Mercari JP URL (e.g. https://jp.mercari.com/item/m12345)')
      return
    }

    const itemId = match[1]
    setLoading(true)

    try {
      const res = await fetch('/data/items.json')
      const items: ItemResult[] = await res.json()
      const found = items.find((item) => item.id === itemId)

      if (!found) {
        setError(
          `Item ${itemId} is not in our database yet. We currently track ~5,000 listings — more are added regularly.`
        )
      } else {
        setResult(found)
        // Use pre-computed estimates if available, otherwise calculate client-side
        if (!found.cost_estimates) {
          setComputedCosts(calculateProxyCosts(found.price))
        }
      }
    } catch {
      setError('Failed to load item data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Build a unified cost display from either source
  const proxyCosts: ProxyCost[] | null = result
    ? computedCosts ||
      (result.cost_estimates
        ? Object.values(result.cost_estimates.breakdown)
            .map((b) => ({
              proxy: b.proxy,
              item_jpy: b.item_jpy,
              fees_jpy: b.fees_jpy,
              shipping_jpy: b.shipping_jpy,
              total_jpy: b.total_jpy,
              total_usd: b.total_usd,
            }))
            .sort((a, b) => a.total_jpy - b.total_jpy)
        : null)
    : null

  const cheapestProxy = proxyCosts?.[0]?.proxy
  const mostExpensiveProxy = proxyCosts?.[proxyCosts.length - 1]?.proxy
  const savingsJpy = proxyCosts
    ? (proxyCosts[proxyCosts.length - 1]?.total_jpy ?? 0) - (proxyCosts[0]?.total_jpy ?? 0)
    : 0
  const savingsUsd = proxyCosts
    ? Math.round((savingsJpy / JPY_USD_RATE) * 100) / 100
    : 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔍</span>
        <div>
          <h2 className="text-lg font-semibold">Savings Calculator</h2>
          <p className="text-sm text-zinc-500">
            Paste a Mercari JP link to see the true cost across proxy services
          </p>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://jp.mercari.com/item/m12345..."
          className="flex-1 px-4 py-3 rounded-lg bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Calculate'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      )}

      {result && proxyCosts && (
        <div className="mt-6 space-y-4">
          {/* Item info */}
          <div className="flex gap-4 items-start">
            {result.image_url && (
              <img
                src={result.image_url}
                alt={result.name}
                className="w-20 h-20 rounded-lg object-cover bg-zinc-800"
              />
            )}
            <div>
              <h3 className="font-medium text-white line-clamp-2">{result.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Item price: ¥{result.price.toLocaleString()} (${result.price_usd})
              </p>
            </div>
          </div>

          {/* Proxy breakdown */}
          <div className="grid sm:grid-cols-2 gap-3">
            {proxyCosts.map((proxy) => {
              const isCheapest = proxy.proxy === cheapestProxy
              return (
                <div
                  key={proxy.proxy}
                  className={`p-4 rounded-lg border ${
                    isCheapest
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-zinc-800 bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-semibold text-sm ${
                        isCheapest ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {proxy.proxy}
                      {isCheapest && ' ★'}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        isCheapest ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      ${proxy.total_usd}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-zinc-500">
                    <div className="flex justify-between">
                      <span>Item</span>
                      <span>¥{proxy.item_jpy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees</span>
                      <span>¥{proxy.fees_jpy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping (EMS)</span>
                      <span>¥{proxy.shipping_jpy.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-zinc-700 text-zinc-400">
                      <span>Total</span>
                      <span>¥{proxy.total_jpy.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Savings summary */}
          {savingsJpy > 0 && (
            <p className="text-sm text-zinc-400">
              Choosing{' '}
              <span className="text-emerald-400 font-medium">{cheapestProxy}</span> saves you{' '}
              <span className="text-emerald-400 font-medium">
                ¥{savingsJpy.toLocaleString()} (${savingsUsd})
              </span>{' '}
              vs {mostExpensiveProxy}.
            </p>
          )}
        </div>
      )}

      {!result && !error && (
        <p className="mt-4 text-xs text-zinc-600">
          Compares total cost across Buyee, ZenMarket, FromJapan, and Neokyo
        </p>
      )}
    </div>
  )
}
