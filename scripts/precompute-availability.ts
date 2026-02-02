/**
 * Pre-compute listing availability for all products.
 * Outputs data/availability.json: { [productId]: listingCount }
 * 
 * Run: npx tsx scripts/precompute-availability.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const dataDir = path.join(__dirname, '..', 'data')
const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'goodsmile-products.json'), 'utf-8'))
const listingsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'mercari-listings.json'), 'utf-8'))
const allListings = listingsData.items as any[]

function norm(text: string): string {
  if (!text) return ''
  return text.toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countMatches(product: any): number {
  const category = (product.category || '').toLowerCase()
  const categoryJp =
    category.includes('nendoroid') ? 'ねんどろいど' :
    category.includes('figma') ? 'figma' :
    category.includes('pop up parade') ? 'pop up parade' :
    category.includes('scale') ? 'スケール' : ''

  const enName = (product.name || '')
    .replace(/^(Nendoroid|figma|POP UP PARADE|PLAMAX|1\/\d+th Scale)\s*/i, '')
    .replace(/\s*[\-—:]\s*(.*Ver\.?|Special|DX|Bonus|Limited).*$/i, '')
    .trim()

  const jpName = (product.name_jp || '')
    .replace(/^(ねんどろいど|figma|POP UP PARADE)\s*/i, '')
    .replace(/\s*[\-—:：].*(Ver|バージョン|限定).*$/i, '')
    .trim()

  // Build search terms
  const enTerms: string[] = []
  if (enName.length > 2) {
    enTerms.push(enName.toLowerCase())
    const stopWords = new Set(['the', 'and', 'ver', 'version', 'with', 'from', 'figure', 'new'])
    enName.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3 && !stopWords.has(w)).forEach((w: string) => enTerms.push(w))
  }

  const jpTerms: string[] = []
  if (jpName.length > 0) {
    jpTerms.push(jpName)
    jpName.split(/\s+/).filter((w: string) => w.length >= 2).forEach((w: string) => {
      if (w !== jpName) jpTerms.push(w)
    })
  }

  let count = 0

  for (const listing of allListings) {
    const listingNorm = norm(listing.name)
    let score = 0
    let hasIdentity = false

    // JP matching
    for (const jpTerm of jpTerms) {
      const termNorm = norm(jpTerm)
      if (termNorm.length < 2) continue
      if (listingNorm.includes(termNorm)) {
        if (jpTerm === jpTerms[0]) {
          score += 0.6
          hasIdentity = true
        } else {
          score += 0.25
          hasIdentity = true
        }
        break // only count once
      }
    }

    // EN matching
    if (!hasIdentity) {
      for (const enTerm of enTerms) {
        if (enTerm.length < 3) continue
        if (listingNorm.includes(enTerm)) {
          if (enTerm === enTerms[0] && enTerm.length >= 5) {
            score += 0.5
            hasIdentity = true
          } else {
            score += 0.15
            hasIdentity = true
          }
          break
        }
      }
    }

    if (!hasIdentity || score < 0.4) continue
    count++
    if (count >= 10) break // cap at 10, same as the API
  }

  return count
}

console.time('Pre-computing availability')
const availability: Record<string, number> = {}
let withListings = 0

for (let i = 0; i < products.length; i++) {
  const p = products[i]
  const count = countMatches(p)
  if (count > 0) {
    availability[p.id] = count
    withListings++
  }
  if ((i + 1) % 500 === 0) {
    console.log(`  ${i + 1}/${products.length} processed, ${withListings} with listings`)
  }
}

console.timeEnd('Pre-computing availability')
console.log(`${withListings} / ${products.length} products have listings`)

const outPath = path.join(dataDir, 'availability.json')
fs.writeFileSync(outPath, JSON.stringify(availability))
console.log(`Written to ${outPath}`)
