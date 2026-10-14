// npm run check:contrast
//
// Reads the colour tokens from app/globals.css (both sides of every
// light-dark() pair) and checks the text/background pairs the UI actually
// uses against WCAG 2.2 contrast minimums, in light AND dark mode:
//   text  4.5:1  normal-size text (prices, body copy, links, button labels)
//   large 3:1    large or bold display text (the hero headline)
//   ui    3:1    non-text UI: focus rings, borders of selected controls
// Exits with code 1 if any pair fails, so it can run in CI.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const tokens = {}
for (const m of css.matchAll(/--color-([a-z-]+):\s*(?:light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)|(#[0-9a-f]{6}))/gi)) {
  const [, name, light, dark, both] = m
  tokens[name] = { light: light ?? both, dark: dark ?? both }
}

// [foreground, background, kind, where it's used]
const PAIRS = [
  ['ink', 'paper', 'text', 'body text'],
  ['ink', 'raised', 'text', 'text on cards'],
  ['ink', 'sunken', 'text', 'text in wells and inputs'],
  ['muted', 'paper', 'text', 'secondary text'],
  ['muted', 'raised', 'text', 'descriptions on cards'],
  ['muted', 'sunken', 'text', 'footer text'],
  ['subtle', 'paper', 'text', 'small print'],
  ['subtle', 'raised', 'text', 'small print on cards'],
  ['leaf', 'paper', 'text', 'links and icons'],
  ['leaf', 'raised', 'text', 'links on cards'],
  ['leaf', 'leaf-soft', 'text', 'vegetarian tag, table chip, selected option'],
  ['leaf-ink', 'leaf', 'text', 'active category tab'],
  ['chilli', 'paper', 'text', 'prices'],
  ['chilli', 'raised', 'text', 'prices on cards'],
  ['chilli', 'chilli-soft', 'text', 'spice tag, current order step'],
  ['chilli-ink', 'chilli', 'text', 'primary button label'],
  ['chilli-ink', 'chilli-hover', 'text', 'primary button label (hover)'],
  ['forest-ink', 'forest', 'text', 'hero and cart bar text'],
  ['forest-muted', 'forest', 'text', 'hero secondary text'],
  ['forest-ink', 'forest-raised', 'text', 'open/closed pill'],
  ['plantain-fill', 'forest', 'large', 'hero headline highlight'],
  ['forest-leaf', 'forest-raised', 'ui', '"open now" dot on the band'],
  // A chilli button on the forest band is dark-on-dark in light mode
  // (about 1.8:1), so on the band it gets a cream ring; this checks the ring.
  ['forest-ink', 'forest', 'ui', 'cream ring around the chilli button on the band'],
  ['chilli-ink', 'chilli', 'text', 'cart count on the cart bar'],
  ['danger', 'paper', 'text', 'error messages'],
  ['danger', 'raised', 'text', 'errors on cards'],
  ['danger', 'danger-soft', 'text', 'error summary'],
  ['danger-ink', 'danger', 'text', '"Sold out today" badge'],
  ['plantain', 'paper', 'text', 'specials notes'],
  ['plantain', 'plantain-soft', 'text', 'notices'],
  ['focus', 'paper', 'ui', 'focus ring'],
  ['focus', 'raised', 'ui', 'focus ring on cards'],
  ['leaf', 'raised', 'ui', 'selected-card border'],
]
const MIN = { text: 4.5, large: 3, ui: 3 }

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

let failures = 0
for (const mode of ['light', 'dark']) {
  console.log(`\n${mode.toUpperCase()} MODE`)
  for (const [fg, bg, kind, where] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.log(`  ✗ missing token: ${!tokens[fg] ? fg : bg}`)
      failures++
      continue
    }
    const r = ratio(tokens[fg][mode], tokens[bg][mode])
    const ok = r >= MIN[kind]
    if (!ok) failures++
    console.log(`  ${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  ${`${fg} on ${bg}`.padEnd(30)} ${kind.padEnd(5)} ${where}`)
  }
}
console.log(failures ? `\n${failures} pair(s) below the WCAG AA minimum.` : '\nEvery pair meets WCAG AA.')
process.exit(failures ? 1 : 0)
