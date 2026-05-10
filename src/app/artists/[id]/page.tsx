import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StarRating } from '@/components/StarRating'

export const dynamic = 'force-dynamic'

async function getArtist(id: string) {
  return prisma.artist.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      concerts: {
        orderBy: { date: 'desc' },
        include: {
          _count: { select: { reviews: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
  })
}

export default async function ArtistPage({ params }: { params: { id: string } }) {
  const artist = await getArtist(params.id)
  if (!artist) notFound()

  return (
    <div className="space-y-8">
      {/* Artist header */}
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-5xl">
          🎤
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{artist.name}</h1>
          {artist.genre && (
            <p className="text-brand-green text-sm font-medium mt-1">{artist.genre}</p>
          )}
          {artist.bio && (
            <p className="text-brand-text text-sm mt-2 max-w-xl">{artist.bio}</p>
          )}
        </div>
      </div>

      {/* Shows */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Shows ({artist.concerts.length})
          </h2>
          <Link
            href={`/reviews/new?artistId=${artist.id}`}
            className="text-brand-green text-sm hover:underline"
          >
            + Add review
          </Link>
        </div>

        {artist.concerts.length === 0 ? (
          <p className="text-brand-muted text-sm">No shows tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {artist.concerts.map((concert) => {
              const avg =
                concert.reviews.length
                  ? concert.reviews.reduce((s, r) => s + r.rating, 0) /
                    concert.reviews.length
                  : null

              return (
                <Link
                  key={concert.id}
                  href={`/concerts/${concert.id}`}
                  className="block bg-brand-card border border-brand-border rounded-lg p-4 hover:border-brand-green transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-brand-green transition-colors">
                        {concert.title}
                      </h3>
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
                      {avg !== null && (
                        <StarRating value={Math.round(avg)} size="sm" />
                      )}
                      <p className="text-brand-muted text-xs mt-1">
                        {concert._count.reviews} review{concert._count.reviews !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
