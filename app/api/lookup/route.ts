import { NextRequest, NextResponse } from 'next/server'

interface RawItem {
  id: string
  url: string
  name: string
  price: number
  price_usd: number
  image_url: string | null
  category_source: string
  franchise: string
  franchise_jp?: string
  condition: string | null
  trust: { score: number; risk: string; flags: string[] }
  cost_estimates: {
    cheapest_proxy: string
    cheapest_total_jpy: number
    cheapest_total_usd: number
    most_expensive_proxy: string
    most_expensive_total_jpy: number
    savings_jpy: number
    savings_usd: number
    breakdown: Record<string, {
      proxy: string
      item_jpy: number
      fees_jpy: number
      shipping_jpy: number
      duty_jpy: number
      total_jpy: number
      total_usd: number
    }>
  }
}

let itemsCache: RawItem[] | null = null

async function getItems(): Promise<RawItem[]> {
  if (itemsCache) return itemsCache
  itemsCache = (await import('@/data/items.json')).default as RawItem[]
  return itemsCache
}

function extractMercariId(input: string): string | null {
  // Match mercari URLs: jp.mercari.com/item/XXXXX
  const urlMatch = input.match(/jp\.mercari\.com\/item\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]

  // Match bare Mercari IDs
  if (/^m\d{8,}$/.test(input)) return input

  return null
}

// ── Product-type detection for search ranking ──
// Maps search keywords to their JP/EN variants for matching in listing names
const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  'nendoroid':     ['ねんどろいど', 'nendoroid', 'ネンドロイド'],
  'figma':         ['figma', 'フィグマ'],
  'pop up parade': ['pop up parade', 'ポップアップパレード'],
  'scale':         ['スケール', '1/7', '1/8', '1/4', '1/6', 'scale'],
  'figure':        ['フィギュア', 'figure', 'fig'],
  'prize':         ['プライズ', '一番くじ', 'ichiban kuji'],
}

// Keywords indicating non-figure merch (penalize when user wants figures)
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

function searchItems(items: RawItem[], query: string, limit: number = 20): RawItem[] {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const queryType = detectQueryProductType(q)

  // Strip product-type words from query for pure content matching
  // e.g. "chainsaw man nendoroid" → content words = ["chainsaw", "man"]
  const typeWords = new Set<string>()
  if (queryType) {
    const variants = PRODUCT_TYPE_KEYWORDS[queryType] || []
    for (const v of variants) typeWords.add(v.toLowerCase())
    // Also add the english type name itself
    typeWords.add(queryType)
  }
  const contentWords = words.filter(w => !typeWords.has(w))

  const scored = items
    .map(item => {
      let relevance = 0
      const name = item.name.toLowerCase()
      const keyword = ((item as any).keyword || '').toLowerCase()
      const franchise = (item.franchise || '').toLowerCase()
      const franchiseJp = (item.franchise_jp || '').toLowerCase()

      // Full query match in name
      if (name.includes(q)) relevance += 10
      if (franchise.includes(q)) relevance += 8
      if (franchiseJp.includes(q)) relevance += 8

      // Word-level matching (content words — franchise/character)
      for (const w of contentWords.length > 0 ? contentWords : words) {
        if (name.includes(w)) relevance += 3
        if (franchise.includes(w)) relevance += 2
        if (franchiseJp.includes(w)) relevance += 2
        if (keyword.includes(w)) relevance += 1
      }

      // ── Product-type boosting ──
      // If user searched for a specific product type, HEAVILY boost matches
      if (queryType) {
        if (itemMatchesProductType(item.name, queryType)) {
          relevance += 15  // massive boost for correct product type
        } else if (itemIsMerch(item.name)) {
          relevance -= 8  // heavy penalty for merch when searching for figures
        } else {
          // No type signal either way — slight penalty vs typed matches
          relevance -= 2
        }
      }

      // Quality score tiebreaker
      const quality = (item as any).quality_score ?? 50
      const finalScore = relevance * 100 + quality

      return { item, relevance, finalScore }
    })
    .filter(s => s.relevance > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)

  return scored.map(s => s.item)
}

function formatResult(item: RawItem) {
  const cost = item.cost_estimates
  const proxies = Object.values(cost.breakdown).sort((a, b) => a.total_jpy - b.total_jpy)

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    price_usd: item.price_usd,
    image_url: item.image_url,
    url: item.url,
    category: item.category_source,
    franchise: item.franchise,
    condition: item.condition,
    trust_risk: item.trust.risk,
    cheapest_proxy: cost.cheapest_proxy,
    cheapest_total_usd: cost.cheapest_total_usd,
    most_expensive_proxy: cost.most_expensive_proxy,
    most_expensive_total_usd: cost.most_expensive_total_jpy / 155, // keep consistent
    savings_jpy: cost.savings_jpy,
    savings_usd: cost.savings_usd,
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
    const exact = items.find(i => i.id === mercariId)
    if (exact) {
      return NextResponse.json({ results: [formatResult(exact)] })
    }
    // ID not in our database
    return NextResponse.json({
      results: [],
      note: 'This listing is not in our database yet. Try searching by product name.',
    })
  }

  // Text search
  const matches = searchItems(items, q)
  return NextResponse.json({
    results: matches.map(formatResult),
  })
}
