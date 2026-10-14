import { sumKobo, type Kobo } from '@/lib/money'
import { err, ok, type Result } from '@/lib/result'
import type { ChoiceGroup, PricingDish } from '@/lib/schema/menu'
import type { Choices } from '@/lib/schema/order'

/*
  PRICING: ONE MODULE, BOTH SIDES OF THE BOUNDARY

  This file has no "use client" and no "server-only", so it runs on BOTH
  sides of the boundary, and that is exactly what we want:
  - in the BROWSER, the dish page and the cart use it to show a live price
    as you tick options (a preview, for the customer's convenience);
  - on the SERVER, the placeOrder Server Action runs the very same functions
    over data IT loaded, and that result is the one that's charged.
  Sharing the code means the preview and the real total can't disagree by
  accident. They can only disagree if someone tampers with the request, and
  then the server's answer wins.

  Everything here is a pure function: data in, Result out, no clock, no
  storage, no secrets.
*/

export type PricedLine = {
  dishId: string
  name: string
  /** Chosen option labels in menu order, for the receipt: ["Goat meat", "Dòdò"] */
  options: string[]
  quantity: number
  unitKobo: Kobo
  lineKobo: Kobo
}

export type LineProblem =
  | { kind: 'unknown-dish' }
  | { kind: 'dish-sold-out'; dish: string }
  | { kind: 'unknown-group'; dish: string }
  | { kind: 'unknown-option'; dish: string; group: string }
  | { kind: 'option-sold-out'; dish: string; option: string }
  | { kind: 'missing-choice'; dish: string; group: string }
  | { kind: 'too-many'; dish: string; group: string; max: number }

/** Human sentences for each problem: what the customer sees in the error summary. */
export function describeProblem(problem: LineProblem): string {
  switch (problem.kind) {
    case 'unknown-dish':
      return 'One item in your cart is no longer on the menu. Remove it and try again.'
    case 'dish-sold-out':
      return `${problem.dish} has just sold out. Remove it to continue.`
    case 'unknown-group':
    case 'unknown-option':
      return `The choices for ${problem.dish} have changed. Remove it and add it again.`
    case 'option-sold-out':
      return `${problem.option} for ${problem.dish} has sold out. Choose something else.`
    case 'missing-choice':
      return `Choose a ${problem.group.toLowerCase()} for ${problem.dish}.`
    case 'too-many':
      return `Choose up to ${problem.max} for “${problem.group}” on ${problem.dish}.`
  }
}

/** Checks one group's selection and returns the chosen options. */
function checkGroup(dish: PricingDish, group: ChoiceGroup, picked: readonly string[]): Result<ChoiceGroup['options'], LineProblem> {
  const unique = [...new Set(picked)]
  const chosen: ChoiceGroup['options'] = []
  for (const id of unique) {
    const option = group.options.find((o) => o.id === id)
    if (!option) return err({ kind: 'unknown-option', dish: dish.name, group: group.label })
    if (option.soldOut) return err({ kind: 'option-sold-out', dish: dish.name, option: option.label })
    chosen.push(option)
  }
  switch (group.kind) {
    case 'single':
      if (chosen.length > 1) return err({ kind: 'too-many', dish: dish.name, group: group.label, max: 1 })
      if (group.required && chosen.length === 0) return err({ kind: 'missing-choice', dish: dish.name, group: group.label })
      break
    case 'multi':
      if (chosen.length > group.max) return err({ kind: 'too-many', dish: dish.name, group: group.label, max: group.max })
      break
  }
  // Menu order, not click order, so the receipt reads the same every time.
  return ok(group.options.filter((o) => chosen.includes(o)))
}

/**
 * Prices one cart line: base price + every chosen option's price change,
 * times quantity. Every rule from the menu is checked: unknown dishes and
 * options, sold-out items, required choices and maximums. Choices for a
 * group the dish doesn't have are an error, not silently ignored.
 */
export function priceLine(dish: PricingDish | undefined, choices: Choices, quantity: number): Result<PricedLine, LineProblem> {
  if (!dish) return err({ kind: 'unknown-dish' })
  if (dish.soldOut) return err({ kind: 'dish-sold-out', dish: dish.name })

  const knownGroups = new Set(dish.choiceGroups.map((g) => g.id))
  if (Object.keys(choices).some((groupId) => !knownGroups.has(groupId))) return err({ kind: 'unknown-group', dish: dish.name })

  const labels: string[] = []
  const deltas: Kobo[] = []
  for (const group of dish.choiceGroups) {
    const result = checkGroup(dish, group, choices[group.id] ?? [])
    if (!result.ok) return result
    for (const option of result.value) {
      labels.push(option.label)
      deltas.push(option.priceDeltaKobo)
    }
  }

  const unitKobo = dish.priceKobo + sumKobo(deltas)
  return ok({ dishId: dish.id, name: dish.name, options: labels, quantity, unitKobo, lineKobo: unitKobo * quantity })
}

export type OrderTotals = { subtotalKobo: Kobo; deliveryFeeKobo: Kobo; totalKobo: Kobo }

export function orderTotals(lines: readonly Pick<PricedLine, 'lineKobo'>[], deliveryFeeKobo: Kobo): OrderTotals {
  const subtotalKobo = sumKobo(lines.map((l) => l.lineKobo))
  return { subtotalKobo, deliveryFeeKobo, totalKobo: subtotalKobo + deliveryFeeKobo }
}

/** The selection a customer starts with on the dish page: nothing chosen. */
export function emptyChoices(dish: Pick<PricingDish, 'choiceGroups'>): Choices {
  return Object.fromEntries(dish.choiceGroups.map((g) => [g.id, []]))
}

/** Drops empty groups so two equal selections compare (and store) the same. */
export function normaliseChoices(choices: Choices): Choices {
  return Object.fromEntries(
    Object.entries(choices)
      .filter(([, ids]) => ids.length > 0)
      .map(([group, ids]) => [group, [...new Set(ids)].sort()])
      .sort(([a], [b]) => String(a).localeCompare(String(b))),
  )
}

/** Two cart lines are "the same item" when dish and choices match: then we add to the quantity instead. */
export const sameSelection = (a: Choices, b: Choices) => JSON.stringify(normaliseChoices(a)) === JSON.stringify(normaliseChoices(b))
