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

const parseDesignations = (value?: string | null) => {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string") as string[]
    }
  } catch {
    // ignore and fallback below
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const getBoardCertificates = (designations: string[]) =>
  designations.filter((item) => /board/i.test(item))

const getSpecialties = (designations: string[]) =>
  designations.filter((item) => !/board/i.test(item) && !/^(MD|PhD|DO|RN|RMT|BSN|DDS)$/i.test(item))

const formatExperience = (years?: number | null) => {
  if (typeof years !== "number" || Number.isNaN(years)) return "Not available"
  return years <= 0 ? "< 1 year" : `${years} year${years > 1 ? "s" : ""}`
}

export default async function AdminDoctorDetailPage({ params }: Props) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  const doctor = await prisma.doctor.findFirst({
    where: { user_id: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          designations: true,
          status: true,
          profile_image: true,
          createdAt: true,
        },
      },
    },
  })

  if (!doctor?.user) {
    notFound()
  }

  const credentials = parseDesignations(doctor.user.designations ?? doctor.credentials)
  const boardCertificates = doctor.board_certification
    ? parseDesignations(doctor.board_certification)
    : getBoardCertificates(credentials)
  const specialties = getSpecialties(credentials)
  const yearsOfExperience = formatExperience(doctor.years_of_experience)

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Doctor profile</p>
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
                  <AvatarFallback>{getInitials(doctor.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{doctor.user.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{doctor.user.email || "No email provided"}</p>
                </div>
                <Badge variant={getStatusVariant(doctor.user.status)} className="capitalize">
                  {doctor.user.status || "Unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Prefix</p>
                    <p className="text-base font-medium text-foreground">{doctor.prefix || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">First Name</p>
                    <p className="text-base font-medium text-foreground">{doctor.first_name || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last Name</p>
                    <p className="text-base font-medium text-foreground">{doctor.last_name || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Middle Name</p>
                    <p className="text-base font-medium text-foreground">{doctor.middle_name || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Suffix</p>
                    <p className="text-base font-medium text-foreground">{doctor.suffix || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Address</p>
                    <p className="text-base font-medium text-foreground">{doctor.address || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Years of Experience</p>
                    <p className="text-base font-medium text-foreground">{yearsOfExperience}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Board Certificate</p>
                    <p className="text-base font-medium text-foreground">
                      {boardCertificates.length ? boardCertificates.join(", ") : "Not available"}
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Specialties</p>
                    <p className="text-base font-medium text-foreground">
                      {specialties.length ? specialties.join(", ") : "Not available"}
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
