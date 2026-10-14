// CLIENT COMPONENT: opening a native <dialog> as a modal needs its
// showModal() method, and that only exists on the DOM element in the browser.
'use client'

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'

type DialogProps = {
  open: boolean
  /** Called for every way of closing: Esc, the × button, a backdrop click. */
  onClose: () => void
  title: ReactNode
  size?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

/**
 * Dialog, built on the NATIVE <dialog> element (from Day 12).
 *
 * What the browser gives us for free with showModal():
 * - everything outside the dialog becomes inert (no clicking or tabbing
 *   behind it), so there's no hand-written focus trap;
 * - Esc closes it (we hear about it through the `close` event);
 * - it renders in the "top layer", above every z-index, so the sticky
 *   header and the cart bar can't cover it;
 * - a ::backdrop, styled in globals.css.
 *
 * What we add: syncing open/close with React, closing on a backdrop click,
 * labelling, and putting focus back on whatever opened it.
 */
export function Dialog({ open, onClose, title, size = 'lg', className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  /*
    Keep the DOM dialog in sync with the `open` prop, and listen for the
    native `close` event, which fires however it closed (Esc included).

    THE CLEANUP MATTERS MORE THAN USUAL. With Cache Components, Next.js
    doesn't unmount the page you navigate away from: it HIDES it with
    React's <Activity> (display: none) so its state survives a Back. Hiding
    runs Effect cleanups but leaves the DOM in place, and a modal <dialog>
    left open would keep the whole page behind it inert (unclickable).
    So the cleanup closes it, after removing the listener, so that this
    close doesn't count as the user closing it. When the page is shown
    again (Forward), the Effect runs again and reopens it.

    useLayoutEffect, as the docs recommend for Activity: the cleanup runs
    before the page is hidden, not a frame later.
  */
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // The browser fires `close` as a separate task, AFTER close() returns.
    // So a close() from a cleanup can arrive once the Effect has already run
    // again and reopened the dialog: React's Strict Mode does exactly that
    // in development (mount, clean up, mount again), and so can a quick
    // Activity hide/show. By then the dialog is open, so it wasn't the user
    // closing it, and we ignore it.
    const handleClose = () => {
      if (!dialog.open) onCloseRef.current()
    }
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
      if (dialog.open) dialog.close()
      // Put focus back on the card that opened it, so keyboard users
      // aren't sent back to the top of the page.
      const el = opener.current
      if (el?.isConnected && !document.querySelector('dialog[open]')) el.focus()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // A click whose target is the <dialog> itself landed on the backdrop,
      // because the inner panel covers all of the dialog's own box.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
      className={cn(
        'm-auto max-h-[92dvh] w-[calc(100vw-1.5rem)] animate-pop overflow-hidden bg-transparent p-0 text-ink open:flex',
        size === 'md' ? 'max-w-lg' : 'max-w-3xl',
        className,
      )}
    >
      {/* The panel is capped at the dialog's height, so only its body scrolls (one scrollbar, inside the rounded corners). */}
      <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-plate border border-line bg-raised shadow-raised">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id={titleId} className="min-w-0 text-xl font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-pill text-muted hover:bg-sunken hover:text-ink"
          >
            <Icon name="x" />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}
