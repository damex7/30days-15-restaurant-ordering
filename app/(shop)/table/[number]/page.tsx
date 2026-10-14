import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StartTableOrder } from '@/components/cart/start-table-order'
import { buttonClass } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { getRestaurant } from '@/lib/data'

/*
  /table/[number]: where each table's QR code points.

  generateStaticParams lists the restaurant's real tables (1 to 12), so
  `next build` prerenders twelve small static pages. /table/99 isn't in the
  list, and the page itself checks too: notFound().

  SERVER COMPONENT. The only client code is <StartTableOrder>, which writes
  "dine-in at table N" into the cart in localStorage.
*/
export async function generateStaticParams() {
  const { tables } = await getRestaurant()
  return tables.map((t) => ({ number: String(t) }))
}

export async function generateMetadata({ params }: PageProps<'/table/[number]'>): Promise<Metadata> {
  return { title: `Table ${(await params).number}`, robots: { index: false } }
}

export default async function TablePage({ params }: PageProps<'/table/[number]'>) {
  const { number } = await params
  const { tables } = await getRestaurant()
  // "7" → 7. "07", "7.5", "seven" or a table we don't have → 404.
  const table = Number(number)
  if (!/^[1-9]\d*$/.test(number) || !tables.includes(table)) notFound()

  return (
    <div className="mx-auto flex max-w-reading flex-col items-center px-4 pt-12 text-center sm:px-6">
      <span className="grid size-20 place-items-center rounded-pill bg-leaf-soft text-leaf">
        <Icon name="table" className="size-10" />
      </span>
      <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">Welcome to table {table}</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        Order from your phone and we’ll bring it to your table. Pay at the table or at the counter when you’re done.
      </p>
      <div className="mt-4">
        <StartTableOrder table={table} />
      </div>
      <Link href="/menu" className={buttonClass({ size: 'lg', className: 'mt-6' })}>
        See the menu <Icon name="arrowRight" />
      </Link>
      <p className="mt-8 text-sm text-subtle">Wrong table? Scan the code on your own table, or tell any of our staff.</p>
    </div>
  )
}
