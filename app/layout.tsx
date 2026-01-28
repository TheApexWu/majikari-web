import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Majikari (マジカリ) — Stop Overpaying for Japanese Goods',
  description: 'See the real total cost of Japanese collectibles. Compare proxy services. Never overpay again.',
  keywords: ['anime figures', 'japanese collectibles', 'mercari japan', 'proxy service', 'buyee alternative'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  )
}
