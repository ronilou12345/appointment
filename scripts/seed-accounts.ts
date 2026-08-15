import "dotenv/config"
import { randomUUID } from "node:crypto"
import prisma from "../src/lib/prisma"

const accounts = [
  {
    email: "admin@clinic.dev",
    name: "Admin User",
    password: "Admin12345!",
    role: "ADMIN" as const,
    avatar: "/avatars/admin.jpg",
  },
  {
    email: "doctor@clinic.dev",
    name: "Doctor User",
    password: "Doctor12345!",
    role: "NURSE" as const,
    avatar: "/avatars/doctor.jpg",
  },
  {
    email: "client@clinic.dev",
    name: "Client User",
    password: "Client12345!",
    role: "PATIENT" as const,
    avatar: "/avatars/client.jpg",
  },
]

async function main() {
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: account.password,
        role: account.role,
        status: "ACTIVE",
        profile_image: account.avatar,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        email: account.email,
        name: account.name,
        password: account.password,
        role: account.role,
        status: "ACTIVE",
        profile_image: account.avatar,
        updatedAt: new Date(),
      },
      select: { email: true, role: true },
    })

    console.log(`Ready: ${user.email} (${user.role})`)
  }
}

main()
  .catch((error) => {
    console.error("Account seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
