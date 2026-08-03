import prisma from "@/lib/prisma"
import Link from "next/link"

type Props = { params: { id: string } }

export default async function PatientPage({ params }: Props) {
  const { id } = params

  // For now, try to fetch user; if not present, show mock
  // Using prisma if available
  let patient: any = null
  try {
    patient = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, status: true, createdAt: true } })
  } catch (e) {
    // ignore
  }

  if (!patient) {
    patient = { id, name: "Unknown Patient", email: "-", status: "-", createdAt: new Date() }
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">Patient profile</p>
          </div>
          <div>
            <Link href="/admin/all-appointments" className="text-sm text-muted-foreground hover:underline">Back</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{patient.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{patient.status || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member since</p>
            <p className="font-medium">{new Date(patient.createdAt).toDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
