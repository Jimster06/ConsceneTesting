import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/ReviewCard'

export const dynamic = 'force-dynamic'

async function getFeed() {
  return prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      concert: {
        include: { artist: { select: { id: true, name: true, slug: true } } },
      },
      media: true,
      _count: { select: { likes: true, comments: true } },
    },
  })
}

async function getStats() {
  const [artists, concerts, reviews] = await Promise.all([
    prisma.artist.count(),
    prisma.concert.count(),
    prisma.review.count(),
  ])
  return { artists, concerts, reviews }
}

export default async function HomePage() {
  const [feed, stats] = await Promise.all([getFeed(), getStats()])

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl font-bold text-white">
          Review the <span className="text-brand-green">live music</span> you love.
        </h1>
        <p className="text-brand-text text-lg max-w-xl mx-auto">
          Track concerts you've attended, share your experience, and upload photos and videos.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/auth/signup"
            className="bg-brand-green text-black font-semibold px-6 py-2.5 rounded-full hover:bg-green-400 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/concerts"
            className="border border-brand-border text-brand-text px-6 py-2.5 rounded-full hover:text-white hover:border-white transition-colors"
          >
            Browse shows
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 text-center border border-brand-border rounded-lg p-4 bg-brand-card">
        <div>
          <div className="text-2xl font-bold text-white">{stats.artists}</div>
          <div className="text-xs text-brand-muted uppercase tracking-wider">Artists</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.concerts}</div>
          <div className="text-xs text-brand-muted uppercase tracking-wider">Shows</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.reviews}</div>
          <div className="text-xs text-brand-muted uppercase tracking-wider">Reviews</div>
        </div>
      </div>

      {/* Recent reviews */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
          <Link href="/concerts" className="text-brand-text text-sm hover:text-white transition-colors">
            All shows →
          </Link>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-16 text-brand-muted">
            <p className="text-4xl mb-3">🎸</p>
            <p>No reviews yet. Be the first to review a show!</p>
            <Link href="/reviews/new" className="text-brand-green hover:underline mt-2 inline-block">
              Write a review →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((review) => (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  body: review.body ?? undefined,
                  createdAt: review.createdAt.toISOString(),
                  concert: {
                    ...review.concert,
                    date: review.concert.date.toISOString(),
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
