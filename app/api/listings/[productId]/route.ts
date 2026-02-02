/**
 * Get marketplace listings for a canonical product
 * Entity Resolution v3: Multi-gate matching with category gating
 * 
 * Key improvements over v2:
 * 1. Hard gate: figure products only match figure listings (not keychains/merch)
 * 2. Soft gate: product type compatibility check (nendoroid ≠ scale figure)
 * 3. Character identity matching AFTER gates pass
 */

import { NextRequest, NextResponse } from 'next/server'
import products from '@/data/goodsmile-products.json'
import listingsData from '@/data/mercari-listings.json'

interface Product {
  id: string
  name: string
  name_jp?: string
  series?: string
  series_jp?: string
  category?: string
}

interface RawListing {
  id: string
  name: string
  price: number
  condition?: string
  status?: string
  thumbnails?: string[]
  category_hint?: string
}

const productList = products as unknown as Product[]
const allListings = (listingsData as any).items as RawListing[]

// Pre-filter figure listings for fast lookup
const figureListings = allListings.filter(l => l.category_hint === 'figure')

// GSC categories that are figure products
const FIGURE_CATEGORIES = new Set([
  'nendoroid', 'figma', 'pop up parade', 'nendoroid doll',
  '1/7th scale', '1/8th scale', '1/4th scale', '1/6th scale',
  'other scale', 'action figure', 'soft vinyl', 'harmonia bloom',
])

// Product type keywords for subtype detection
const FIGURE_SUBTYPE_KEYWORDS: Record<string, string[]> = {
  nendoroid: ['ねんどろいど', 'nendoroid', 'ネンドロイド'],
  figma: ['figma', 'フィグマ'],
  pop_up_parade: ['pop up parade', 'POP UP PARADE', 'ポップアップパレード'],
  scale: ['スケール', '1/7', '1/8', '1/4', '1/6', 'scale'],
  prize: ['プライズ', '一番くじ', 'コアフル', 'coreful', 'ちょこのせ', 'SPM', 'EXQ', 'Luminasta'],
}

// Non-figure merch keywords
const NON_FIGURE_KEYWORDS = [
  'アクリルスタンド', 'アクスタ', 'アクリルキーホルダー', 'アクキー',
  'キーホルダー', 'ストラップ', '缶バッジ', 'ピンバッジ',
  'Tシャツ', 'パーカー', 'タオル', 'ブランケット',
  'ぬいぐるみ', 'マスコット', 'クッション',
  'ポスター', 'タペストリー', 'クリアファイル',
  'カード', 'ブロマイド', 'チェキ', '色紙',
  '同人誌', '漫画', '画集', '小説',
  'ラバーストラップ', 'ラバスト', 'ラバキー',
  'ステッカー', 'シール', 'マグカップ', 'コースター',
]

const FIGURE_KEYWORDS = [
  'フィギュア', 'figure', 'スケール', 'scale',
  'ねんどろいど', 'nendoroid', 'figma',
  'POP UP PARADE', 'プライズ', '一番くじ',
  'コアフル', 'coreful', 'ちょこのせ',
]

function norm(text: string): string {
  if (!text) return ''
  return text.toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectListingType(name: string): { type: string; keywords: string[] } {
  const nameLower = name.toLowerCase()
  
  // Check non-figure merch first
  for (const kw of NON_FIGURE_KEYWORDS) {
    if (nameLower.includes(kw.toLowerCase())) {
      return { type: 'merch', keywords: [kw] }
    }
  }
  
  // Check specific figure subtypes
  for (const [subtype, keywords] of Object.entries(FIGURE_SUBTYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (nameLower.includes(kw.toLowerCase())) {
        return { type: subtype, keywords: [kw] }
      }
    }
  }
  
  // Check generic figure keywords
  for (const kw of FIGURE_KEYWORDS) {
    if (nameLower.includes(kw.toLowerCase())) {
      return { type: 'figure', keywords: [kw] }
    }
  }
  
  return { type: 'unknown', keywords: [] }
}

function categoryCompatible(productCategory: string, listingType: string): { ok: boolean; bonus: number } {
  const cat = productCategory.toLowerCase()
  
  // Hard reject: merch for figure products
  if (listingType === 'merch' && FIGURE_CATEGORIES.has(cat)) {
    return { ok: false, bonus: 0 }
  }
  
  // Exact subtype match
  if (cat === 'nendoroid' && listingType === 'nendoroid') return { ok: true, bonus: 0.5 }
  if (cat === 'figma' && listingType === 'figma') return { ok: true, bonus: 0.5 }
  if (cat === 'pop up parade' && listingType === 'pop_up_parade') return { ok: true, bonus: 0.5 }
  if (cat.includes('scale') && listingType === 'scale') return { ok: true, bonus: 0.3 }
  
  // Cross-type mismatch within figures
  const figureSubtypes = new Set(['nendoroid', 'figma', 'pop_up_parade', 'scale', 'prize'])
  if (figureSubtypes.has(listingType) && FIGURE_CATEGORIES.has(cat)) {
    let catSubtype: string | null = null
    if (cat.includes('nendoroid')) catSubtype = 'nendoroid'
    else if (cat === 'figma') catSubtype = 'figma'
    else if (cat.includes('pop up parade')) catSubtype = 'pop_up_parade'
    else if (cat.includes('scale')) catSubtype = 'scale'
    
    if (catSubtype && catSubtype !== listingType) {
      return { ok: false, bonus: 0 }
    }
  }
  
  // Generic figure or unknown for figure product: OK
  if (FIGURE_CATEGORIES.has(cat)) {
    return { ok: true, bonus: listingType === 'figure' ? 0.1 : 0 }
  }
  
  return { ok: true, bonus: 0 }
}

function assessRisk(listing: RawListing): { risk: 'low' | 'medium' | 'high'; flags: string[] } {
  const flags: string[] = []
  if (listing.price < 500) flags.push('Suspiciously cheap')
  if (listing.price > 50000) flags.push('Premium price — verify')
  if (!listing.condition) flags.push('Condition not specified')
  const name = listing.name.toLowerCase()
  if (name.includes('ジャンク') || name.includes('junk')) flags.push('Junk/damaged')
  if (name.includes('コピー') || name.includes('海賊')) flags.push('Possible bootleg')
  if (name.includes('まとめ') || name.includes('セット') || name.includes('lot')) flags.push('Bundle listing')
  if (name.includes('パーツ') || name.includes('parts')) flags.push('Parts only')
  if (name.includes('箱なし') || name.includes('箱無し')) flags.push('No box')
  const risk: 'low' | 'medium' | 'high' =
    flags.length === 0 ? 'low' :
    flags.some(f => f.includes('bootleg') || f.includes('Junk') || f.includes('Suspiciously')) ? 'high' :
    'medium'
  return { risk, flags }
}

function matchListings(product: Product) {
  const category = (product.category || '').toLowerCase()
  
  // Extract character name (remove category prefix and version suffix)
  let enName = (product.name || '')
    .replace(/^(Nendoroid|figma|POP UP PARADE|PLAMAX|Nendoroid Doll|1\/\d+th Scale)\s*/i, '')
    .replace(/\s*[\-—:]\s*(.*Ver\.?|Special|DX|Bonus|Limited|Complete).*$/i, '')
    .trim()

  let jpName = (product.name_jp || '')
    .replace(/^(ねんどろいど|figma|POP UP PARADE|ねんどろいどどーる)\s*/i, '')
    .replace(/\s*[\-—:：].*(Ver|バージョン|限定|完全版).*$/i, '')
    .trim()

  // Use all listings as candidates — type detection gates handle filtering
  // (category_hint is sparse, most listings have no hint)
  const candidates = allListings

  const results: any[] = []

  for (const listing of candidates) {
    const listingName = listing.name
    const ln = norm(listingName)

    // Gate 2: Product type compatibility
    const { type: listingType, keywords: typeKws } = detectListingType(listingName)
    const { ok, bonus: typeBonus } = categoryCompatible(category, listingType)
    if (!ok) continue

    // Scoring
    let score = typeBonus
    const reasons: string[] = []
    if (typeBonus > 0) reasons.push(`Type:${listingType}`)

    let hasIdentity = false

    // JP name matching
    if (jpName && norm(jpName).length >= 2) {
      const jpNorm = norm(jpName)
      if (ln.includes(jpNorm)) {
        score += 0.4
        reasons.push(`JP: ${jpName}`)
        hasIdentity = true
      } else {
        for (const word of jpName.split(/\s+/)) {
          const wn = norm(word)
          if (wn.length >= 2 && ln.includes(wn)) {
            score += 0.15
            reasons.push(`JP-w: ${word}`)
            hasIdentity = true
          }
        }
      }
    }

    // EN name matching
    if (enName && enName.length >= 4) {
      const enLower = enName.toLowerCase()
      if (ln.includes(enLower)) {
        score += 0.35
        reasons.push(`EN: ${enName}`)
        hasIdentity = true
      } else {
        const stop = new Set(['the', 'and', 'ver', 'version', 'with', 'from', 'figure', 'new', 'vol'])
        for (const word of enLower.split(/\s+/)) {
          if (word.length >= 4 && !stop.has(word) && ln.includes(word)) {
            score += 0.1
            reasons.push(`EN-w: ${word}`)
            hasIdentity = true
          }
        }
      }
    }

    // Must have character identity
    if (!hasIdentity) continue

    // Series match (supporting)
    if (product.series && norm(product.series).length >= 3 && ln.includes(norm(product.series))) {
      score += 0.1
      reasons.push('Series')
    } else if (product.series_jp && norm(product.series_jp).length >= 2 && ln.includes(norm(product.series_jp))) {
      score += 0.1
      reasons.push('Series-JP')
    }

    // STRICT GATE: If product has a specific subtype (nendoroid, figma, POP UP PARADE, scale)
    // but the listing is generic "figure" or "unknown" with no subtype keyword,
    // require a much higher score — prevents "デンジ フィギュア" matching Nendoroid Denji
    const specificSubtypes = new Set(['nendoroid', 'figma', 'pop up parade', 'pop_up_parade', '1/7th scale', '1/8th scale', '1/4th scale', '1/6th scale'])
    const productIsSpecific = specificSubtypes.has(category)
    const listingIsGeneric = listingType === 'figure' || listingType === 'unknown'
    if (productIsSpecific && listingIsGeneric) {
      // Only allow if score is very high (full JP name + series match)
      if (score < 0.8) continue
    }

    if (score < 0.3) continue

    const { risk, flags } = assessRisk(listing)
    results.push({
      listing_id: listing.id,
      name: listing.name,
      price: listing.price,
      condition: listing.condition || null,
      image: listing.thumbnails?.[0] || null,
      url: `https://jp.mercari.com/item/${listing.id}`,
      score: Math.round(score * 100) / 100,
      match_reason: reasons.join(' + '),
      listing_type: listingType,
      risk,
      risk_flags: flags,
    })
  }

  results.sort((a, b) => b.score - a.score || a.price - b.price)
  return results.slice(0, 10)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const product = productList.find(p => p.id === params.productId)
  if (!product) {
    return NextResponse.json({ productId: params.productId, count: 0, listings: [], error: 'Product not found' })
  }

  const listings = matchListings(product)
  const gscId = product.id.replace('GSC-', '')
  return NextResponse.json({
    productId: params.productId,
    productName: product.name,
    productNameJp: product.name_jp,
    category: product.category,
    count: listings.length,
    listings: listings.map(l => ({ ...l, source: 'mercari', source_name: 'Mercari JP' })),
    // Always provide GSC official link as fallback/reference
    fallback: {
      type: 'goodsmile',
      url: `https://www.goodsmile.info/en/product/${gscId}`,
      message: listings.length === 0
        ? 'No verified listings found. View on Good Smile Company:'
        : 'Official product page:',
    },
  })
}
