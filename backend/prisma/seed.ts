import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { createSeedState } from '../src/common/seed-data'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

async function main() {
  const seed = createSeedState()

  for (const user of seed.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        dob: user.dob ?? null,
        role: user.role,
        emailVerified: true,
      },
    })
  }

  for (const event of seed.events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        date: event.date,
        time: event.time,
        location: event.location,
        capacity: event.capacity,
        currentEnrollments: event.currentEnrollments,
        status: event.status,
        createdBy: event.createdBy,
      },
    })
  }

  console.log(`Seed concluído: ${seed.users.length} usuários, ${seed.events.length} eventos.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
