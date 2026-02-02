import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Majikari マジカリ — Know What It Actually Costs to Buy from Japan',
  description: 'Price intelligence for Japanese collectibles. Track Mercari JP listings, compare proxy fees, see the real landed cost.',
  keywords: ['anime figures', 'japanese collectibles', 'mercari japan', 'proxy service', 'buyee alternative', 'nendoroid', 'figure prices'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
