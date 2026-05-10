import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getArtists(q: string) {
  return prisma.artist.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: 'asc' },
    include: { _count: { select: { concerts: true } } },
  })
}

interface PageProps {
  searchParams: { q?: string }
}

export default async function ArtistsPage({ searchParams }: PageProps) {
  const q = searchParams.q ?? ''
  const artists = await getArtists(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Artists</h1>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search artists…"
          className="flex-1 bg-brand-card border border-brand-border rounded px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-green"
        />
        <button
          type="submit"
          className="bg-brand-green text-black font-semibold px-4 py-2 rounded text-sm hover:bg-green-400 transition-colors"
        >
          Search
        </button>
      </form>

      {artists.length === 0 ? (
        <p className="text-brand-muted text-center py-12">No artists found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="bg-brand-card border border-brand-border rounded-lg p-4 hover:border-brand-green transition-colors group"
            >
              {/* Avatar placeholder */}
              <div className="w-16 h-16 rounded-full bg-brand-border flex items-center justify-center text-2xl mb-3 mx-auto">
                🎤
              </div>
              <h2 className="font-semibold text-white text-center text-sm group-hover:text-brand-green transition-colors">
                {artist.name}
              </h2>
              {artist.genre && (
                <p className="text-brand-muted text-xs text-center mt-0.5">{artist.genre}</p>
              )}
              <p className="text-brand-muted text-xs text-center mt-1">
                {artist._count.concerts} show{artist._count.concerts !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
