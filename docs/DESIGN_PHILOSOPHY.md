# Design Philosophy

## Product Identity
Majikari is a decision engine, not a comparison tool.

Users don't want to compare 4 proxy services. They want to know: "What will I actually pay, and should I buy it?" We answer that.

## UX Principles

### 1. One Answer, Not a Spreadsheet
Show the total landed cost through the best proxy. The breakdown is available but collapsed. The default state is: "You'll pay $57 via Neokyo."

### 2. Verdicts Over Numbers
Don't make users do math. Instead of "Buyee: $59, Neokyo: $57, ZenMarket: $58, FromJapan: $57.50" — say "Neokyo saves you $2 over Buyee. Go with whichever you have an account with."

### 3. Quality First
Collectors searching "Touhou" want figures and fumos, not ¥300 badge pins. Quality scoring surfaces what matters. Low-value items aren't hidden, just ranked appropriately.

### 4. Don't Create Doubt
The worst outcome: user sees "$57 total," clicks to Mercari, sees "¥4,780," and freezes. Our job is to build enough confidence that the click-through feels like confirmation, not a leap of faith.

## Visual Direction

### DO
- Clean, editorial typography
- Restrained color palette (monochrome with one accent)
- Generous whitespace
- Subtle hover states
- Product images large enough to inspect
- Code that looks intentional when viewed source

### DON'T
- Emoji in UI chrome
- Rounded pill buttons everywhere
- Gradient backgrounds
- Generic Inter/system font stack
- Tutorial-style code comments
- Default Tailwind component patterns that scream "template"

## The Standard
If someone inspects the source and thinks "AI wrote this," we failed.
If someone uses the tool and thinks "I know exactly what to do," we succeeded.
