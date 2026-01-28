# How Buying from Japan Actually Works

*A guide for understanding the international Japanese goods market — why it's broken and how we fix it.*

---

## The Problem: You Can't Just "Buy" from Japan

Most Japanese marketplaces **don't ship internationally**. They're domestic-only:

| Platform | Ships International? | Why Not? |
|----------|---------------------|----------|
| Mercari Japan | ❌ No | Domestic C2C marketplace |
| Yahoo Auctions Japan | ❌ No | Domestic auction site |
| Suruga-ya | ❌ No (mostly) | Used goods retailer |
| Rakuten | ⚠️ Some sellers | Hit or miss |
| AmiAmi | ✅ Yes | One of the few! |
| Mandarake | ✅ Yes | Collectibles specialist |

**The result:** 80% of Japanese goods require a **proxy service** or **forwarding service** to purchase.

---

## What is a Proxy Service?

A proxy service is a middleman that:
1. **Buys the item for you** in Japan (using their Japanese address)
2. **Receives it** at their warehouse
3. **Ships it to you** internationally

```
You ──► Proxy Service ──► Japanese Seller
         (in Japan)

Japanese Seller ──► Proxy Warehouse ──► You
                    (consolidation)     (international shipping)
```

### Major Proxy Services

| Service | Trustpilot | Known For |
|---------|-----------|-----------|
| **Buyee** | 3.6/5 ⭐ | Market leader, hidden fees |
| **FromJapan** | 4.3/5 ⭐ | Best UI, expensive shipping |
| **ZenMarket** | 4.1/5 ⭐ | Slow processing |
| **Neokyo** | 4.6/5 ⭐ | Lowest fees, Discord community |
| **Sendico** | 4.0/5 ⭐ | Budget option |

---

## The Fee Structure (Why It's Confusing)

Every proxy charges multiple fees. Here's the breakdown:

### 1. Service Fee (5-10%)
Charged on the item price. Some proxies hide this.

### 2. Domestic Shipping (¥500-1500)
Seller → Proxy warehouse. Usually paid by buyer unless "送料込み" (shipping included).

### 3. Payment Processing (3-5%)
Credit card fees, PayPal fees, currency conversion.

### 4. Currency Conversion Markup (0-8.5%)
**This is where proxies hide profit.** They don't use the real exchange rate.

Example:
- Real rate: $1 = ¥150
- Buyee rate: $1 = ¥138 (8.5% worse for you)

### 5. International Shipping (¥1500-5000+)
Proxy warehouse → You. Varies by weight, size, speed.

### 6. "Optional" Fees
- Inspection fee (¥200-500)
- Repackaging fee (¥300-500)
- Photo request fee (¥100-300)
- Storage fee (after X days)
- Insurance

### 7. Import Duties & Taxes
Your country may charge import tax. USA: usually free under $800. EU: VAT on everything.

---

## Example: Real Cost Breakdown

**Item:** Nendoroid figure, ¥3,500 on Mercari Japan

| Fee Type | Buyee | Neokyo | Direct (if possible) |
|----------|-------|--------|----------------------|
| Item price | ¥3,500 | ¥3,500 | ¥3,500 |
| Service fee | ¥350 (10%) | ¥280 (8%) | ¥0 |
| Domestic shipping | ¥700 | ¥700 | ¥700 |
| FX markup | ~¥400 (hidden) | ~¥0 | ¥0 |
| International ship | ¥2,000 | ¥1,800 | N/A |
| **TOTAL** | **¥6,950** | **¥6,280** | **N/A** |
| **In USD** | **~$46** | **~$42** | — |

**The same ¥3,500 item costs $42-46 landed.** That's a 70-90% markup from the item price.

---

## Key Japanese Terms to Know

### Condition Terms
| Japanese | Romaji | English |
|----------|--------|---------|
| 新品、未使用 | Shinpin, mishiyou | New, unused |
| 未開封 | Mikaifu | Unopened/Sealed |
| 開封済み | Kaifuzumi | Opened |
| 未使用に近い | Mishiyou ni chikai | Like new |
| 目立った傷や汚れなし | Medatta kizu ya yogore nashi | No visible damage |
| やや傷や汚れあり | Yaya kizu ya yogore ari | Some damage |
| 箱なし | Hako nashi | No box |
| 箱付き | Hako tsuki | With box |
| ジャンク | Janku | Junk/For parts |

### Shipping Terms
| Japanese | Romaji | English |
|----------|--------|---------|
| 送料込み | Souryou komi | Shipping included (seller pays) |
| 送料別 | Souryou betsu | Shipping separate (buyer pays) |
| 着払い | Chakubarai | Cash on delivery |
| 匿名配送 | Tokumei haisou | Anonymous shipping |

### Listing Terms
| Japanese | Romaji | English |
|----------|--------|---------|
| 即購入OK | Soku kounyuu OK | Buy immediately OK |
| コメント必須 | Komento hissu | Must comment before buying |
| 取り置き | Torioki | Reserved/On hold |
| 値下げ | Nesage | Price reduction |
| バラ売り不可 | Barauri fuka | No splitting sets |

---

## The Purchase Flow (How It Actually Works)

### Without Majikari (Current State)

```
1. Find item on Mercari JP (hard — Japanese UI, no recommendations)
2. Copy URL
3. Go to proxy site (Buyee, Neokyo, etc.)
4. Paste URL, create order
5. Proxy buys item for you
6. Wait for item to arrive at proxy warehouse (2-7 days)
7. Pay international shipping
8. Wait for international delivery (7-21 days)
9. Maybe pay import duties
```

**Total time:** 2-4 weeks
**Total confusion points:** Many

### With Majikari (Our Vision)

```
1. Search/browse on Majikari (unified, English, recommendations)
2. See total landed cost UPFRONT
3. Click "Buy via Neokyo" (or other partner)
4. Pre-filled order on partner site
5. Same fulfillment flow, but transparent
```

**We are NOT a proxy.** We are a discovery + transparency layer.

---

## How Users Actually Purchase (Our Model)

### Option A: Affiliate/Redirect (MVP)

User finds item on Majikari → Clicks "Buy" → Redirected to Neokyo/Buyee with item pre-filled

**We earn:** Affiliate commission (if partnership exists) or nothing (just value-add)

**User experience:** Still have to complete purchase on proxy site

### Option B: Deep Integration (Future)

User finds item → Clicks "Buy" → Majikari handles proxy order via API → Single checkout

**We earn:** Service fee or markup

**User experience:** One-click purchase

### Option C: Become a Proxy (Far Future)

We handle the entire flow — buying, warehousing, shipping.

**We earn:** Full margin

**User experience:** Amazon-like

---

## Why Neokyo is the Best Partner

| Factor | Neokyo | Buyee |
|--------|--------|-------|
| Service fee | 8% | 10% |
| FX markup | 0% (real rate) | 3-8.5% |
| Trustpilot | 4.6/5 | 3.6/5 |
| Community | 7K Discord | None |
| Transparency | High | Low |
| API access | Unknown | Unknown |

**Recommendation:** Partner with Neokyo first. Aligned values (transparency), good reputation, active community.

---

## Why This Market is Hard to Navigate

1. **Language barrier** — Most sites are Japanese-only
2. **No unified search** — Each platform is siloed
3. **Hidden fees** — Proxies profit from confusion
4. **No recommendations** — You must know exactly what you want
5. **Trust issues** — Bootlegs, scams, seller reliability
6. **Shipping complexity** — Consolidation, customs, duties
7. **Time zones** — Auctions end at weird hours

**Majikari's job:** Remove friction from #1, #2, #3, #4. Partner to solve #5, #6, #7.

---

## Glossary of Market Terms

| Term | Definition |
|------|------------|
| **Proxy** | Service that buys items in Japan on your behalf |
| **Forwarder** | Service that only handles shipping (you buy directly) |
| **Consolidation** | Combining multiple items into one shipment |
| **Landed cost** | Total cost including item + all fees + shipping + duties |
| **FX spread** | Difference between real exchange rate and what you're charged |
| **Ichiban Kuji** | Japanese lottery prizes (7-11, Lawson) — popular collectibles |
| **Prize figure** | Arcade crane game prizes — lower quality, cheap |
| **Scale figure** | High-quality collectible (1/7, 1/8 scale) — expensive |
| **Nendoroid** | Chibi-style figures by Good Smile Company |
| **Grail** | Rare, highly sought-after item |
| **MFC** | MyFigureCollection.net — figure database and community |

---

*Document created: January 28, 2026*
*For internal reference and user education*
