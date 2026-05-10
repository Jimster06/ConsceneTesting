const BASE_URL = 'https://api.setlist.fm/rest/1.0'

function headers() {
  return {
    'x-api-key': process.env.SETLISTFM_API_KEY!,
    'Accept': 'application/json',
  }
}

export interface SlfmArtist {
  mbid: string
  name: string
  sortName: string
  disambiguation?: string
  url: string
}

export interface SlfmVenue {
  id: string
  name: string
  city: {
    name: string
    state?: string
    country: { code: string; name: string }
  }
}

export interface SlfmSong {
  name: string
  cover?: { mbid: string; name: string }
  info?: string
  tape?: boolean
}

export interface SlfmSet {
  name?: string
  encore?: number
  song: SlfmSong[]
}

export interface SlfmSetlist {
  id: string
  eventDate: string       // "DD-MM-YYYY"
  artist: SlfmArtist
  venue: SlfmVenue
  tour?: { name: string }
  sets: { set: SlfmSet[] }
  info?: string
  url: string
}

export async function searchArtists(query: string): Promise<SlfmArtist[]> {
  const url = `${BASE_URL}/search/artists?artistName=${encodeURIComponent(query)}&sort=relevance&p=1`
  const res = await fetch(url, { headers: headers(), next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.artist ?? []
}

export async function getArtistSetlists(mbid: string, page = 1): Promise<{
  setlists: SlfmSetlist[]
  total: number
  page: number
}> {
  const url = `${BASE_URL}/artist/${mbid}/setlists?p=${page}`
  const res = await fetch(url, { headers: headers(), next: { revalidate: 300 } })
  if (!res.ok) return { setlists: [], total: 0, page: 1 }
  const data = await res.json()
  return {
    setlists: data.setlist ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
  }
}

export function parseSetlistDate(eventDate: string): Date {
  // setlist.fm format: "DD-MM-YYYY"
  const [day, month, year] = eventDate.split('-')
  return new Date(`${year}-${month}-${day}`)
}

export function flattenSongs(sets: { set: SlfmSet[] }): string[] {
  return (sets.set ?? []).flatMap((set) =>
    (set.song ?? []).map((song) => {
      let name = song.name
      if (song.cover) name += ` (${song.cover.name} cover)`
      if (song.tape) name += ' [tape]'
      if (song.info) name += ` — ${song.info}`
      return name
    })
  )
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
