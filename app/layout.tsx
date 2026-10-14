// ROOT LAYOUT: the one layout every route shares. It holds only what every
// page needs: <html>/<body>, fonts, the no-flash theme script and the skip
// link. The header, footer and cart live one level down in app/(shop), so
// the root stays small and free of client state.
//
// SERVER COMPONENT (the default in the App Router): no "use client", no
// state, no browser APIs. It renders to HTML on the server and adds no
// JavaScript of its own.

import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Work_Sans } from 'next/font/google'
import { site } from '@/lib/site'
import { themeScript } from '@/lib/theme'
import './globals.css'

// next/font downloads the fonts at build time and serves them from this
// site: no request to Google from the customer's phone and no layout jump.
//
// GLYPH CHECK: both fonts were chosen after parsing their character maps for
// ₦ (U+20A6) and the Yoruba letters ẹ ọ and the combining marks that stack
// tones on them (Ẹ̀fọ́ rírò, Mọ́ín-mọ́ín). Many popular fonts have no ₦ at
// all. The `vietnamese` subset carries the dot-below letters and marks.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-bricolage',
  axes: ['opsz', 'wdth'],
})
const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-work-sans',
})

export const metadata: Metadata = {
  title: {
    default: `${site.name}: ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: { siteName: site.name, type: 'website', locale: 'en_NG' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf3e4' },
    { media: '(prefers-color-scheme: dark)', color: '#16110e' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-NG"
      // The <head> script sets data-theme before React loads, so the server's
      // <html> and the browser's may differ ON PURPOSE. This silences that
      // one expected warning, for this element's attributes only.
      suppressHydrationWarning
      className={`${bricolage.variable} ${workSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        {/* SKIP LINK: the first Tab stop on every page. Layouts put id="main" on <main>. */}
        <a
          href="#main"
          className="sr-only z-50 rounded-control bg-palm px-4 py-2 font-semibold text-palm-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
