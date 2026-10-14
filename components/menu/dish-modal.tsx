// CLIENT COMPONENT: closing the modal means going BACK in history
// (router.back()), and the router only exists in the browser.
'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Dialog } from '@/components/ui/dialog'

/**
 * The quick-view shell for an intercepted /menu/[slug].
 *
 * Only the SHELL is client code. The dish itself (photo, description, tags,
 * credit) arrives as `children`, and its name as `title`, both rendered on
 * the server (and streamed in, so the dialog can open at once). The same
 * <DishDetail> Server Component fills the full dish page, so the modal and
 * the page can't drift apart.
 *
 * Closing (Esc, ×, backdrop) calls router.back(): the URL goes back to
 * /menu, the @modal slot renders nothing again, and the menu behind it was
 * never re-rendered, so you're still scrolled to where you were.
 */
export function DishModal({ title, children }: { title: ReactNode; children: ReactNode }) {
  const router = useRouter()
  return (
    <Dialog open onClose={() => router.back()} title={title}>
      {children}
    </Dialog>
  )
}
