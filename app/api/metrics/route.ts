/**
 * Metrics API — returns full system health data for the dashboard.
 * 
 * Reads from all available data files and computes metrics in real-time.
 * Protected by a simple secret (METRICS_SECRET env var) or open in dev.
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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
    field_coverage: Record<string, { filled: number; total: number; pct: number }>
  }
  matching: {
    products_with_listings: number
    total_matched_listings: number
    match_rate: number
  }
  data_freshness: Record<string, { exists: boolean; size_bytes: number; age_seconds: number }>
  issues: string[]
}

async function fileInfo(filePath: string): Promise<{ exists: boolean; size_bytes: number; age_seconds: number }> {
  try {
    const stat = await fs.stat(filePath)
    return {
      exists: true,
      size_bytes: stat.size,
      age_seconds: Math.floor((Date.now() - stat.mtimeMs) / 1000),
    }
  } catch {
    return { exists: false, size_bytes: 0, age_seconds: -1 }
  }
}

async function loadJson(filePath: string): Promise<any | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  // Simple auth check
  const secret = process.env.METRICS_SECRET
  if (secret) {
    const provided = request.nextUrl.searchParams.get('secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const dataDir = path.join(process.cwd(), 'data')
  const publicDataDir = path.join(process.cwd(), 'public', 'data')

  // Load data files
  const [products, searchItems, availability] = await Promise.all([
    loadJson(path.join(dataDir, 'goodsmile-products.json')),
    loadJson(path.join(publicDataDir, 'items-search.json')),
    loadJson(path.join(dataDir, 'availability.json')),
  ])

  const issues: string[] = []

  // ── Catalog metrics ──
  const catalog = {
    total_products: 0,
    by_category: {} as Record<string, number>,
    by_manufacturer: {} as Record<string, number>,
    top_series: {} as Record<string, number>,
    jp_name_coverage: 0,
  }

  if (products && Array.isArray(products)) {
    catalog.total_products = products.length
    let jpCount = 0
    for (const p of products) {
      const cat = p.category || 'Unknown'
      catalog.by_category[cat] = (catalog.by_category[cat] || 0) + 1
      const mfr = p.manufacturer || 'Unknown'
      catalog.by_manufacturer[mfr] = (catalog.by_manufacturer[mfr] || 0) + 1
      const series = p.series || 'Unknown'
      catalog.top_series[series] = (catalog.top_series[series] || 0) + 1
      if (p.name_jp) jpCount++
    }
    catalog.jp_name_coverage = products.length > 0 ? jpCount / products.length : 0

    // Trim to top entries
    catalog.by_category = topN(catalog.by_category, 12)
    catalog.by_manufacturer = topN(catalog.by_manufacturer, 10)
    catalog.top_series = topN(catalog.top_series, 15)
  }

  // ── Listings / search index metrics ──
  const listings = {
    total: 0,
    by_category: {} as Record<string, number>,
    uncategorized: 0,
    price_min: 0,
    price_avg: 0,
    price_max: 0,
    price_median: 0,
    by_price_tier: {} as Record<string, number>,
  }

  const search_index = {
    total: 0,
    field_coverage: {} as Record<string, { filled: number; total: number; pct: number }>,
  }

  if (searchItems && Array.isArray(searchItems)) {
    const items = searchItems as any[]
    search_index.total = items.length
    listings.total = items.length

    // Field coverage
    const fields = { franchise: 'f', category: 'c', condition: 'co', keyword: 'k', image: 'i' }
    for (const [name, key] of Object.entries(fields)) {
      const filled = items.filter(i => i[key] != null && i[key] !== '').length
      search_index.field_coverage[name] = {
        filled,
        total: items.length,
        pct: items.length > 0 ? Math.round(filled / items.length * 100) : 0,
      }
    }

    // Category breakdown from keyword field (since category is null)
    const catCounts: Record<string, number> = {}
    for (const item of items) {
      // Try to infer category from keyword or name
      const text = ((item.k || '') + ' ' + (item.n || '')).toLowerCase()
      let cat = item.c || null
      if (!cat) {
        if (text.includes('ねんどろいど') || text.includes('nendoroid')) cat = 'Nendoroid'
        else if (text.includes('figma') || text.includes('フィグマ')) cat = 'figma'
        else if (text.includes('スケール') || text.includes('scale') || text.includes('1/7') || text.includes('1/8')) cat = 'Scale Figure'
        else if (text.includes('ポップアップパレード') || text.includes('pop up parade')) cat = 'POP UP PARADE'
        else if (text.includes('プライズ') || text.includes('一番くじ')) cat = 'Prize Figure'
        else if (text.includes('フィギュア') || text.includes('figure')) cat = 'Figure (other)'
        else if (text.includes('ぬいぐるみ') || text.includes('plush')) cat = 'Plush'
        else if (text.includes('アクリル') || text.includes('アクスタ')) cat = 'Acrylic Stand'
        else if (text.includes('キーホルダー') || text.includes('ストラップ')) cat = 'Keychain/Strap'
        else if (text.includes('缶バッジ') || text.includes('バッジ')) cat = 'Badge'
        else if (text.includes('カード') || text.includes('ブロマイド')) cat = 'Card'
        else if (text.includes('ポスター') || text.includes('タペストリー')) cat = 'Poster/Tapestry'
        else if (text.includes('プラモデル') || text.includes('ガンプラ')) cat = 'Model Kit'
        else cat = 'Other'
      }
      catCounts[cat] = (catCounts[cat] || 0) + 1
    }
    listings.by_category = topN(catCounts, 15)
    listings.uncategorized = catCounts['Other'] || 0

    // Price analysis
    const prices = items.map(i => i.p).filter((p: number) => p > 0 && p < 500000).sort((a: number, b: number) => a - b)
    if (prices.length > 0) {
      listings.price_min = prices[0]
      listings.price_max = prices[prices.length - 1]
      listings.price_avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
      listings.price_median = prices[Math.floor(prices.length / 2)]
    }

    // Price tiers
    const tiers: Record<string, number> = {
      'Under ¥1,000': 0,
      '¥1,000–¥3,000': 0,
      '¥3,000–¥5,000': 0,
      '¥5,000–¥10,000': 0,
      '¥10,000–¥30,000': 0,
      '¥30,000–¥50,000': 0,
      '¥50,000+': 0,
    }
    for (const p of prices) {
      if (p < 1000) tiers['Under ¥1,000']++
      else if (p < 3000) tiers['¥1,000–¥3,000']++
      else if (p < 5000) tiers['¥3,000–¥5,000']++
      else if (p < 10000) tiers['¥5,000–¥10,000']++
      else if (p < 30000) tiers['¥10,000–¥30,000']++
      else if (p < 50000) tiers['¥30,000–¥50,000']++
      else tiers['¥50,000+']++
    }
    listings.by_price_tier = tiers
  }

  // ── Matching metrics ──
  const matching = {
    products_with_listings: 0,
    total_matched_listings: 0,
    match_rate: 0,
  }

  if (availability) {
    const avail = availability as Record<string, number>
    matching.products_with_listings = Object.keys(avail).length
    matching.total_matched_listings = Object.values(avail).reduce((a, b) => a + b, 0)
    matching.match_rate = listings.total > 0
      ? Math.round(matching.total_matched_listings / listings.total * 100)
      : 0
  }

  // ── Data freshness ──
  const filePaths: Record<string, string> = {
    'goodsmile-products.json': path.join(dataDir, 'goodsmile-products.json'),
    'availability.json': path.join(dataDir, 'availability.json'),
    'items-search.json': path.join(publicDataDir, 'items-search.json'),
    'items.json': path.join(publicDataDir, 'items.json'),
  }

  const data_freshness: Record<string, any> = {}
  for (const [name, fp] of Object.entries(filePaths)) {
    data_freshness[name] = await fileInfo(fp)
  }

  // ── Issues detection ──
  if (search_index.field_coverage.franchise?.pct === 0) {
    issues.push('Franchise field 0% populated — EN franchise search degraded')
  }
  if (search_index.field_coverage.category?.pct === 0) {
    issues.push('Category field 0% populated — category filtering broken')
  }
  if (search_index.field_coverage.condition?.pct === 0) {
    issues.push('Condition field 0% populated — condition display missing')
  }
  if (catalog.total_products < 10000) {
    issues.push(`Only ${catalog.total_products} products in catalog — add Kotobukiya, Bandai etc.`)
  }
  if (matching.match_rate < 30) {
    issues.push(`Match rate ${matching.match_rate}% — most listings unmatched to products`)
  }

  const metrics: Metrics = {
    timestamp: new Date().toISOString(),
    catalog,
    listings,
    search_index,
    matching,
    data_freshness,
    issues,
  }

  return NextResponse.json(metrics)
}

function topN(obj: Record<string, number>, n: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
  )
}
