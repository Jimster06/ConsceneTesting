import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StarRating } from '@/components/StarRating'
import { ReviewCard } from '@/components/ReviewCard'

export const dynamic = 'force-dynamic'

async function getConcert(id: string) {
  const concert = await prisma.concert.findUnique({
    where: { id },
    include: {
      artist: true,
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          media: true,
          _count: { select: { likes: true } },
        },
      },
    },
  })

  if (!concert) return null

  const avgRating =
    concert.reviews.length
      ? concert.reviews.reduce((s, r) => s + r.rating, 0) / concert.reviews.length
      : null

  return { ...concert, avgRating }
}

function parseSongs(setlist: string): string[] {
  try { return JSON.parse(setlist) } catch { return [setlist] }
}

export default async function ConcertPage({ params }: { params: { id: string } }) {
  const concert = await getConcert(params.id)
  if (!concert) notFound()

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: concert.reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="space-y-8">
      {/* Concert header */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/artists/${concert.artist.slug}`}
              className="text-brand-green text-sm font-medium hover:underline"
            >
              {concert.artist.name}
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">{concert.title}</h1>
            <p className="text-brand-text text-sm mt-1">
              {concert.venue} · {concert.city}, {concert.country} ·{' '}
              {new Date(concert.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <Link
            href={`/reviews/new?concertId=${concert.id}`}
            className="bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors whitespace-nowrap"
          >
            + Write review
          </Link>
        </div>

        {/* Rating summary */}
        {concert.avgRating !== null && (
          <div className="flex items-center gap-6 pt-2 border-t border-brand-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {concert.avgRating.toFixed(1)}
              </div>
              <StarRating value={Math.round(concert.avgRating)} size="sm" />
              <div className="text-brand-muted text-xs mt-1">
                {concert.reviews.length} review{concert.reviews.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-brand-muted w-4">{star}★</span>
                  <div className="flex-1 bg-brand-border rounded-full h-1.5">
                    <div
                      className="bg-brand-green h-1.5 rounded-full"
                      style={{
                        width: concert.reviews.length
                          ? `${(count / concert.reviews.length) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className="text-brand-muted w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Setlist */}
      {concert.setlist && parseSongs(concert.setlist).length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Setlist</h2>
            <span className="text-brand-muted text-xs">{parseSongs(concert.setlist).length} songs</span>
          </div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4">
            <ol className="space-y-1">
              {parseSongs(concert.setlist).map((song, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="text-brand-muted w-6 text-right shrink-0 tabular-nums">{i + 1}</span>
                  <span className={song.includes('cover)') || song.includes('[tape]') ? 'text-brand-text' : 'text-white'}>
                    {song}
                  </span>
                </li>
              ))}
            </ol>
            {concert.setlistFmId && (
              <a
                href={`https://www.setlist.fm/setlist/x/${concert.setlistFmId}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-muted text-xs hover:text-brand-green transition-colors mt-3 inline-block"
              >
                View on setlist.fm →
              </a>
            )}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Reviews ({concert.reviews.length})
        </h2>

        {concert.reviews.length === 0 ? (
          <div className="text-center py-12 text-brand-muted">
            <p className="text-3xl mb-3">🎟️</p>
            <p>No reviews yet. Been to this show?</p>
            <Link
              href={`/reviews/new?concertId=${concert.id}`}
              className="text-brand-green hover:underline mt-2 inline-block"
            >
              Write the first review →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {concert.reviews.map((review) => (
              <ReviewCard
                key={review.id}
                showConcert={false}
                review={{
                  ...review,
                  body: review.body ?? undefined,
                  createdAt: review.createdAt.toISOString(),
                  concert: {
                    id: concert.id,
                    title: concert.title,
                    artist: { name: concert.artist.name, slug: concert.artist.slug },
                    venue: concert.venue,
                    city: concert.city,
                    date: concert.date.toISOString(),
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
