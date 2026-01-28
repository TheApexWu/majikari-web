/**
 * Majikari Landing Page
 * 
 * Simple MVP landing with:
 * 1. Hero + value prop
 * 2. Savings Calculator (the viral tool)
 * 3. Email capture
 */

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          マジカリ
          <span className="block text-2xl font-normal text-gray-400 mt-2">
            Stop Overpaying for Japanese Goods
          </span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Proxy services hide their fees. We expose them.
          <br />
          See the <strong>real</strong> total cost before you buy.
        </p>
        
        {/* Calculator CTA */}
        <div className="bg-gray-800 rounded-xl p-8 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">
            🔍 Savings Calculator
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Paste any Mercari JP or Yahoo Auctions link
          </p>
          
          <form className="flex gap-2">
            <input
              type="url"
              placeholder="https://jp.mercari.com/item/..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              Calculate
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-4">
            We'll show you the total landed cost vs Buyee, ZenMarket, and others
          </p>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-sm">
          Built by a collector who spent his first paycheck on a Touhou figure
        </p>
      </section>
      
      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          Why Collectors Overpay
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">💱</div>
            <h3 className="font-semibold mb-2">Hidden FX Markup</h3>
            <p className="text-gray-400 text-sm">
              Buyee charges 3-8.5% on currency conversion. They don't tell you upfront.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-semibold mb-2">Shipping Markup</h3>
            <p className="text-gray-400 text-sm">
              Oversized boxes, premium courier "upgrades," surprise fees at checkout.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🎭</div>
            <h3 className="font-semibold mb-2">"Service" Fees</h3>
            <p className="text-gray-400 text-sm">
              Inspection fees, repackaging fees, storage fees — death by a thousand cuts.
            </p>
          </div>
        </div>
      </section>
      
      {/* Email Capture */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Get Early Access
        </h2>
        <p className="text-gray-400 mb-6">
          Visual search + price alerts coming soon
        </p>
        
        <form className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition"
          >
            Join Waitlist
          </button>
        </form>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>Majikari (マジカリ) — The Real Deal on Japanese Goods</p>
      </footer>
    </main>
  )
}
