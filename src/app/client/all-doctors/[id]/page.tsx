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

const formatExperience = (createdAt?: Date) => {
  if (!createdAt) return "—"
  const years = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365))
  return years <= 0 ? "< 1 year" : `${years} year${years > 1 ? "s" : ""}`
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
      designations: true,
      status: true,
      createdAt: true,
      avatar: true,
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

  const nameDetails = parseName(doctor.name)
  const credentials = parseDesignations(doctor.designations)
  const boardCertificates = getBoardCertificates(credentials)
  const specialties = getSpecialties(credentials)
  const yearsOfExperience = formatExperience(doctor.createdAt)
  const memberSince = doctor.createdAt
    ? new Date(doctor.createdAt).toLocaleDateString("en-US", {
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
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Prefix</p>
                    <p className="text-base font-medium text-foreground">{nameDetails.prefix || "—"}</p>
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
                    <p className="text-base font-medium text-foreground">{nameDetails.suffix || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Address</p>
                    <p className="text-base font-medium text-foreground">—</p>
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
