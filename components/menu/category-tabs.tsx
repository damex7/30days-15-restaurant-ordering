// CLIENT COMPONENT: it watches the page scroll (IntersectionObserver) and
// highlights the category you're looking at. Scroll position only exists in
// the browser.
'use client'

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/*
  THE COMPOSITION PATTERN: SERVER CONTENT INSIDE A CLIENT COMPONENT

  This component needs JavaScript, but the menu it wraps doesn't. If the
  menu sections were IMPORTED here, they (and every dish card, photo and
  tag inside them) would become client code and ship to the browser.

  Instead the menu page, a Server Component, renders the sections and
  passes them in as `children`. To this component they're an opaque,
  already-rendered piece of the tree: it places them, it doesn't render
  them. It finds them in the DOM through its ref, by their
  `data-category` attribute, and that's all it knows about them.

  Without JavaScript the tabs are plain anchor links (#grills), which still
  jump to each section.
*/

type Tab = { id: string; name: string; count: number }

export function CategoryTabs({ tabs, children }: { tabs: readonly Tab[]; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(tabs[0]?.id)

  // Watch the server-rendered sections and remember which ones are on screen.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const sections = [...root.querySelectorAll<HTMLElement>('[data-category]')]
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.category
          if (!id) continue
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        // The first visible section in page order wins.
        const first = sections.find((s) => visible.has(s.dataset.category ?? ''))
        if (first?.dataset.category) setActive(first.dataset.category)
      },
      // A band from just under the sticky header and tabs to the middle of
      // the screen: a section counts as "current" while its top half is there.
      { rootMargin: '-140px 0px -50% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [tabs])

  // Keep the active tab in view inside the strip (it scrolls sideways on phones).
  useEffect(() => {
    const strip = stripRef.current
    const tab = strip?.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    if (!strip || !tab) return
    strip.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  function jump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const section = document.getElementById(id)
    if (!section) return
    event.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    // Move keyboard focus too, so Tab continues from the section, as with a
    // normal anchor link.
    section.focus({ preventScroll: true })
    window.history.replaceState(null, '', `#${id}`)
    setActive(id)
  }

  return (
    <>
      <nav
        ref={stripRef}
        aria-label="Menu categories"
        className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      >
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            data-tab={tab.id}
            onClick={(e) => jump(e, tab.id)}
            aria-current={active === tab.id ? 'true' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
              active === tab.id ? 'border-leaf bg-leaf text-leaf-ink' : 'border-line-strong bg-raised text-muted hover:text-ink',
            )}
          >
            {tab.name}
            <span className={cn('tabular text-xs', active === tab.id ? 'text-leaf-ink' : 'text-subtle')}>{tab.count}</span>
          </a>
        ))}
      </nav>
      <div ref={contentRef}>{children}</div>
    </>
  )
}
