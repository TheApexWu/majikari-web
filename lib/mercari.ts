/**
 * Mercari API Client
 * 
 * Handles on-demand item fetching from Mercari JP with DPoP authentication.
 * Cost calculation delegated to lib/proxy-costs.ts
 */

import * as crypto from 'crypto'
import { JPY_USD_RATE } from './constants'
import { calculateProxyCosts } from './proxy-costs'

// ── Types ──────────────────────────────────────────────────────

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

// ── Cache & Rate Limiting ──────────────────────────────────────

const cache = new Map<string, { item: MercariItem; ts: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

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

// ── DPoP JWT Generation ────────────────────────────────────────
// Mercari requires DPoP (Demonstrating Proof of Possession) tokens
// for API authentication. We generate ephemeral EC keys per request.

function base64url(buf: Buffer): string {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function generateDPoP(url: string, method: string = 'GET'): Promise<string> {
  // Ephemeral EC P-256 key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  })

  const pubJwk = publicKey.export({ format: 'jwk' }) as crypto.JsonWebKey

  const header = {
    alg: 'ES256',
    jwk: { crv: 'P-256', kty: 'EC', x: pubJwk.x, y: pubJwk.y },
    typ: 'dpop+jwt',
  }

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

  // Convert DER signature to raw r||s (64 bytes)
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

  return `${headerB64}.${payloadB64}.${base64url(rawSig)}`
}

// ── API Fetching ───────────────────────────────────────────────

export async function fetchMercariItem(itemId: string): Promise<MercariItem | null> {
  // Check cache first
  const cached = cache.get(itemId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.item
  }

  // Enforce rate limit
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded for live Mercari lookups')
    return null
  }

  try {
    const url = `https://api.mercari.jp/items/get?id=${itemId}`
    const dpop = await generateDPoP(url, 'GET')

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

    cache.set(itemId, { item, ts: Date.now() })
    return item
  } catch (err) {
    console.error(`Failed to fetch Mercari item ${itemId}:`, err)
    return null
  }
}

// ── Result Formatting ──────────────────────────────────────────

export function formatLiveResult(item: MercariItem) {
  const costs = calculateProxyCosts(item.price)
  const proxies = Object.values(costs.breakdown).sort((a, b) => a.total_jpy - b.total_jpy)

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    price_usd: Math.round((item.price / JPY_USD_RATE) * 100) / 100,
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
    _live: true,
    _status: item.status,
  }
}
