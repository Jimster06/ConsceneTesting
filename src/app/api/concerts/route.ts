import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const artistId = searchParams.get('artistId') ?? undefined

  const concerts = await prisma.concert.findMany({
    where: {
      ...(q ? { OR: [{ title: { contains: q } }, { venue: { contains: q } }, { city: { contains: q } }] } : {}),
      ...(artistId ? { artistId } : {}),
    },
    orderBy: { date: 'desc' },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      _count: { select: { reviews: true } },
    },
  })

  return NextResponse.json(concerts)
}
