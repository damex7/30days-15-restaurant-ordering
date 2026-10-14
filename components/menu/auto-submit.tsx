// CLIENT COMPONENT: it listens for typing and ticking and submits the form for
// you. Event handlers only run in the browser.
'use client'

import { useEffect, useLayoutEffect, useRef, type ChangeEvent, type ReactNode } from 'react'

/*
  A SMALL ENHANCEMENT ON TOP OF A FORM THAT ALREADY WORKS

  The menu filters are a plain GET form (<Form action="/menu"> from
  next/form), rendered by a Server Component. With no JavaScript, you tick
  boxes, press Search, and the browser loads /menu?q=…&diet=…. That's the
  baseline.

  This wrapper only adds "you don't have to press Search": a tick submits
  at once, typing submits after a short pause. next/form turns each submit
  into a client-side navigation, so the page doesn't reload, and the server
  renders the filtered menu.

  The inputs are children: rendered on the server, never imported here.
*/

const TYPING_PAUSE_MS = 350

export function AutoSubmit({ syncKey, children }: { syncKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const submit = () => ref.current?.closest('form')?.requestSubmit()

  function onChange(event: ChangeEvent<HTMLDivElement>) {
    const target = event.target as unknown as HTMLInputElement
    clearTimeout(timer.current)
    if (target.type === 'checkbox') submit()
    else timer.current = setTimeout(submit, TYPING_PAUSE_MS)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  /*
    The inputs are UNCONTROLLED (defaultValue / defaultChecked), so typing
    never waits for the server. When the URL changes some other way (the
    Clear link, the Back button), the server sends new defaults, and this
    copies them into the inputs, except into the box you're typing in.
  */
  useLayoutEffect(() => {
    ref.current?.querySelectorAll('input').forEach((input) => {
      if (input.type === 'checkbox') input.checked = input.defaultChecked
      else if (input !== document.activeElement) input.value = input.defaultValue
    })
  }, [syncKey])

  return (
    <div ref={ref} onChange={onChange} className="contents">
      {children}
    </div>
  )
}
