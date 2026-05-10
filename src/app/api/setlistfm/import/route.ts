import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseSetlistDate, flattenSongs, slugify, SlfmSetlist } from '@/lib/setlistfm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const setlist: SlfmSetlist = await req.json()

  // Upsert artist
  const artistName = setlist.artist.name
  const artistSlug = slugify(artistName)

  const artist = await prisma.artist.upsert({
    where: { mbid: setlist.artist.mbid },
    update: { name: artistName },
    create: {
      name: artistName,
      slug: await uniqueSlug(artistSlug),
      mbid: setlist.artist.mbid,
    },
  })

  // Build concert title
  const tourName = setlist.tour?.name ?? null
  const title = tourName
    ? `${tourName} – ${setlist.venue.name}`
    : `${artistName} at ${setlist.venue.name}`

  // Check if already imported
  const existing = await prisma.concert.findUnique({
    where: { setlistFmId: setlist.id },
  })
  if (existing) {
    return NextResponse.json({ concertId: existing.id, alreadyExists: true })
  }

  const songs = flattenSongs(setlist.sets)

  const concert = await prisma.concert.create({
    data: {
      title,
      artistId: artist.id,
      venue: setlist.venue.name,
      city: setlist.venue.city.name,
      country: setlist.venue.city.country.name,
      date: parseSetlistDate(setlist.eventDate),
      setlistFmId: setlist.id,
      tourName,
      setlist: songs.length > 0 ? JSON.stringify(songs) : null,
    },
  })

  return NextResponse.json({ concertId: concert.id, alreadyExists: false })
}

async function uniqueSlug(base: string): Promise<string> {
  const existing = await prisma.artist.findUnique({ where: { slug: base } })
  if (!existing) return base
  // Append a random suffix if slug is taken
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}
