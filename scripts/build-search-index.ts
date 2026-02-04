#!/usr/bin/env npx tsx
/**
 * Build items-search.json from items.json
 * 
 * Strips heavy fields (photos, description, classification) to create
 * a slim search index that fits in Vercel serverless memory.
 * 
 * Usage: npx tsx scripts/build-search-index.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

const ITEMS_PATH = path.join(process.cwd(), 'public', 'data', 'items.json')
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'items-search.json')

interface RawItem {
  id: string
  url: string
  name: string
  price: number
  price_usd: number
  image_url: string | null
  category_source: string | null
  keyword: string | null
  franchise: string | null
  franchise_jp: string | null
  condition: string | null
  quality_score: number
  trust_risk: string
  cheapest_proxy: string
  cheapest_total_usd: number
  savings_usd: number
}

interface SearchItem {
  id: string
  u: string     // url
  n: string     // name
  p: number     // price JPY
  pu: number    // price USD
  i: string | null  // image_url
  c: string | null   // category
  k: string | null   // keyword
  f: string | null   // franchise
  fj: string | null  // franchise_jp
  co: string | null  // condition
  q: number     // quality_score
  tr: string    // trust risk
  cp: string    // cheapest proxy
  ct: number    // cheapest total USD
  sv: number    // savings USD
}

if (!existsSync(ITEMS_PATH)) {
  console.error(`❌ ${ITEMS_PATH} not found. Run build_web_data.py first.`)
  process.exit(1)
}

console.log(`📖 Reading ${ITEMS_PATH}...`)
const raw = readFileSync(ITEMS_PATH, 'utf-8')
const items: RawItem[] = JSON.parse(raw)
console.log(`   ${items.length} items loaded`)

// Build slim index
const searchItems: SearchItem[] = items.map(item => ({
  id: item.id,
  u: item.url,
  n: item.name,
  p: item.price,
  pu: item.price_usd,
  i: item.image_url,
  c: item.category_source || null,
  k: item.keyword || null,
  f: item.franchise || null,
  fj: item.franchise_jp || null,
  co: item.condition || null,
  q: item.quality_score ?? 50,
  tr: item.trust_risk || 'medium',
  cp: item.cheapest_proxy || 'Unknown',
  ct: item.cheapest_total_usd ?? 0,
  sv: item.savings_usd ?? 0,
}))

// Stats
const stats = {
  total: searchItems.length,
  withFranchise: searchItems.filter(i => i.f).length,
  withCategory: searchItems.filter(i => i.c).length,
  withCondition: searchItems.filter(i => i.co).length,
  withImage: searchItems.filter(i => i.i).length,
  withKeyword: searchItems.filter(i => i.k).length,
}

console.log(`\n📊 Field coverage:`)
console.log(`   franchise:  ${stats.withFranchise}/${stats.total} (${(stats.withFranchise/stats.total*100).toFixed(0)}%)`)
console.log(`   category:   ${stats.withCategory}/${stats.total} (${(stats.withCategory/stats.total*100).toFixed(0)}%)`)
console.log(`   condition:  ${stats.withCondition}/${stats.total} (${(stats.withCondition/stats.total*100).toFixed(0)}%)`)
console.log(`   image:      ${stats.withImage}/${stats.total} (${(stats.withImage/stats.total*100).toFixed(0)}%)`)
console.log(`   keyword:    ${stats.withKeyword}/${stats.total} (${(stats.withKeyword/stats.total*100).toFixed(0)}%)`)

const output = JSON.stringify(searchItems)
writeFileSync(OUTPUT_PATH, output)
const sizeMB = (Buffer.byteLength(output) / 1024 / 1024).toFixed(1)
console.log(`\n✅ Written ${OUTPUT_PATH} (${sizeMB} MB)`)
