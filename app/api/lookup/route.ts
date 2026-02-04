import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { fetchMercariItem, formatLiveResult, calculateProxyCosts } from '@/lib/mercari'
import { expandQuery, normalizeQuery } from '@/lib/search'

// Slim search index: compact keys to save memory
interface SearchItem {
  id: string
  u: string     // url
  n: string     // name
  p: number     // price JPY
  pu: number    // price USD
  i: string | null  // image_url
  c: string | null   // category
  k?: string    // keyword
  f: string     // franchise
  fj?: string   // franchise_jp
  co: string | null  // condition
  q: number     // quality_score
  tr: string    // trust risk
  cp: string    // cheapest proxy
  ct: number    // cheapest total USD
  sv: number    // savings USD
}

let itemsCache: SearchItem[] | null = null

async function getItems(): Promise<SearchItem[]> {
  if (itemsCache) return itemsCache
  const filePath = path.join(process.cwd(), 'public', 'data', 'items-search.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  itemsCache = JSON.parse(raw) as SearchItem[]
  return itemsCache
}

function extractMercariId(input: string): string | null {
  const urlMatch = input.match(/jp\.mercari\.com\/item\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]
  if (/^m\d{8,}$/.test(input)) return input
  return null
}

// ── Product-type detection for search ranking ──
const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  'nendoroid':     ['ねんどろいど', 'nendoroid', 'ネンドロイド'],
  'figma':         ['figma', 'フィグマ'],
  'pop up parade': ['pop up parade', 'ポップアップパレード'],
  'scale':         ['スケール', '1/7', '1/8', '1/4', '1/6', 'scale'],
  'figure':        ['フィギュア', 'figure', 'fig'],
  'prize':         ['プライズ', '一番くじ', 'ichiban kuji'],
}

const MERCH_KEYWORDS = [
  'アクリルスタンド', 'アクスタ', 'アクリルキーホルダー', 'アクキー',
  'キーホルダー', 'ストラップ', '缶バッジ', 'ピンバッジ',
  'tシャツ', 'パーカー', 'タオル', 'ブランケット',
  'ぬいぐるみ', 'マスコット', 'クッション',
  'ポスター', 'タペストリー', 'クリアファイル',
  'カード', 'ブロマイド', 'ステッカー', 'シール',
  'マグカップ', 'コースター', 'ラバーストラップ', 'ラバスト',
]

function detectQueryProductType(query: string): string | null {
  const q = query.toLowerCase()
  for (const [type, variants] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    for (const v of variants) {
      if (q.includes(v.toLowerCase())) return type
    }
  }
  return null
}

function itemMatchesProductType(name: string, type: string): boolean {
  const nameLower = name.toLowerCase()
  const variants = PRODUCT_TYPE_KEYWORDS[type]
  if (!variants) return false
  return variants.some(v => nameLower.includes(v.toLowerCase()))
}

function itemIsMerch(name: string): boolean {
  const nameLower = name.toLowerCase()
  return MERCH_KEYWORDS.some(kw => nameLower.includes(kw.toLowerCase()))
}

function searchItems(items: SearchItem[], query: string, limit: number = 20): SearchItem[] {
  const q = normalizeQuery(query)
  const words = q.split(/\s+/).filter(Boolean)
  const queryType = detectQueryProductType(q)

  // Expand query with franchise aliases
  const expandedQueries = expandQuery(q)
  const expandedWordsSet = new Set<string>()
  for (const eq of expandedQueries) {
    for (const w of eq.toLowerCase().split(/\s+/)) {
      expandedWordsSet.add(w)
    }
  }
  const expandedWords = Array.from(expandedWordsSet)

  const typeWords = new Set<string>()
  if (queryType) {
    const variants = PRODUCT_TYPE_KEYWORDS[queryType] || []
    for (const v of variants) typeWords.add(v.toLowerCase())
    typeWords.add(queryType)
  }
  const contentWords = words.filter(w => !typeWords.has(w))

  const scored = items
    .map(item => {
      let relevance = 0
      const name = item.n.toLowerCase()
      const keyword = (item.k || '').toLowerCase()
      const franchise = (item.f || '').toLowerCase()
      const franchiseJp = (item.fj || '').toLowerCase()

      // Check original query
      if (name.includes(q)) relevance += 10
      if (franchise.includes(q)) relevance += 8
      if (franchiseJp.includes(q)) relevance += 8

      // Check expanded queries (aliases)
      for (const eq of expandedQueries) {
        const eql = eq.toLowerCase()
        if (eql === q) continue // skip original, already checked
        if (name.includes(eql)) relevance += 9
        if (keyword.includes(eql)) relevance += 7
        if (franchise.includes(eql)) relevance += 7
        if (franchiseJp.includes(eql)) relevance += 7
      }

      // Word-level matching with expanded vocabulary
      for (const w of contentWords.length > 0 ? contentWords : words) {
        if (name.includes(w)) relevance += 3
        if (franchise.includes(w)) relevance += 2
        if (franchiseJp.includes(w)) relevance += 2
        if (keyword.includes(w)) relevance += 1
      }

      // Also check expanded alias words
      for (const w of expandedWords) {
        if (w.length < 2) continue  // skip tiny words
        if (words.includes(w)) continue  // skip already-checked original words
        if (name.includes(w)) relevance += 2
        if (keyword.includes(w)) relevance += 2
      }

      if (queryType) {
        if (itemMatchesProductType(item.n, queryType)) {
          relevance += 15
        } else if (itemIsMerch(item.n)) {
          relevance -= 8
        } else {
          relevance -= 2
        }
      }

      const quality = item.q ?? 50
      const finalScore = relevance * 100 + quality

      return { item, relevance, finalScore }
    })
    .filter(s => s.relevance > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)

  return scored.map(s => s.item)
}

function formatResult(item: SearchItem) {
  // Compute full proxy breakdown on demand (only for returned results)
  const costs = calculateProxyCosts(item.p)
  const proxies = Object.values(costs.breakdown).sort((a, b) => a.total_jpy - b.total_jpy)

  return {
    id: item.id,
    name: item.n,
    price: item.p,
    price_usd: item.pu,
    image_url: item.i,
    url: item.u,
    category: item.c,
    franchise: item.f,
    condition: item.co,
    trust_risk: item.tr,
    cheapest_proxy: costs.cheapest_proxy,
    cheapest_total_usd: costs.cheapest_total_usd,
    most_expensive_proxy: costs.most_expensive_proxy,
    most_expensive_total_usd: costs.most_expensive_total_jpy / 155,
    savings_jpy: costs.savings_jpy,
    savings_usd: costs.savings_usd,
    proxies,
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
  }

  const items = await getItems()

  // Check if it's a Mercari URL/ID
  const mercariId = extractMercariId(q)
  if (mercariId) {
    // Check local DB first
    const exact = items.find(i => i.id === mercariId)
    if (exact) {
      return NextResponse.json({ results: [formatResult(exact)] })
    }

    // Live fetch fallback
    try {
      const liveItem = await fetchMercariItem(mercariId)
      if (liveItem) {
        return NextResponse.json({
          results: [formatLiveResult(liveItem)],
          source: 'live',
          note: 'This listing was fetched live from Mercari. Cost estimates are calculated on the fly.',
        })
      }
    } catch (err) {
      console.error('Live fetch failed:', err)
    }

    return NextResponse.json({
      results: [],
      note: 'Could not find this listing. It may have been sold or removed.',
    })
  }

  // Text search
  const matches = searchItems(items, q)
  return NextResponse.json({
    results: matches.map(formatResult),
  })
}
