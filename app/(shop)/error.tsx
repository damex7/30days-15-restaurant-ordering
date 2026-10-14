// ERROR BOUNDARY for every shop page: must be a Client Component, because it
// has a working "Try again" button and receives the error as it happens.
'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Shown in place of the page (the header and footer stay) when rendering
 * throws. `retry` (stable since Next.js 16.3) asks the server for the
 * segment again and re-renders it; `reset` would only re-render what the
 * browser already has, which rarely fixes a server-side failure.
 *
 * In production `error.message` is replaced by a generic text and a
 * `digest`, so server details never reach the browser. The digest matches
 * the line in the server log.
 */
export default function ShopError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <EmptyState
      icon="alert"
      title="Something went wrong on our side"
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className={buttonClass()}>
            Try again
          </button>
          <Link href="/" className={buttonClass({ variant: 'secondary' })}>
            Go to the home page
          </Link>
        </div>
      }
    >
      <p>Your cart is safe in this browser. {error.digest && <span className="text-xs text-subtle">(Reference {error.digest})</span>}</p>
    </EmptyState>
  )
}
