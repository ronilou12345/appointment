import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type Props = {
  params: Promise<{ id: string }>
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "DR"

const getStatusVariant = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"
    case "inactive":
      return "secondary"
    default:
      return "outline"
  }
}

export default async function AdminDoctorDetailPage({ params }: Props) {
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
      status: true,
      createdAt: true,
      role: true,
    },
  })

  if (!doctor) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Doctor profile
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Doctor profile details and professional information for this doctor.
            </p>
          </div>
          <Link href="/admin/all-doctors" className="text-sm font-medium text-primary transition hover:underline">
            Back to all doctors
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-3xl border border-border bg-background p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-5">
                <Avatar size="lg">
                  <AvatarFallback>{getInitials(doctor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{doctor.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{doctor.email || "No email provided"}</p>
                </div>
                <Badge variant={getStatusVariant(doctor.status)} className="capitalize">
                  {doctor.status || "Unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email</p>
                    <p className="text-base font-medium text-foreground">{doctor.email || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Employee number</p>
                    <p className="text-base font-medium text-foreground">—</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Role</p>
                    <p className="text-base font-medium text-foreground capitalize">{doctor.role?.toLowerCase() || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
                    <p className="text-base font-medium text-foreground capitalize">{doctor.status?.toLowerCase() || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Created</p>
                    <p className="text-base font-medium text-foreground">
                      {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString("en-US") : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
