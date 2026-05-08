import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@conscene.app' },
    update: {},
    create: {
      email: 'demo@conscene.app',
      username: 'demo_user',
      password,
      bio: 'Lifelong concert-goer and music lover.',
    },
  })

  const taylorSwift = await prisma.artist.upsert({
    where: { slug: 'taylor-swift' },
    update: {},
    create: {
      name: 'Taylor Swift',
      slug: 'taylor-swift',
      genre: 'Pop',
      bio: 'Grammy Award-winning singer-songwriter known for narrative songwriting.',
    },
  })

  const radiohead = await prisma.artist.upsert({
    where: { slug: 'radiohead' },
    update: {},
    create: {
      name: 'Radiohead',
      slug: 'radiohead',
      genre: 'Alternative Rock',
      bio: 'Oxford rock band known for atmospheric and experimental sound.',
    },
  })

  const beyonce = await prisma.artist.upsert({
    where: { slug: 'beyonce' },
    update: {},
    create: {
      name: 'Beyoncé',
      slug: 'beyonce',
      genre: 'R&B / Pop',
      bio: 'Multi-platinum recording artist and cultural icon.',
    },
  })

  const concert1 = await prisma.concert.create({
    data: {
      title: 'The Eras Tour – Chicago Night 1',
      artistId: taylorSwift.id,
      venue: 'Soldier Field',
      city: 'Chicago',
      country: 'USA',
      date: new Date('2023-06-02'),
    },
  })

  const concert2 = await prisma.concert.create({
    data: {
      title: 'OK Computer 25th Anniversary',
      artistId: radiohead.id,
      venue: 'Madison Square Garden',
      city: 'New York',
      country: 'USA',
      date: new Date('2022-10-14'),
    },
  })

  const concert3 = await prisma.concert.create({
    data: {
      title: 'Renaissance World Tour – London',
      artistId: beyonce.id,
      venue: 'Tottenham Hotspur Stadium',
      city: 'London',
      country: 'UK',
      date: new Date('2023-05-01'),
    },
  })

  await prisma.review.create({
    data: {
      userId: user.id,
      concertId: concert1.id,
      rating: 5,
      body: 'Absolutely transcendent. Three-and-a-half hours of pure magic. The production, the energy, the setlist — everything was perfect. She performed all eras seamlessly and the crowd was electric the entire time.',
    },
  })

  await prisma.review.create({
    data: {
      userId: user.id,
      concertId: concert2.id,
      rating: 5,
      body: "Witnessing OK Computer played front-to-back was a religious experience. Thom Yorke's voice is still hauntingly beautiful. The lighting design was absolutely stunning and matched the paranoid android energy perfectly.",
    },
  })

  await prisma.review.create({
    data: {
      userId: user.id,
      concertId: concert3.id,
      rating: 5,
      body: "Renaissance is THAT girl. The choreography, the outfits, the silver alien aesthetic — nothing has ever come close. I cried during All Night. The sound system at Spurs was incredible.",
    },
  })

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
