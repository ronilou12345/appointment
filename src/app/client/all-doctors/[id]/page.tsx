import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDoctorPage({ params }: Props) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  const doctor = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      employeeNumber: true,
      designations: true,
      status: true,
      createdAt: true,
    },
  })

  if (!doctor) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold">Doctor not found</h1>
          <p className="mt-2 text-muted-foreground">No doctor was found with that ID.</p>
          <div className="mt-4">
            <Link href="/client/all-doctors" className="text-primary hover:underline">
              Back to doctors
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const credentials = doctor.designations ? JSON.parse(doctor.designations) : []
  const memberSince = doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{doctor.name}</h1>
            <p className="text-sm text-muted-foreground">Doctor profile</p>
          </div>
          <Link href="/client/all-doctors" className="text-primary hover:underline">
            Back to all doctors
          </Link>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-1 text-base font-medium">{doctor.email || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Employee #</p>
            <p className="mt-1 text-base font-medium">{doctor.employeeNumber || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="mt-1 text-base font-medium">{doctor.status || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Joined</p>
            <p className="mt-1 text-base font-medium">{memberSince}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Credentials</p>
            <p className="mt-1 text-base font-medium">{credentials.length ? credentials.join(", ") : "No credentials listed"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
