/**
 * The @modal slot's page for /menu itself: nothing.
 *
 * During client-side navigation a slot keeps showing what it last matched.
 * So if you go from an open modal to /menu with a link (not Back), the slot
 * needs a page for /menu that renders null, or the modal would stay open.
 */
export default function NoModal() {
  return null
}
