import Link from 'next/link'
import WaitlistForm from '@/components/WaitlistForm'
import Calculator from '@/components/Calculator'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            マジカリ
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/discover" className="text-zinc-400 hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/products" className="text-zinc-400 hover:text-white transition-colors">
              Products
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            The real price of
            <br />
            Japanese collectibles.
          </h1>
          <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
            Proxy services bury their fees in fine print. We surface the true
            landed cost — so you know what you{"'"}re actually paying before you buy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Browse Catalog
            </Link>
            <a
              href="#waitlist"
              className="px-6 py-3 border border-zinc-700 text-white font-medium rounded-lg hover:border-zinc-500 transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <Calculator />
      </section>

      {/* Problem */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">
          Why collectors overpay
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: '💱',
              title: 'Hidden FX Markup',
              desc: "Buyee charges 3-8.5% on currency conversion. They don't tell you upfront.",
            },
            {
              icon: '📦',
              title: 'Inflated Shipping',
              desc: 'Oversized boxes, premium courier "upgrades," surprise fees at checkout.',
            },
            {
              icon: '🧾',
              title: 'Service Fee Stack',
              desc: 'Inspection, repackaging, storage — death by a thousand cuts.',
            },
          ].map((item) => (
            <div key={item.title} className="p-6 border border-zinc-800 rounded-lg">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we cover */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800/50">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">
          Catalog Coverage
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { count: '7,300+', label: 'Good Smile products', sub: 'Nendoroid, figma, scales' },
            { count: 'Soon', label: 'Kotobukiya', sub: 'ARTFX, Bishoujo, Frame Arms' },
            { count: 'Soon', label: 'Bandai Spirits', sub: 'S.H.Figuarts, Robot Spirits' },
            { count: 'Soon', label: 'MegaHouse', sub: 'G.E.M., Variable Action, Lookup' },
          ].map((mfr) => (
            <div key={mfr.label} className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="text-2xl font-bold">{mfr.count}</div>
              <div className="mt-1 font-medium text-sm">{mfr.label}</div>
              <div className="mt-1 text-xs text-zinc-500">{mfr.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="max-w-5xl mx-auto px-6 py-20 border-t border-zinc-800/50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold">Get early access</h2>
          <p className="mt-3 text-zinc-400">
            Visual search, price alerts, and multi-marketplace comparison — launching soon.
          </p>
          <div className="mt-6">
            <WaitlistForm source="landing-bottom" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-600">
          <span>Majikari (マジカリ)</span>
          <span>Built by a collector, for collectors</span>
        </div>
      </footer>
    </main>
  )
}
