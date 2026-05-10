import { NextRequest, NextResponse } from 'next/server'
import { getArtistSetlists } from '@/lib/setlistfm'

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const mbid = params.get('mbid') ?? ''
  const page = Number(params.get('page') ?? '1')

  if (!mbid) return NextResponse.json({ setlists: [], total: 0 })

  const result = await getArtistSetlists(mbid, page)
  return NextResponse.json(result)
}
