import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StatusBadge } from "@/app/admin/manage-users/columns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

const knownPrefixes = new Set(["Dr.", "Dr", "Mr.", "Mr", "Mrs.", "Mrs", "Ms.", "Ms", "Prof.", "Prof"])
const knownSuffixes = new Set(["Jr.", "Jr", "Sr.", "Sr", "II", "III", "IV", "MD", "PhD", "DO", "DDS"])

type NameDetails = {
  prefix: string
  firstName: string
  middleInitial: string
  lastName: string
  suffix: string
}

const parseName = (name: string): NameDetails => {
  const tokens = name.split(" ").filter(Boolean)
  let prefix = ""
  let suffix = ""

  if (tokens.length > 0 && knownPrefixes.has(tokens[0])) {
    prefix = tokens.shift() ?? ""
  }

  if (tokens.length > 0 && knownSuffixes.has(tokens[tokens.length - 1])) {
    suffix = tokens.pop() ?? ""
  }

  const firstName = tokens[0] ?? ""
  const lastName = tokens[tokens.length - 1] ?? ""
  const middleInitial = tokens.length > 2 ? tokens.slice(1, -1).map((part) => part[0].toUpperCase()).join("") : ""

  return {
    prefix,
    firstName,
    middleInitial,
    lastName,
    suffix,
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
    // fall back to comma-separated values
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

export default async function ClientDoctorPage({ params }: Props) {
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

  const profileUser = doctor.user
  const nameDetails = parseName(profileUser.name)
  const credentials = parseDesignations(profileUser.designations ?? doctor.credentials)
  const boardCertificates = doctor.board_certification
    ? parseDesignations(doctor.board_certification)
    : getBoardCertificates(credentials)
  const specialties = getSpecialties(credentials)
  const yearsOfExperience = formatExperience(doctor.years_of_experience)
  const sessions = await prisma.session_tbl.findMany({
    where: {
      doctor_id: doctor.doctor_id,
      session_date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    orderBy: [{ session_date: "asc" }, { start_time: "asc" }],
    select: {
      session_id: true,
      session_date: true,
      start_time: true,
      end_time: true,
      slots: true,
      appointment_type: true,
    },
  })
  const memberSince = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—"

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
          <Link href="/client/all-doctors" className="text-sm font-medium text-primary transition hover:underline">
            Back to all doctors
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] p-6">
            <div className="rounded-3xl border border-border bg-background p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-5">
                <Avatar size="lg">
                  {profileUser.profile_image ? (
                    <AvatarImage src={profileUser.profile_image} alt={profileUser.name} />
                  ) : null}
                  <AvatarFallback>{getInitials(profileUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{profileUser.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{profileUser.email || "No email provided"}</p>
                </div>
                <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <p className="font-medium">Session available</p>
                  <p className="mt-1 text-xs text-emerald-600">
                    {sessions.length ? `${sessions.length} upcoming session${sessions.length > 1 ? "s" : ""}` : "No upcoming sessions"}
                  </p>
                </div>
                <StatusBadge status={profileUser.status ?? "Active"} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email</p>
                    <p className="text-base font-medium text-foreground">{profileUser.email || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Prefix</p>
                    <p className="text-base font-medium text-foreground">{doctor.prefix || nameDetails.prefix || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">First name</p>
                    <p className="text-base font-medium text-foreground">{nameDetails.firstName || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Middle initial</p>
                    <p className="text-base font-medium text-foreground">{nameDetails.middleInitial || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last name</p>
                    <p className="text-base font-medium text-foreground">{nameDetails.lastName || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Suffix</p>
                    <p className="text-base font-medium text-foreground">{doctor.suffix || nameDetails.suffix || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Address</p>
                    <p className="text-base font-medium text-foreground">{doctor.address || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Years of experience</p>
                    <p className="text-base font-medium text-foreground">{yearsOfExperience}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Board certificate</p>
                    <p className="text-base font-medium text-foreground">
                      {boardCertificates.length ? boardCertificates.join(", ") : "Not available"}
                    </p>
                  </div>
                  <div className="space-y-2 pb-4">
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
