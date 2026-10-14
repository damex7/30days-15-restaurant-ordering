import type { Metadata } from 'next'
import Link from 'next/link'
import { listPhotoCredits } from '@/lib/data'

export const metadata: Metadata = { title: 'Photo credits', description: 'Credits for the dish photographs used on Bùkà, all from Wikimedia Commons.' }

/**
 * SERVER COMPONENT, fully static: every credit comes from data/photos.ts
 * through a cached read, so this page is built once.
 *
 * CC BY and CC BY-SA ask for the author, the licence, a link to the source,
 * and a note of any changes, so all four are here.
 */
export default async function CreditsPage() {
  const credits = await listPhotoCredits()
  return (
    <div className="mx-auto max-w-reading px-4 pt-8 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Photo credits</h1>
      <p className="mt-3 text-muted">
        Every dish photo on Bùkà comes from Wikimedia Commons, used under the licence shown. Each image was resized to at most 800 pixels wide and
        re-compressed for the web; nothing else was changed. Thank you to the photographers.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-raised">
        {credits.map(({ dish, slug, photo }) => (
          <li key={slug} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <Link href={`/menu/${slug}`} className="font-semibold hover:underline sm:w-44 sm:shrink-0">
              {dish}
            </Link>
            <p className="text-sm text-muted sm:text-right">
              <a href={photo.credit.sourceUrl} className="underline hover:text-ink" rel="noopener noreferrer">
                “{photo.credit.title.replace(/\.(jpe?g|png|webp)$/i, '')}”
              </a>{' '}
              by {photo.credit.author},{' '}
              {photo.credit.licenceUrl ? (
                <a href={photo.credit.licenceUrl} className="underline hover:text-ink" rel="noopener noreferrer license">
                  {photo.credit.licence}
                </a>
              ) : (
                photo.credit.licence
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
