/*
  MENU LAYOUT: renders `children` (the menu, or a full dish page) and
  `modal`, the @modal PARALLEL ROUTE SLOT, side by side.

  This is how the dish quick view works (an INTERCEPTING ROUTE, as on Day 12):
  - Tap a dish on /menu → a client-side navigation to /menu/party-jollof.
    The folder @modal/(.)[slug] INTERCEPTS it: the URL changes, but instead
    of replacing the menu, Next.js renders the dish into the @modal slot,
    over the menu.
  - Refresh, share the link, or arrive from the home page → there is no
    menu to draw over, so nothing is intercepted and you get the full page,
    menu/[slug].

  "(.)" means "a segment at the same level", like ./ in a path. The @modal
  folder itself doesn't count as a level.

  SERVER COMPONENT: it just places its two slots.
*/
export default function MenuLayout({ children, modal }: LayoutProps<'/menu'>) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
