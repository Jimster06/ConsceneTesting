import { NextRequest, NextResponse } from 'next/server'
import { searchArtists } from '@/lib/setlistfm'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const artists = await searchArtists(q)
  return NextResponse.json(artists)
}
