/**
 * ListingRow — A single marketplace listing within a product card
 * 
 * Displays price, condition, risk indicators, and links to Mercari JP.
 */

import { JPY_USD_RATE, STAGGER_DELAY_MS } from '@/lib/constants'
import type { Listing } from '@/types'

interface ListingRowProps {
  listing: Listing
  index: number
}

export default function ListingRow({ listing, index }: ListingRowProps) {
  const usdEst = listing.price ? `~$${(listing.price / JPY_USD_RATE).toFixed(0)}` : ''
  const riskClass = listing.risk === 'high' ? 'risk-high' : listing.risk === 'medium' ? 'risk-med' : 'risk-low'
  
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`listing-row ${riskClass}`}
      style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
    >
      <div className="listing-top-row">
        <div className="listing-name">{listing.name}</div>
        <span className={`risk-badge ${riskClass}`}>
          {listing.risk === 'low' ? '✓' : listing.risk === 'high' ? '⚠' : '~'}
        </span>
      </div>
      <div className="listing-meta">
        <span className="listing-price">¥{listing.price.toLocaleString()}</span>
        <span className="listing-usd">{usdEst}</span>
        {listing.condition && <span className="listing-condition">{listing.condition}</span>}
        {listing.risk_flags.length > 0 && (
          <span className="listing-flags">{listing.risk_flags[0]}</span>
        )}
        <span className="listing-source">{listing.source_name}</span>
        <span className="listing-arrow">→</span>
      </div>
    </a>
  )
}
