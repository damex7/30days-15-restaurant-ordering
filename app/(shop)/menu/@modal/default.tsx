/**
 * DEFAULT for the @modal slot: nothing.
 *
 * On a FULL page load (of /menu or /menu/party-jollof), Next.js matches
 * every slot against the URL. The @modal slot only has something to show
 * during client-side navigation, so for a full load it falls back to this
 * file and quietly renders no modal. Without it, those URLs would 404.
 */
export default function ModalDefault() {
  return null
}
