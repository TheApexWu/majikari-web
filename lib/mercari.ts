/**
 * On-demand Mercari item fetching + proxy cost calculation.
 * 
 * When a user pastes a URL not in our DB, we fetch it live from
 * Mercari's web page and calculate proxy costs on the fly.
 */

// ── Proxy service fee structures (ported from build_web_data.py) ──

const JPY_USD_RATE = 155.0

const PROXY_SERVICES: Record<string, {
  name: string
  serviceFee: number
  fxMarkup: number
  paymentFee: number
}> = {
  buyee:      { name: 'Buyee',      serviceFee: 500, fxMarkup: 0.035, paymentFee: 0.03  },
  zenmarket:  { name: 'ZenMarket',  serviceFee: 300, fxMarkup: 0.03,  paymentFee: 0.035 },
  fromjapan:  { name: 'FromJapan',  serviceFee: 200, fxMarkup: 0.08,  paymentFee: 0.0   },
  neokyo:     { name: 'Neokyo',     serviceFee: 350, fxMarkup: 0.0,   paymentFee: 0.029 },
}

// EMS shipping by weight tier (JPY)
const EMS_SHIPPING: [number, number][] = [
  [0.5, 2000], [1.0, 2900], [1.5, 3700], [2.0, 4500], [3.0, 5900], [5.0, 8700],
]

const DOMESTIC_SHIPPING = 700

function estimateShipping(weightKg: number): number {
  for (const [tierKg, cost] of EMS_SHIPPING) {
    if (weightKg <= tierKg) return cost
  }
  return 10500
}

export function calculateProxyCosts(priceJpy: number, weightKg: number = 0.8) {
  const shipping = estimateShipping(weightKg)
  const breakdown: Record<string, {
    proxy: string
    item_jpy: number
    fees_jpy: number
    shipping_jpy: number
    duty_jpy: number
    total_jpy: number
    total_usd: number
  }> = {}

  let cheapestProxy = ''
  let cheapestTotal = Infinity
  let mostExpensiveProxy = ''
  let mostExpensiveTotal = 0

  for (const [key, proxy] of Object.entries(PROXY_SERVICES)) {
    const subtotal = priceJpy + DOMESTIC_SHIPPING
    const service = proxy.serviceFee
    const fx = Math.round(subtotal * proxy.fxMarkup)
    const payment = Math.round(subtotal * proxy.paymentFee)
    let totalJpy = subtotal + service + fx + payment + shipping

    // US customs: $800 de minimis
    const totalUsdPreDuty = totalJpy / JPY_USD_RATE
    let duty = 0
    if (totalUsdPreDuty > 800) {
      duty = Math.round((totalUsdPreDuty - 800) * 0.045 * JPY_USD_RATE)
      totalJpy += duty
    }

    breakdown[key] = {
      proxy: proxy.name,
      item_jpy: priceJpy,
      fees_jpy: service + fx + payment,
      shipping_jpy: shipping + DOMESTIC_SHIPPING,
      duty_jpy: duty,
      total_jpy: totalJpy,
      total_usd: Math.round(totalJpy / JPY_USD_RATE * 100) / 100,
    }

    if (totalJpy < cheapestTotal) {
      cheapestTotal = totalJpy
      cheapestProxy = proxy.name
    }
    if (totalJpy > mostExpensiveTotal) {
      mostExpensiveTotal = totalJpy
      mostExpensiveProxy = proxy.name
    }
  }

  return {
    cheapest_proxy: cheapestProxy,
    cheapest_total_jpy: cheapestTotal,
    cheapest_total_usd: Math.round(cheapestTotal / JPY_USD_RATE * 100) / 100,
    most_expensive_proxy: mostExpensiveProxy,
    most_expensive_total_jpy: mostExpensiveTotal,
    savings_jpy: mostExpensiveTotal - cheapestTotal,
    savings_usd: Math.round((mostExpensiveTotal - cheapestTotal) / JPY_USD_RATE * 100) / 100,
    breakdown,
  }
}

// ── Mercari API fetching (DPoP auth) ──

import * as crypto from 'crypto'

export interface MercariItem {
  id: string
  name: string
  price: number
  status: string
  description: string | null
  condition: string | null
  imageUrl: string | null
  imageUrls: string[]
  numLikes: number
  sellerId: string | null
  sellerName: string | null
  shippingPayer: string | null
}

// Simple in-memory cache (TTL: 1 hour)
const cache = new Map<string, { item: MercariItem; ts: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000

// Rate limit: max 10 live lookups per minute
const rateLimitWindow = new Map<string, number[]>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000

function checkRateLimit(): boolean {
  const key = 'global'
  const now = Date.now()
  const timestamps = rateLimitWindow.get(key) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitWindow.set(key, recent)
  return true
}

// ── DPoP JWT generation for Mercari API ──

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateDPoP(url: string, method: string = 'GET'): Promise<string> {
  // Generate ephemeral EC P-256 key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  })

  // Export public key components for JWK
  const pubJwk = publicKey.export({ format: 'jwk' }) as crypto.JsonWebKey

  // Build JWT header
  const header = {
    alg: 'ES256',
    jwk: {
      crv: 'P-256',
      kty: 'EC',
      x: pubJwk.x,
      y: pubJwk.y,
    },
    typ: 'dpop+jwt',
  }

  // Build JWT payload
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    htu: url,
    htm: method,
    uuid: crypto.randomUUID(),
  }

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)))
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  // Sign with ES256
  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  const derSig = sign.sign(privateKey)

  // Convert DER signature to raw r||s format (64 bytes)
  // DER: 0x30 len 0x02 rLen r 0x02 sLen s
  let offset = 3
  const rLen = derSig[offset]
  offset += 1
  let r = derSig.subarray(offset, offset + rLen)
  offset += rLen + 1
  const sLen = derSig[offset]
  offset += 1
  let s = derSig.subarray(offset, offset + sLen)

  // Pad/trim to 32 bytes each
  if (r.length > 32) r = r.subarray(r.length - 32)
  if (s.length > 32) s = s.subarray(s.length - 32)
  const rawSig = Buffer.concat([
    Buffer.alloc(32 - r.length), r,
    Buffer.alloc(32 - s.length), s,
  ])

  const sigB64 = base64url(rawSig)
  return `${headerB64}.${payloadB64}.${sigB64}`
}

export async function fetchMercariItem(itemId: string): Promise<MercariItem | null> {
  // Check cache
  const cached = cache.get(itemId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.item
  }

  // Rate limit
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded for live Mercari lookups')
    return null
  }

  try {
    const url = `https://api.mercari.jp/items/get?id=${itemId}`
    const dpop = await generateDPoP(url, 'GET')

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.3',
        'x-platform': 'web',
        'dpop': dpop,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!resp.ok) {
      console.error(`Mercari API returned ${resp.status} for ${itemId}`)
      return null
    }

    const body = await resp.json()
    const data = body?.data
    if (!data) return null

    const item: MercariItem = {
      id: itemId,
      name: data.name || '',
      price: data.price || 0,
      status: data.status || 'unknown',
      description: data.description || null,
      condition: data.itemCondition?.name || data.item_condition?.name || null,
      imageUrl: data.thumbnails?.[0] || null,
      imageUrls: data.thumbnails || data.photos || [],
      numLikes: data.num_likes || 0,
      sellerId: data.seller?.id || null,
      sellerName: data.seller?.name || null,
      shippingPayer: data.shipping_payer?.name || null,
    }

    // Cache it
    cache.set(itemId, { item, ts: Date.now() })

    return item
  } catch (err) {
    console.error(`Failed to fetch Mercari item ${itemId}:`, err)
    return null
  }
}

export function formatLiveResult(item: MercariItem) {
  const costs = calculateProxyCosts(item.price)
  const proxies = Object.values(costs.breakdown).sort((a, b) => a.total_jpy - b.total_jpy)

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    price_usd: Math.round(item.price / JPY_USD_RATE * 100) / 100,
    image_url: item.imageUrl,
    url: `https://jp.mercari.com/item/${item.id}`,
    category: null,
    franchise: null,
    condition: item.condition,
    trust_risk: item.price < 500 ? 'high' : 'low',
    cheapest_proxy: costs.cheapest_proxy,
    cheapest_total_usd: costs.cheapest_total_usd,
    most_expensive_proxy: costs.most_expensive_proxy,
    most_expensive_total_usd: costs.most_expensive_total_jpy / JPY_USD_RATE,
    savings_jpy: costs.savings_jpy,
    savings_usd: costs.savings_usd,
    proxies,
    _live: true, // flag that this was fetched on-demand
    _status: item.status,
  }
}
