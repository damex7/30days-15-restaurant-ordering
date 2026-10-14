// CLIENT COMPONENT: a timer and the page-visibility API, both browser-only.
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const EVERY_MS = 20_000

/*
  router.refresh() asks the server to render this page again, with a fresh
  read of the cookie and the clock, and merges the result in WITHOUT a full
  reload: scroll position and client state stay as they are. The status
  tracker moves on, because the server worked out a new stage.

  The polling pauses while the tab is hidden (no point refreshing a page
  nobody is looking at) and stops for good once the order is completed:
  the server passes `active={false}`, plain data, never a function.
*/
export function OrderAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    let timer: ReturnType<typeof setInterval> | undefined
    const start = () => {
      clearInterval(timer)
      timer = setInterval(() => router.refresh(), EVERY_MS)
    }
    const onVisibility = () => {
      if (document.hidden) clearInterval(timer)
      else {
        router.refresh() // catch up straight away when you come back
        start()
      }
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, router])

  return null
}
