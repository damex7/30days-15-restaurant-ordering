// ERROR BOUNDARY: must be a Client Component. It catches errors thrown while
// rendering this segment and needs a button that works (retry).
'use client'

import { useEffect } from 'react'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { site } from '@/lib/site'

/**
 * Something went wrong while showing an order (not "no such order": that's
 * not-found.tsx). The order itself was already placed, so the message says
 * so, and gives the phone number: a public NEXT_PUBLIC_ variable, the only
 * kind a Client Component can read.
 */
export default function OrderError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <EmptyState
      icon="alert"
      title="We couldn’t load your order just now"
      action={
        <button type="button" onClick={() => retry()} className={buttonClass()}>
          Try again
        </button>
      }
    >
      <p>
        If you placed it, it’s with the kitchen. You can also call us on <a href={`tel:${site.publicPhone.replace(/\s/g, '')}`} className="font-semibold underline">{site.publicPhone}</a>.
      </p>
    </EmptyState>
  )
}
