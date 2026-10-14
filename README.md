# Bùkà: order Nigerian food from one Abuja kitchen

**Day 15 of my 30-day dev challenge.** A *bùkà* is a no-nonsense Nigerian canteen: enamel plates, a pot of red stew, a menu board on the wall. This one takes orders online for delivery across Abuja, pickup at the counter, or dine-in from a QR code on your table.

The features are real, but **today's lesson is Server and Client Components**: *where* each piece of code runs, and why. Every component file starts with a comment saying which side it runs on and the reason. The server owns the menu, the prices, the clock and the secrets. The browser owns the cart. Only plain data crosses between them.

> **Sample content.** Bùkà is a fictional restaurant. The menu, prices, hours and delivery areas in `/data` were written for this demo. The dish photos are real, from Wikimedia Commons, and credited on every dish page and on `/credits`. No payment is taken: every order is "pay when it reaches you".

---

## What it does

| Page | What you can do |
| --- | --- |
| `/` | Open/closed status in Lagos time, today's specials (streamed in), customer favourites, hours |
| `/menu` | 30 dishes in 6 categories, search and diet filters kept in the URL, category tabs that follow your scroll |
| `/menu/[slug]` | Full dish page: photo and credit, choices that change the price (protein, soup, extras, portion), quantity, add to cart |
| (dish quick view) | Tap a dish on `/menu` and it opens in a modal over the menu, with the same URL; refresh and you get the full page |
| `/cart` | Edit quantities, remove lines, choose delivery (area, fee, ETA), pickup or dine-in; live totals; what's stopping checkout |
| `/checkout` | Name, Nigerian phone number, address or pickup slot or table, payment method, a note for the kitchen |
| `/order/[id]` | Receipt, a status tracker that moves on by itself, the expected time, a pre-filled WhatsApp link |
| `/table/[number]` | Where each table's QR code points (1–12): switches the cart to dine-in at that table |
| `/credits` | Photo credits, as the CC BY / BY-SA licences ask |

## Run it

```bash
npm install          # also runs `next typegen` (route types for PageProps)
cp .env.example .env.local   # then set ORDER_COOKIE_SECRET
npm run dev          # http://localhost:3000

npm run typecheck    # next typegen && tsc --noEmit
npm run lint
npm run build && npm start
```

Testing at night? Set `BUKA_CLOCK=13:00` in `.env.local` and the server's Lagos clock starts at 1pm. Set `BUKA_TIME_SCALE=0.05` to watch an order go from "received" to "delivered" in a few minutes instead of an hour.

Stack: **Next.js 16.4** (App Router, Turbopack, Cache Components, Partial Prefetching), **React 19.3**, **TypeScript 5.9** (`strict` + `noUncheckedIndexedAccess`), **Tailwind CSS 4.3**, **Zod 4.6**. No UI libraries: the icons, dialog and components are all in this repo.

---

## Where code runs

### The module map

| File | Runs | Why |
| --- | --- | --- |
| `lib/data.ts` | **server-only** | The only file that reads `/data`. Holds the kitchen's private notes today, a database password on Day 16 |
| `lib/clock.ts` | **server-only** | "Is the kitchen open?" must be the server's answer, in Lagos time, never a phone's |
| `lib/order-cookie.ts` | **server-only** | Holds the HMAC signing secret |
| `lib/whatsapp.ts` | **server-only** | Reads `RESTAURANT_WHATSAPP` |
| `app/(shop)/checkout/actions.ts` | **server** (`'use server'`) | The `placeOrder` Server Action |
| `lib/cart/store.ts` | **client-only** | localStorage only exists in the browser |
| `lib/pricing.ts` | **shared** | The same `priceLine()` previews prices in the cart and decides the real total in the Server Action |
| `lib/hours.ts`, `lib/money.ts`, `lib/search-params.ts`, `lib/order-status.ts`, `lib/schema/*` | **shared** | Pure functions and schemas: no clock, no storage, no secrets |

`server-only` and `client-only` turn a mistake into a build error instead of a leak. See [server-only in action](#server-only-in-action) below.

### Client Components, and the one reason each one exists

| Component | Why it can't be a Server Component |
| --- | --- |
| `CartProvider` | React context and state that changes as you shop, saved to localStorage |
| `CartBadge`, `TableChip`, `StickyCartBar` | Read the cart (context) |
| `AddToCartButton` | `onClick` and a short "Added ✓" state |
| `DishOptionsForm` | Radios and checkboxes that change a live price |
| `CategoryTabs` | Watches the scroll position (IntersectionObserver) |
| `AutoSubmit` | Submits the filter form as you type or tick |
| `Dialog`, `DishModal` | `showModal()` on the native `<dialog>`, and `router.back()` to close |
| `CartView` | The cart is in this browser's localStorage |
| `CheckoutForm` | `useActionState`, `useFormStatus`, focus management for errors |
| `OrderAutoRefresh` | A timer and the page-visibility API |
| `ClearCartOnPlaced`, `StartTableOrder` | Write to localStorage when the page opens |
| `ThemeToggle` | Clicks, the OS colour preference and localStorage |
| every `error.tsx`, `global-error.tsx` | Error boundaries must be; they have a working "Try again" |

**Everything else is a Server Component**: every page and layout, the header and footer, `DishCard`, `DishPhoto` (next/image), `DietaryTags`, `MenuSection`, `MenuResults`, `MenuFilters`, `TodaysSpecials`, `OpenStatus`, `OpeningHours`, `DishDetail`, `Receipt`, `StatusTracker`, the skeletons, `EmptyState` and `Icon`. The menu page ships no code for any of them.

### Three patterns worth knowing

**1. Islands.** `SiteHeader` is a Server Component that renders three small Client Components: the cart badge, the table chip and the theme toggle. A Server Component may render a Client Component. The reverse, a Client Component *importing* a Server Component, isn't allowed.

**2. Server content inside a Client Component.** `CategoryTabs` needs JavaScript; the menu it wraps doesn't. The menu page renders every `MenuSection` on the server and passes them to the tabs as `children`. The tabs place them and observe `[data-category]` in the DOM; they never render them. The same trick makes the dish modal work: `DishModal` (client) receives `DishDetail` (server) as children. And `CartProvider` wraps the whole shop without turning any page into client code.

**3. Only data crosses, and one kind of function.** Props from a Server Component to a Client Component must be serializable. So:

- `AddToCartButton` gets `dishId` and `dishName`, not an `onAdd={() => …}` (that fails with *"Functions cannot be passed directly to Client Components"*). It gets the behaviour from `useCart()`, which already lives on the client.
- `CartProvider` gets the price catalogue (plain objects) once, from the shop layout. `DishOptionsForm` then needs only an ID.
- `CheckoutForm` gets `action={placeOrder}`: a **Server Action is the one function that can cross**, because what crosses is a reference to an endpoint, not code.
- Times arrive as finished strings ("5:30pm"), formatted in Lagos time on the server. React *could* send a `Date`, but the browser would format it with the phone's time zone and locale, and the text would no longer match the server's HTML.

---

## Rendering and caching

With Cache Components, nothing is cached unless you say so, and anything that reads the request or the clock must sit inside `<Suspense>`. `next build` then gives each page a static shell with holes that stream in per request:

```
┌ ◐ /                     static hero, favourites, hours │ streamed: open/closed, today's specials
├ ○ /cart                 fully static: the cart itself is filled in by the browser
├ ◐ /checkout             static heading │ streamed: pickup slots and kitchen status (the clock)
├ ○ /credits              fully static
├ ◐ /menu                 static heading and skeletons │ streamed: specials, and the results for ?q=&diet=
├ ○ /menu/[slug]          30 static dish pages (generateStaticParams)
├ ○ /menu/(.)[slug]       30 static quick views for the modal
├ ◐ /order/[id]           static shell │ streamed: the cookie, the clock, the status
└ ○ /table/[number]       12 static table pages
○ Static   ◐ Partial Prerender (static shell + streamed holes)
```

- **The menu data is cached** (`'use cache'` + `cacheLife('max')` in `lib/data.ts`). `getMenuSections(query)` takes the parsed URL as an argument, so each filter combination is worked out once.
- **The menu page doesn't `await searchParams` itself.** It passes the promise down to `<MenuResults>`, inside `<Suspense>`. If the page awaited it, the whole page would depend on the URL and nothing could be prerendered.
- **Today's specials are deliberately *not* cached.** `getTodaysSpecials()` reads the Lagos weekday and takes 1.5 s (a stand-in for a slow supplier API). With `'use cache'`, that 1.5 s would be paid once at build time and "today" would be frozen as the build day. Without it, the page sends its shell straight away, and the specials stream into the same response when they're ready. No client-side fetch, no `useEffect`.
- **The clock.** `now()` in `lib/clock.ts` calls `await io()` first, the 16.3+ way to say "real I/O follows, don't bake this into the shell". Without it, reading `new Date()` fails the build with a blocking-current-time error.
- **The dish page stays static.** "Cooked from 4pm" is printed as plain text; whether suya is available *right now* is checked by the Server Action at order time.

### Things I learned the hard way today

- **Activity keeps hidden pages mounted.** With Cache Components, Next.js hides the page you leave with React's `<Activity>` instead of unmounting it. My dish modal closed its URL but stayed open: a native modal `<dialog>` left open makes the *whole page behind it inert*. The fix is a `useLayoutEffect` cleanup in `Dialog` that closes it (with the `close` listener removed first, so it doesn't count as the user closing it). Forward reopens it.
- **A late-hydrating Suspense boundary can see the "real" cart too early.** The sticky cart bar sits in its own `<Suspense>` (it uses `usePathname`). It hydrated *after* the provider had already switched from "cart unknown" to the localStorage cart, rendered "3 items" over server HTML that said nothing, and React reported a hydration error. `useCart()` now has a tiny per-component guard (`useSyncExternalStore` returning `false` during that component's own hydration), so every consumer starts from "cart unknown", wherever it sits.
- **A 404 inside a stream is a 200.** For a dish slug that wasn't prerendered (`/menu/pizza`), the first response is served from the fallback shell, so streaming has already started when `notFound()` runs. The status stays `200`, with the not-found UI and `<meta name="robots" content="noindex">`. Next.js then stores that result, and every later visit gets a real `404`. `/table/99` behaves the same way.

---

## Never trust the client

The browser sends `items` as IDs, choices and quantities only, plus `clientTotalKobo`, the total it showed. `placeOrder` treats all of it as claims:

1. **Parse** the form with Zod (`CheckoutSchema`, a discriminated union on the order type). Unknown keys, like a smuggled `"priceKobo": 1`, are stripped. Phone numbers in any common format become `+234…`.
2. **Re-price** every line with `priceLine()` from the server's own catalogue: unknown dish or option, sold out, missing required choice, too many extras.
3. **Re-check time and place** with the server's clock: is the kitchen open (for delivery and dine-in), is the pickup slot still in `pickupSlots(now)`, is a grill item being cooked yet (at the pickup time, for pickup), does the area or table exist, is the delivery minimum met.
4. On any problem, return `{ errors, fieldErrors, values }`. `useActionState` shows an error summary (focused, `role="alert"`) and an error under each field (`aria-describedby`), and the form keeps what you typed.
5. Build the receipt with the **server's** numbers. If `clientTotalKobo` differs, the order goes through at the real price and the receipt says *"We used today's prices"*.
6. Print a kitchen ticket with the private `kitchenNotes` to the server log, the only place they're ever read. Set the signed cookie. Then `redirect()`, outside any try/catch, because it works by throwing.

**Try it:** on `/checkout`, edit the hidden `items` input in DevTools (change a quantity, add `"priceKobo":1`) and the `clientTotalKobo` input (set it to `100`), then place the order. In my test the cart showed ₦1, and the receipt charged ₦19,600 (3 × ₦6,200 + ₦1,000) with the notice.

### The order cookie

There's no database until Day 16, so the receipt lives in a cookie, `buka-order.<id>`:

```
base64url(order JSON) . base64url(HMAC-SHA256(ORDER_COOKIE_SECRET, that text))
```

It's **signed, not encrypted**: customers may read their own receipt, but changing one character breaks the signature. The order page checks the ID format, verifies the HMAC with `timingSafeEqual`, then parses the JSON with Zod. A missing, expired, forged or edited cookie all give the same "We can't find that order". The cookie is `httpOnly`, `sameSite: 'lax'`, `secure` in production, lasts 6 hours, and must stay under 3.8 KB (the action refuses bigger orders politely).

The status tracker has no kitchen screen behind it yet: the stages follow a timetable fixed at order time, the server works out the current stage from its clock, and `OrderAutoRefresh` calls `router.refresh()` every 20 seconds (paused while the tab is hidden, stopped once the order is completed). The page updates in place, with no full reload.

---

## server-only in action

To prove the guard works, I imported `lib/data.ts` into `CartBadge` (a Client Component) and ran `next build`. It failed with 14 errors, starting with:

```
./lib/data.ts:13:1
Error: 'server-only' cannot be imported from a Client Component module

  12 | // kitchen's notes today, a database password on Day 16.
> 13 | import 'server-only'
     | ^^^^^^^^^^^^^^^^^^^^

Import traces:
  Client Component Browser:
    ./lib/data.ts [Client Component Browser]
    ./components/cart/cart-badge.tsx [Client Component Browser]
    ./components/cart/cart-badge.tsx [Server Component]
    ./components/site/site-header.tsx [Server Component]
    ./app/(shop)/layout.tsx [Server Component]
```

and, for every cached function in the file, *"It is not allowed to define inline "use cache" annotated functions in Client Components."* The trace shows exactly which import chain dragged the file into the browser bundle. (The same check fires for `lib/clock.ts`, which `data.ts` imports.) I then reverted the import.

---

## Measurements

From `next start`, summing the `<script>` files each page loads (gzipped):

| Page | Client JS | HTML over the wire (gzip) |
| --- | --- | --- |
| `/menu` | 223 KB | 49 KB |
| `/menu/party-jollof` | 222 KB | |
| `/cart` | 224 KB | 8 KB |
| `/credits` (no client code of its own) | 215 KB | |

What that tells me, honestly:

- **About 156 KB is in three chunks every page loads**, mostly React DOM and the Next.js router. The menu's 30 dish cards, photos and tags add almost nothing, because they're Server Components: the menu costs about 8 KB more than `/credits`.
- **The biggest app-specific chunk, about 36 KB, is Zod plus the cart store.** Zod reaches the browser because the cart validates what it reads back from localStorage. That validation is worth having (see Day 14), but `zod/mini` would be a cheaper way to do it. That's a good follow-up.
- On partially prerendered pages, the price catalogue (about 16 KB before compression) appears twice in the HTML, once in the static shell's payload and once in the resumed stream. It compresses well, but it's a reason to keep provider props small.

## Accessibility

- A skip link, one `<h1>` per page, and headings in order (page → section → dish).
- Every choice group is a `<fieldset>` with a `<legend>`; every input has a label; errors are linked with `aria-describedby` and `aria-invalid`.
- Cart changes are announced in a polite live region ("Added 2 × Party jollof rice to your cart").
- The status tracker is an ordered list with `aria-current="step"`; colour is never the only signal (spice levels and diet tags have words and icons).
- Visible focus rings everywhere; the modal returns focus to the card that opened it.
- `prefers-reduced-motion` turns off animations and smooth scrolling.
- Checked at 360 px wide with no horizontal scroll, in light and dark themes. The theme follows the OS, and a toggle saves your choice without a flash on reload.

## Out of scope

A database and accounts (Day 16), online payments, a shared kitchen dashboard, real delivery tracking, push notifications, a PWA, loyalty and promo codes.

## Photo credits

All dish photos come from [Wikimedia Commons](https://commons.wikimedia.org/) under CC0, CC BY or CC BY-SA licences. They were resized to at most 800 px wide and re-compressed. The full list, with authors and licence links, is in `data/photos.ts` and on the `/credits` page.
