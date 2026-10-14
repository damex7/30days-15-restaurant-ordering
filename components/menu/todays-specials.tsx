import { DishCard } from '@/components/menu/dish-card'
import { DishGridSkeleton } from '@/components/ui/skeletons'
import { getTodaysSpecials } from '@/lib/data'

/*
  SERVER COMPONENT that STREAMS.

  getTodaysSpecials() reads the clock (which day is it in Lagos?) and takes
  about 1.5 seconds, like a slow supplier API would. The page doesn't wait
  for it. The page puts this inside <Suspense fallback={<SpecialsFallback />}>,
  so:
    1. the static shell (header, hero, menu) is sent straight away, with
       three grey cards where the specials will go;
    2. the server keeps the response open, and when the specials are
       ready it streams their HTML down the same connection;
    3. React swaps the grey cards for the real ones. No client-side fetch,
       no loading state in JavaScript, no useEffect.
*/
export async function TodaysSpecials() {
  const specials = await getTodaysSpecials()
  if (specials.length === 0) return <p className="text-muted">No specials today. Everything on the menu is still on!</p>
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {specials.map(({ dish, note }) => (
        <li key={dish.id} className="flex">
          <DishCard dish={dish} note={note} />
        </li>
      ))}
    </ul>
  )
}

export function SpecialsFallback() {
  return <DishGridSkeleton count={3} label="Loading today’s specials" />
}
