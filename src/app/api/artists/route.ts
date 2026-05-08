import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const artists = await prisma.artist.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: 'asc' },
    include: { _count: { select: { concerts: true } } },
  })

  return NextResponse.json(artists)
}
