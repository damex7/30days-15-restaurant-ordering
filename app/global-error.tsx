// GLOBAL ERROR: the last line of defence, for errors in the ROOT layout
// itself. It replaces the whole document, so it renders its own <html> and
// <body>, and it's a Client Component like every error boundary.
'use client'

import { site } from '@/lib/site'
import './globals.css'

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-NG">
      <body className="grid min-h-dvh place-items-center bg-paper p-6 text-center text-ink">
        <main className="max-w-md">
          <h1 className="text-3xl font-extrabold">Bùkà is having a moment</h1>
          <p className="mt-3 text-muted">
            The page couldn’t load. Please try again. To order by phone, call{' '}
            <a href={`tel:${site.publicPhone.replace(/\s/g, '')}`} className="font-semibold underline">
              {site.publicPhone}
            </a>
            .
          </p>
          {error.digest && <p className="mt-2 text-xs text-subtle">Reference {error.digest}</p>}
          <button type="button" onClick={() => retry()} className="mt-6 min-h-11 rounded-pill bg-palm px-5 font-semibold text-palm-ink">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
