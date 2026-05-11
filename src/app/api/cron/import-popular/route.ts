import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGlobalTopArtists } from '@/lib/spotify'
import { searchArtists, getArtistSetlists, parseSetlistDate, flattenSongs, slugify, SlfmSetlist } from '@/lib/setlistfm'

export const dynamic = 'force-dynamic'

interface ImportResult {
  artist: string
  status: 'imported' | 'exists' | 'no_setlist' | 'error'
  concertId?: string
  title?: string
  error?: string
}

async function uniqueSlug(base: string): Promise<string> {
  const existing = await prisma.artist.findUnique({ where: { slug: base } })
  if (!existing) return base
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

async function importSetlist(setlist: SlfmSetlist): Promise<{ concertId: string; alreadyExists: boolean }> {
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

  const existing = await prisma.concert.findUnique({ where: { setlistFmId: setlist.id } })
  if (existing) return { concertId: existing.id, alreadyExists: true }

  const tourName = setlist.tour?.name ?? null
  const title = tourName
    ? `${tourName} – ${setlist.venue.name}`
    : `${artistName} at ${setlist.venue.name}`

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

  return { concertId: concert.id, alreadyExists: false }
}

export async function POST() {
  const results: ImportResult[] = []

  let topArtists
  try {
    topArtists = await getGlobalTopArtists(10)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch Spotify top artists', detail: String(e) }, { status: 500 })
  }

  for (const spotifyArtist of topArtists) {
    try {
      // Find the artist on setlist.fm by name
      const slfmArtists = await searchArtists(spotifyArtist.name)
      if (!slfmArtists.length) {
        results.push({ artist: spotifyArtist.name, status: 'no_setlist' })
        continue
      }

      // Use the top search result (most relevant match)
      const slfmArtist = slfmArtists[0]

      // Get their most recent setlist
      const { setlists } = await getArtistSetlists(slfmArtist.mbid, 1)
      // Find the first setlist that has at least some songs
      const setlist = setlists.find((s) =>
        s.sets.set.some((set) => (set.song?.length ?? 0) > 0)
      ) ?? setlists[0]

      if (!setlist) {
        results.push({ artist: spotifyArtist.name, status: 'no_setlist' })
        continue
      }

      const { concertId, alreadyExists } = await importSetlist(setlist)
      const tourName = setlist.tour?.name ?? null
      const title = tourName
        ? `${tourName} – ${setlist.venue.name}`
        : `${spotifyArtist.name} at ${setlist.venue.name}`

      results.push({
        artist: spotifyArtist.name,
        status: alreadyExists ? 'exists' : 'imported',
        concertId,
        title,
      })
    } catch (e) {
      results.push({ artist: spotifyArtist.name, status: 'error', error: String(e) })
    }
  }

  const imported = results.filter((r) => r.status === 'imported').length
  const existed = results.filter((r) => r.status === 'exists').length

  return NextResponse.json({ imported, existed, results })
}
