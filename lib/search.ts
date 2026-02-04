/**
 * Shared search utilities: franchise aliases, fuzzy matching, query normalization.
 * Used by both /api/search (products) and /api/lookup (listings).
 */

import Fuse from 'fuse.js'

// ── Franchise alias map: EN names → JP equivalents + common variants ──
// This lets users type English franchise names and still match JP listings/products
export const FRANCHISE_ALIASES: Record<string, string[]> = {
  'one piece':          ['ワンピース', 'ONE PIECE', 'ルフィ', 'ゾロ'],
  'chainsaw man':       ['チェンソーマン', 'chainsawman'],
  'demon slayer':       ['鬼滅の刃', 'kimetsu'],
  'attack on titan':    ['進撃の巨人', 'shingeki'],
  'my hero academia':   ['ヒロアカ', '僕のヒーローアカデミア', 'boku no hero'],
  'jujutsu kaisen':     ['呪術廻戦', 'jujutsukaisen'],
  'spy x family':       ['スパイファミリー', 'spy family', 'spyxfamily', 'spyfamily'],
  'dragon ball':        ['ドラゴンボール', 'dragonball', 'dbz', 'goku'],
  'naruto':             ['ナルト', 'NARUTO', 'うちはサスケ'],
  'pokemon':            ['ポケモン', 'ポケットモンスター', 'pikachu', 'ピカチュウ'],
  'hatsune miku':       ['初音ミク', 'miku', 'ミク', 'vocaloid', 'ボーカロイド'],
  'evangelion':         ['エヴァンゲリオン', 'eva', 'EVA'],
  'fate':               ['Fate', 'FGO', 'Fate/Grand Order', 'フェイト', 'セイバー'],
  'genshin impact':     ['原神', 'genshin'],
  'genshin':            ['原神', 'genshin impact'],
  'hololive':           ['ホロライブ'],
  'blue archive':       ['ブルーアーカイブ', 'ブルアカ', 'bluearchive'],
  'frieren':            ['フリーレン', '葬送のフリーレン'],
  'oshi no ko':         ['推しの子', 'oshinoko'],
  'bocchi':             ['ぼっち・ざ・ろっく', 'bocchi the rock'],
  'bocchi the rock':    ['ぼっち・ざ・ろっく', 'bocchi'],
  're:zero':            ['リゼロ', 'Re:ゼロ', 'rezero', 're zero', 'レム', 'エミリア'],
  'rezero':             ['リゼロ', 'Re:ゼロ', 're:zero', 're zero'],
  'konosuba':           ['このすば', 'めぐみん'],
  'sword art online':   ['SAO', 'ソードアート・オンライン', 'sao'],
  'sao':                ['ソードアート・オンライン', 'sword art online'],
  'steins gate':        ['シュタゲ', 'シュタインズ・ゲート', 'steinsgate', 'steins;gate'],
  'made in abyss':      ['メイドインアビス', 'ナナチ', 'madeinabyss'],
  'love live':          ['ラブライブ', 'lovelive'],
  'gundam':             ['ガンダム', 'ガンプラ'],
  'touhou':             ['東方', '東方Project', '博麗霊夢'],
  'persona':            ['ペルソナ', 'persona5', 'ペルソナ5'],
  'nier':               ['ニーア', 'nier automata', '2B'],
  'final fantasy':      ['FF', 'ファイナルファンタジー', 'finalfantasy'],
  'monster hunter':     ['モンハン', 'モンスターハンター', 'monsterhunter'],
  'overlord':           ['オーバーロード', 'アインズ', 'アルベド'],
  'mushoku tensei':     ['無職転生', 'mushokutensei', 'ロキシー'],
  'quintessential quintuplets': ['五等分の花嫁', 'gotoubun', '中野'],
  'date a live':        ['デート・ア・ライブ', 'datealive', '時崎狂三'],
  'violet evergarden':  ['ヴァイオレット・エヴァーガーデン'],
  'cyberpunk edgerunners': ['エッジランナーズ', 'サイバーパンク'],
  'dandadan':           ['ダンダダン'],
  'arknights':          ['アークナイツ'],
  'to love ru':         ['ToLOVEる', 'tolove'],
  'kaguya':             ['かぐや様', 'kaguya-sama', 'kaguya sama'],
  'kaguya-sama':        ['かぐや様', 'kaguya sama', 'kaguya'],
  'monogatari':         ['物語シリーズ', '化物語'],
}

// Build reverse map: JP term → EN aliases (for completeness)
const reverseAliases: Record<string, string[]> = {}
for (const [en, aliases] of Object.entries(FRANCHISE_ALIASES)) {
  for (const alias of aliases) {
    const key = alias.toLowerCase()
    if (!reverseAliases[key]) reverseAliases[key] = []
    reverseAliases[key].push(en)
  }
}

/**
 * Expand a query into all known aliases.
 * "one piece" → ["one piece", "ワンピース", "ONE PIECE", "ルフィ", "ゾロ"]
 * "chainsawman" → ["chainsawman", "チェンソーマン", "chainsaw man"]
 */
export function expandQuery(query: string): string[] {
  const q = query.toLowerCase().trim()
  const expansions = new Set<string>([query.trim()])

  // Direct alias lookup
  if (FRANCHISE_ALIASES[q]) {
    for (const alias of FRANCHISE_ALIASES[q]) {
      expansions.add(alias)
    }
  }

  // Check if query matches any alias value (reverse lookup)
  if (reverseAliases[q]) {
    for (const en of reverseAliases[q]) {
      expansions.add(en)
      // Also add all aliases of the matched franchise
      for (const alias of FRANCHISE_ALIASES[en] || []) {
        expansions.add(alias)
      }
    }
  }

  // Fuzzy match against alias keys (handles typos like "chainsawman" → "chainsaw man")
  // Simple: try removing spaces and comparing
  const noSpaceQ = q.replace(/\s+/g, '')
  for (const [key, aliases] of Object.entries(FRANCHISE_ALIASES)) {
    const noSpaceKey = key.replace(/\s+/g, '')
    if (noSpaceKey === noSpaceQ || key === noSpaceQ) {
      expansions.add(key)
      for (const alias of aliases) expansions.add(alias)
    }
    // Also check aliases without spaces
    for (const alias of aliases) {
      if (alias.toLowerCase().replace(/\s+/g, '') === noSpaceQ) {
        expansions.add(key)
        for (const a of aliases) expansions.add(a)
      }
    }
  }

  return Array.from(expansions)
}

/**
 * Normalize a search query: lowercase, trim, collapse whitespace.
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if text matches any of the expanded queries (substring match).
 */
export function matchesAny(text: string, expandedQueries: string[]): boolean {
  const lower = text.toLowerCase()
  return expandedQueries.some(q => lower.includes(q.toLowerCase()))
}

/**
 * Score how well a text matches expanded queries. Higher = better.
 */
export function scoreMatch(text: string, expandedQueries: string[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const q of expandedQueries) {
    const ql = q.toLowerCase()
    if (lower === ql) score += 20       // exact match
    else if (lower.includes(ql)) score += 10  // substring match
  }
  return score
}

/**
 * Create a Fuse.js instance for fuzzy searching an array of items.
 */
export function createFuseIndex<T>(items: T[], keys: string[], options?: Record<string, any>): Fuse<T> {
  return new Fuse(items, {
    keys,
    threshold: 0.35,
    distance: 200,
    includeScore: true,
    ignoreLocation: true,
    ...options,
  })
}
