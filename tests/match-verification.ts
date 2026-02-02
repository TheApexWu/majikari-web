/**
 * Match Verification Test Suite
 * ==============================
 * 
 * Tests entity resolution accuracy with known good/bad pairs.
 * Run: npx tsx tests/match-verification.ts
 * 
 * Categories:
 *   ✅ MUST MATCH — Known correct pairs
 *   ❌ MUST NOT MATCH — Known incorrect pairs (the bugs we've found)
 *   🔶 EDGE CASES — Ambiguous, should match with low confidence or not at all
 */

interface TestCase {
  description: string
  productId: string
  productName: string
  productCategory: string
  listingId: string
  listingName: string
  expectedMatch: boolean  // true = should match, false = should NOT match
  reason: string
}

// Known bad matches we've caught
const MUST_NOT_MATCH: TestCase[] = [
  {
    description: 'Marisa Lost Word nendoroid vs random Marisa figure',
    productId: 'GSC-nendoroid-marisa-lostword',
    productName: 'Nendoroid Marisa Kirisame: Touhou LostWord Ver.',
    productCategory: 'nendoroid',
    listingId: 'm77963854904',
    listingName: '【中古】霧雨魔理沙 フィギュア 東方Project',  // Generic, not nendoroid, not Lost Word
    expectedMatch: false,
    reason: 'Product is specifically Nendoroid + LostWord. Listing is generic figure with no nendoroid or LostWord mention.',
  },
  {
    description: 'Nendoroid vs keychain of same character',
    productId: 'test-nendoroid-miku',
    productName: 'Nendoroid Hatsune Miku',
    productCategory: 'nendoroid',
    listingId: 'test-keychain-miku',
    listingName: '初音ミク アクリルキーホルダー',
    expectedMatch: false,
    reason: 'Product is nendoroid figure, listing is acrylic keychain.',
  },
  {
    description: 'Scale figure vs prize figure of same character',
    productId: 'test-scale-rem',
    productName: '1/7th Scale Re:Zero Rem',
    productCategory: '1/7th scale',
    listingId: 'test-prize-rem',
    listingName: 'Re:ゼロ レム プライズフィギュア コアフル',
    expectedMatch: false,
    reason: 'Product is 1/7 scale, listing is prize/coreful figure. Different product types.',
  },
  {
    description: 'Specific version vs different version',
    productId: 'test-nendoroid-saber',
    productName: 'Nendoroid Saber/Artoria Pendragon: Heroic Spirit Formal Dress Ver.',
    productCategory: 'nendoroid',
    listingId: 'test-saber-casual',
    listingName: 'ねんどろいど セイバー 私服ver',
    expectedMatch: false,
    reason: 'Different versions of same character nendoroid.',
  },
]

// Known correct matches
const MUST_MATCH: TestCase[] = [
  {
    description: 'Exact nendoroid match JP name',
    productId: 'test-nendoroid-bocchi',
    productName: 'Nendoroid Hitori Gotoh',
    productCategory: 'nendoroid',
    listingId: 'test-bocchi-exact',
    listingName: 'ねんどろいど 後藤ひとり ぼっち・ざ・ろっく！',
    expectedMatch: true,
    reason: 'Exact character + product type match.',
  },
  {
    description: 'Figma with series match',
    productId: 'test-figma-asuna',
    productName: 'figma Asuna',
    productCategory: 'figma',
    listingId: 'test-figma-asuna-listing',
    listingName: 'figma アスナ ソードアート・オンライン SAO',
    expectedMatch: true,
    reason: 'Exact product type + character match.',
  },
]

// Edge cases
const EDGE_CASES: TestCase[] = [
  {
    description: 'Same character, listing has no type indicator',
    productId: 'test-nendoroid-luffy',
    productName: 'Nendoroid Monkey D. Luffy',
    productCategory: 'nendoroid',
    listingId: 'test-luffy-ambiguous',
    listingName: 'ルフィ フィギュア ワンピース',
    expectedMatch: false,  // Should NOT match without specific type
    reason: 'Generic "figure" listing without nendoroid mention should not match nendoroid product.',
  },
  {
    description: 'Bundle listing with target character',
    productId: 'test-nendoroid-megumin',
    productName: 'Nendoroid Megumin',
    productCategory: 'nendoroid',
    listingId: 'test-megumin-bundle',
    listingName: 'このすば まとめ売り めぐみん アクア ダクネス フィギュアセット',
    expectedMatch: false,
    reason: 'Bundle listings are unreliable matches.',
  },
]

const ALL_TESTS = [
  ...MUST_NOT_MATCH.map(t => ({ ...t, category: '❌ MUST NOT MATCH' })),
  ...MUST_MATCH.map(t => ({ ...t, category: '✅ MUST MATCH' })),
  ...EDGE_CASES.map(t => ({ ...t, category: '🔶 EDGE CASE' })),
]

// ---- Matching logic (mirrors route.ts) ----

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

const FIGURE_SUBTYPE_KEYWORDS: Record<string, string[]> = {
  nendoroid: ['ねんどろいど', 'nendoroid', 'ネンドロイド'],
  figma: ['figma', 'フィグマ'],
  pop_up_parade: ['pop up parade', 'POP UP PARADE', 'ポップアップパレード'],
  scale: ['スケール', '1/7', '1/8', '1/4', '1/6', 'scale'],
  prize: ['プライズ', '一番くじ', 'コアフル', 'coreful', 'ちょこのせ', 'SPM', 'EXQ', 'Luminasta'],
}

const FIGURE_CATEGORIES = new Set([
  'nendoroid', 'figma', 'pop up parade', 'nendoroid doll',
  '1/7th scale', '1/8th scale', '1/4th scale', '1/6th scale',
  'other scale', 'action figure', 'soft vinyl', 'harmonia bloom',
])

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
  for (const kw of NON_FIGURE_KEYWORDS) {
    if (nameLower.includes(kw.toLowerCase())) {
      return { type: 'merch', keywords: [kw] }
    }
  }
  for (const [subtype, keywords] of Object.entries(FIGURE_SUBTYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (nameLower.includes(kw.toLowerCase())) {
        return { type: subtype, keywords: [kw] }
      }
    }
  }
  return { type: 'unknown', keywords: [] }
}

function categoryCompatible(productCategory: string, listingType: string): { ok: boolean; bonus: number } {
  const cat = productCategory.toLowerCase()
  if (listingType === 'merch' && FIGURE_CATEGORIES.has(cat)) return { ok: false, bonus: 0 }
  if (cat === 'nendoroid' && listingType === 'nendoroid') return { ok: true, bonus: 0.5 }
  if (cat === 'figma' && listingType === 'figma') return { ok: true, bonus: 0.5 }
  if (cat === 'pop up parade' && listingType === 'pop_up_parade') return { ok: true, bonus: 0.5 }
  if (cat.includes('scale') && listingType === 'scale') return { ok: true, bonus: 0.3 }
  
  const figureSubtypes = new Set(['nendoroid', 'figma', 'pop_up_parade', 'scale', 'prize'])
  if (figureSubtypes.has(listingType) && FIGURE_CATEGORIES.has(cat)) {
    let catSubtype: string | null = null
    if (cat.includes('nendoroid')) catSubtype = 'nendoroid'
    else if (cat === 'figma') catSubtype = 'figma'
    else if (cat.includes('pop up parade')) catSubtype = 'pop_up_parade'
    else if (cat.includes('scale')) catSubtype = 'scale'
    if (catSubtype && catSubtype !== listingType) return { ok: false, bonus: 0 }
  }
  
  if (FIGURE_CATEGORIES.has(cat)) {
    return { ok: true, bonus: listingType === 'figure' ? 0.1 : 0 }
  }
  return { ok: true, bonus: 0 }
}

/**
 * NEW: Stricter matching with version awareness
 */
function matchScore(product: { name: string; name_jp?: string; category: string }, listingName: string): { score: number; reasons: string[]; matched: boolean } {
  const ln = norm(listingName)
  const category = product.category.toLowerCase()
  
  // Gate 1: Product type
  const { type: listingType } = detectListingType(listingName)
  const { ok, bonus: typeBonus } = categoryCompatible(category, listingType)
  if (!ok) return { score: 0, reasons: ['Type mismatch'], matched: false }
  
  // NEW: For specific product types (nendoroid, figma), REQUIRE type keyword in listing
  const specificTypes = new Set(['nendoroid', 'figma', 'pop up parade'])
  if (specificTypes.has(category) && listingType !== category.replace(' ', '_') && listingType !== category) {
    // Listing doesn't mention the specific product type — reject
    return { score: 0, reasons: [`Listing lacks ${category} keyword`], matched: false }
  }

  let score = typeBonus
  const reasons: string[] = []
  if (typeBonus > 0) reasons.push(`Type:${listingType}`)

  // Extract character name
  let enName = product.name
    .replace(/^(Nendoroid|figma|POP UP PARADE|PLAMAX|Nendoroid Doll|1\/\d+th Scale)\s*/i, '')
    .replace(/\s*[\-—:]\s*(.*Ver\.?|Special|DX|Bonus|Limited|Complete).*$/i, '')
    .trim()

  // Character identity
  let hasIdentity = false
  
  // JP matching
  const jpName = (product as any).name_jp || ''
  if (jpName && norm(jpName).length >= 2) {
    const jpNorm = norm(jpName)
    if (ln.includes(jpNorm)) {
      score += 0.4
      reasons.push(`JP: ${jpName}`)
      hasIdentity = true
    }
  }

  // EN matching
  if (enName && enName.length >= 4) {
    const enLower = enName.toLowerCase()
    if (ln.includes(enLower)) {
      score += 0.35
      reasons.push(`EN: ${enName}`)
      hasIdentity = true
    }
  }

  if (!hasIdentity) return { score: 0, reasons: ['No identity match'], matched: false }

  // NEW: Version matching — if product has a version, check listing mentions it
  const versionPatterns = [
    /(\w+)\s*Ver\.?/i,
    /(\w+)\s*バージョン/i,
    /(LostWord|ロストワード)/i,
    /(Wedding|ウェディング)/i,
    /(Swimsuit|水着)/i,
    /(Casual|私服)/i,
    /(Formal Dress|フォーマル)/i,
  ]
  
  for (const pattern of versionPatterns) {
    const productMatch = product.name.match(pattern)
    if (productMatch) {
      const versionTerm = productMatch[1].toLowerCase()
      if (ln.includes(versionTerm)) {
        score += 0.2
        reasons.push(`Version: ${versionTerm}`)
      } else {
        // Product specifies a version but listing doesn't mention it — penalty
        score -= 0.3
        reasons.push(`Missing version: ${versionTerm}`)
      }
    }
  }

  // Minimum threshold: 0.5 (was 0.3 — too low)
  const matched = score >= 0.5
  return { score: Math.round(score * 100) / 100, reasons, matched }
}

// ---- Run tests ----

function runTests() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║  Majikari Match Verification Test Suite  ║')
  console.log('╚══════════════════════════════════════════╝\n')

  let passed = 0
  let failed = 0
  const failures: string[] = []

  for (const test of ALL_TESTS) {
    const product = {
      name: test.productName,
      name_jp: '', // Would need JP name lookup in real system
      category: test.productCategory,
    }
    
    const result = matchScore(product, test.listingName)
    const actualMatch = result.matched
    const testPassed = actualMatch === test.expectedMatch

    if (testPassed) {
      passed++
      console.log(`  ✅ ${test.category} ${test.description}`)
      console.log(`     Score: ${result.score} | Reasons: ${result.reasons.join(', ')}`)
    } else {
      failed++
      const msg = `  ❌ FAIL: ${test.category} ${test.description}\n` +
        `     Expected: ${test.expectedMatch ? 'MATCH' : 'NO MATCH'}, Got: ${actualMatch ? 'MATCH' : 'NO MATCH'}\n` +
        `     Score: ${result.score} | Reasons: ${result.reasons.join(', ')}\n` +
        `     Why: ${test.reason}`
      failures.push(msg)
      console.log(msg)
    }
    console.log()
  }

  console.log('─'.repeat(50))
  console.log(`Results: ${passed} passed, ${failed} failed out of ${ALL_TESTS.length} tests`)
  
  if (failures.length > 0) {
    console.log('\n⚠️  FAILURES:')
    failures.forEach(f => console.log(f))
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  }
}

runTests()
