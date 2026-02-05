/**
 * Canonical constants for Majikari
 * 
 * These values must stay in sync with majikari-scraper/build_web_data.py
 * If you update here, update there (or vice versa).
 */

// ── Exchange Rate ──────────────────────────────────────────────
// Updated: Jan 2025. Check xe.com if prices look off.
export const JPY_USD_RATE = 155

// ── Proxy Services ─────────────────────────────────────────────
// Fee structures for landed cost calculation.
// serviceFee: flat fee in JPY
// fxMarkup: percentage added to exchange rate (0.03 = 3%)
// paymentFee: credit card / payment processing fee
export const PROXY_SERVICES = {
  buyee: {
    name: 'Buyee',
    url: 'https://buyee.jp',
    serviceFee: 500,
    fxMarkup: 0.035,
    paymentFee: 0.03,
  },
  zenmarket: {
    name: 'ZenMarket',
    url: 'https://zenmarket.jp',
    serviceFee: 300,
    fxMarkup: 0.03,
    paymentFee: 0.035,
  },
  fromjapan: {
    name: 'FromJapan',
    url: 'https://www.fromjapan.co.jp',
    serviceFee: 200,
    fxMarkup: 0.08,  // includes payment fee
    paymentFee: 0,
  },
  neokyo: {
    name: 'Neokyo',
    url: 'https://neokyo.com',
    serviceFee: 350,
    fxMarkup: 0,     // transparent rate
    paymentFee: 0.029,
  },
} as const

export type ProxyServiceKey = keyof typeof PROXY_SERVICES

// ── Shipping ───────────────────────────────────────────────────
// EMS international shipping tiers: [maxWeightKg, costJpy]
// Source: Japan Post EMS rate table (Zone 2 - Americas)
export const EMS_SHIPPING_TIERS: readonly [number, number][] = [
  [0.5, 2000],
  [1.0, 2900],
  [1.5, 3700],
  [2.0, 4500],
  [3.0, 5900],
  [5.0, 8700],
]

// Typical domestic shipping within Japan
export const DOMESTIC_SHIPPING_JPY = 700

// Default weight estimate for figures (kg)
export const DEFAULT_ITEM_WEIGHT_KG = 0.8

// ── US Customs ─────────────────────────────────────────────────
// De minimis threshold: imports under this value are duty-free
export const US_DE_MINIMIS_USD = 800
// Duty rate applied to value exceeding de minimis
export const US_DUTY_RATE = 0.045

// ── UI ─────────────────────────────────────────────────────────
// Stagger delay for list animations (ms between items)
export const STAGGER_DELAY_MS = 50

// Category colors for product badges
export const CATEGORY_COLORS: Record<string, string> = {
  nendoroid: 'var(--cyan)',
  figma: 'var(--lavender)',
  scale: 'var(--accent)',
  'pop up parade': 'var(--mint)',
  default: 'var(--accent-soft)',
}
