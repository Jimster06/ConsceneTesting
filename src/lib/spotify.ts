const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'
// Spotify's official "Global Top 50" playlist
const GLOBAL_TOP_50 = '37i9dQZEVXbMDoHDwVN2tF'

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) throw new Error('Failed to get Spotify access token')
  const data = await res.json()
  return data.access_token
}

export interface SpotifyArtist {
  id: string
  name: string
}

export async function getGlobalTopArtists(limit = 10): Promise<SpotifyArtist[]> {
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}/playlists/${GLOBAL_TOP_50}/tracks?limit=50&fields=items(track(artists))`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error('Failed to fetch Spotify top 50 playlist')
  const data = await res.json()

  const seen = new Set<string>()
  const artists: SpotifyArtist[] = []

  for (const item of data.items ?? []) {
    for (const artist of item.track?.artists ?? []) {
      if (!seen.has(artist.id)) {
        seen.add(artist.id)
        artists.push({ id: artist.id, name: artist.name })
        if (artists.length >= limit) return artists
      }
    }
  }

  return artists
}
