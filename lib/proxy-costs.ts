/**
 * Proxy Cost Calculator
 * 
 * Single source of truth for landed cost calculation.
 * Matches logic in majikari-scraper/build_web_data.py
 */

import {
  JPY_USD_RATE,
  PROXY_SERVICES,
  EMS_SHIPPING_TIERS,
  DOMESTIC_SHIPPING_JPY,
  DEFAULT_ITEM_WEIGHT_KG,
  US_DE_MINIMIS_USD,
  US_DUTY_RATE,
} from './constants'

import type { CostBreakdown, CostEstimates } from '@/types'

/**
 * Estimate EMS shipping cost based on package weight.
 * Uses Japan Post Zone 2 (Americas) rate table.
 */
export function estimateShipping(weightKg: number): number {
  for (const [tierKg, cost] of EMS_SHIPPING_TIERS) {
    if (weightKg <= tierKg) return cost
  }
  // Over 5kg: flat estimate
  return 10500
}

/**
 * Calculate total landed cost through each proxy service.
 * 
 * Includes: item price, domestic shipping, service fees,
 * FX markup, payment fees, international shipping, US customs duty.
 * 
 * @param priceJpy - Item price in JPY
 * @param weightKg - Estimated weight (default: 0.8kg for figures)
 * @returns Full cost breakdown with cheapest/most expensive comparison
 */
export function calculateProxyCosts(
  priceJpy: number,
  weightKg: number = DEFAULT_ITEM_WEIGHT_KG
): CostEstimates {
  const shipping = estimateShipping(weightKg)
  const breakdown: Record<string, CostBreakdown> = {}

  let cheapestProxy = ''
  let cheapestTotal = Infinity
  let mostExpensiveProxy = ''
  let mostExpensiveTotal = 0

  for (const [key, proxy] of Object.entries(PROXY_SERVICES)) {
    // Base: item + typical domestic shipping
    const subtotal = priceJpy + DOMESTIC_SHIPPING_JPY

    // Proxy fees
    const service = proxy.serviceFee
    const fx = Math.round(subtotal * proxy.fxMarkup)
    const payment = Math.round(subtotal * proxy.paymentFee)

    let totalJpy = subtotal + service + fx + payment + shipping

    // US customs: duty applies to value exceeding de minimis
    const totalUsdPreDuty = totalJpy / JPY_USD_RATE
    let duty = 0
    if (totalUsdPreDuty > US_DE_MINIMIS_USD) {
      duty = Math.round((totalUsdPreDuty - US_DE_MINIMIS_USD) * US_DUTY_RATE * JPY_USD_RATE)
      totalJpy += duty
    }

    breakdown[key] = {
      proxy: proxy.name,
      item_jpy: priceJpy,
      fees_jpy: service + fx + payment,
      shipping_jpy: shipping + DOMESTIC_SHIPPING_JPY,
      duty_jpy: duty,
      total_jpy: totalJpy,
      total_usd: Math.round((totalJpy / JPY_USD_RATE) * 100) / 100,
    }

    if (totalJpy < cheapestTotal) {
      cheapestTotal = totalJpy
      cheapestProxy = proxy.name
    }
    if (totalJpy > mostExpensiveTotal) {
      mostExpensiveTotal = totalJpy
      mostExpensiveProxy = proxy.name
    }
  }

  return {
    cheapest_proxy: cheapestProxy,
    cheapest_total_jpy: cheapestTotal,
    cheapest_total_usd: Math.round((cheapestTotal / JPY_USD_RATE) * 100) / 100,
    most_expensive_proxy: mostExpensiveProxy,
    most_expensive_total_jpy: mostExpensiveTotal,
    savings_jpy: mostExpensiveTotal - cheapestTotal,
    savings_usd: Math.round(((mostExpensiveTotal - cheapestTotal) / JPY_USD_RATE) * 100) / 100,
    breakdown,
  }
}

/**
 * Format JPY price with yen symbol.
 */
export function formatJpy(yen: number): string {
  return `¥${yen.toLocaleString()}`
}

/**
 * Convert JPY to USD string.
 */
export function formatUsd(yen: number): string {
  return `$${(yen / JPY_USD_RATE).toFixed(2)}`
}

/**
 * Quick USD estimate (no formatting).
 */
export function jpyToUsd(yen: number): number {
  return Math.round((yen / JPY_USD_RATE) * 100) / 100
}
