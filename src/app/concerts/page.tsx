import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StarRating } from '@/components/StarRating'

export const dynamic = 'force-dynamic'

async function getConcerts(q: string) {
  const concerts = await prisma.concert.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { venue: { contains: q } },
            { city: { contains: q } },
            { artist: { name: { contains: q } } },
          ],
        }
      : undefined,
    orderBy: { date: 'desc' },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } },
    },
  })

  return concerts.map((c) => ({
    ...c,
    avgRating:
      c.reviews.length
        ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
        : null,
  }))
}

interface PageProps {
  searchParams: { q?: string }
}

export default async function ConcertsPage({ searchParams }: PageProps) {
  const q = searchParams.q ?? ''
  const concerts = await getConcerts(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Shows</h1>
        <Link
          href="/reviews/new"
          className="bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors"
        >
          + Review a show
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search shows, artists, venues…"
          className="flex-1 bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
        />
        <button
          type="submit"
          className="bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors"
        >
          Search
        </button>
      </form>

      {concerts.length === 0 ? (
        <p className="text-brand-muted text-center py-12">No shows found.</p>
      ) : (
        <div className="space-y-3">
          {concerts.map((concert) => (
            <Link
              key={concert.id}
              href={`/concerts/${concert.id}`}
              className="flex items-start justify-between gap-4 bg-brand-card border border-brand-border rounded-lg p-4 hover:border-brand-green transition-colors group"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-white text-sm group-hover:text-brand-green transition-colors truncate">
                  {concert.title}
                </h2>
                <Link
                  href={`/artists/${concert.artist.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-brand-green text-xs hover:underline"
                >
                  {concert.artist.name}
                </Link>
                <p className="text-brand-muted text-xs mt-0.5">
                  {concert.venue} · {concert.city} ·{' '}
                  {new Date(concert.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                {concert.avgRating !== null && (
                  <StarRating value={Math.round(concert.avgRating)} size="sm" />
                )}
                <p className="text-brand-muted text-xs mt-1">
                  {concert._count.reviews} review{concert._count.reviews !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
