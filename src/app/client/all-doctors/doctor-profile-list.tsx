"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export type DoctorProfile = {
  id: string
  name: string
  email: string
  employeeNumber?: string | null
  designations?: string | null
  status?: string | null
  avatar?: string | null
  createdAt: string
}

type NameDetails = {
  prefix: string
  firstName: string
  middleInitial: string
  lastName: string
  suffix: string
}

const knownPrefixes = new Set(["Dr.", "Dr", "Mr.", "Mr", "Mrs.", "Mrs", "Ms.", "Ms", "Prof.", "Prof"])
const knownSuffixes = new Set(["Jr.", "Jr", "Sr.", "Sr", "II", "III", "IV", "MD", "PhD", "DO", "DDS"])

function parseName(name: string): NameDetails {
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
  const middleInitial = tokens.length > 2 ? `${tokens.slice(1, -1)[0][0] ?? ""}` : ""

  return {
    prefix,
    firstName,
    middleInitial,
    lastName,
    suffix,
  }
}

function parseDesignations(value?: string | null) {
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

function formatExperience(createdAt: string) {
  const createdDate = new Date(createdAt)
  const years = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
  if (years <= 0) {
    return "< 1 year"
  }
  return `${years} year${years > 1 ? "s" : ""}`
}

function getStatusVariant(status?: string | null) {
  if (status === "ACTIVE") return "default"
  return "secondary"
}

export default function DoctorProfileList({ doctors }: { doctors: DoctorProfile[] }) {
  const doctorsWithMeta = useMemo(
    () =>
      doctors.map((doctor) => {
        const nameDetails = parseName(doctor.name)
        const credentials = parseDesignations(doctor.designations)
        const initials = [nameDetails.firstName, nameDetails.lastName]
          .filter(Boolean)
          .map((token) => token[0])
          .join("")
          .toUpperCase() || "DR"

        return {
          ...doctor,
          initials,
          credentials,
          nameDetails,
          experienceLabel: formatExperience(doctor.createdAt),
          joinedDate: new Date(doctor.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          address: "Clinic address not provided",
        }
      }),
    [doctors]
  )

  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorsWithMeta[0]?.id ?? "")
  const selectedDoctor =
    doctorsWithMeta.find((doctor) => doctor.id === selectedDoctorId) ?? doctorsWithMeta[0]

  if (!selectedDoctor) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No doctors are available at the moment.
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_1fr]">
      <aside className="space-y-4 rounded-3xl border border-border bg-background p-4">
        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Choose a doctor</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse doctors and preview their profile details without leaving this page.
          </p>
        </div>

        <div className="space-y-3">
          {doctorsWithMeta.map((doctor) => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => setSelectedDoctorId(doctor.id)}
              className={`w-full rounded-3xl border p-4 text-left transition-all ${
                selectedDoctor.id === doctor.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {doctor.avatar ? (
                    <AvatarImage src={doctor.avatar} alt={doctor.name} />
                  ) : (
                    <AvatarFallback>{doctor.initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{doctor.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {doctor.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{doctor.credentials.length ? doctor.credentials.join(", ") : "No credentials listed"}</span>
                <span className="h-4 rounded-full bg-muted px-2 leading-4">{doctor.experienceLabel}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {selectedDoctor.avatar ? (
                <AvatarImage src={selectedDoctor.avatar} alt={selectedDoctor.name} />
              ) : (
                <AvatarFallback>{selectedDoctor.initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-foreground">{selectedDoctor.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Full doctor profile and contact details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={getStatusVariant(selectedDoctor.status)}>
              {selectedDoctor.status || "Unknown"}
            </Badge>
            <Link
              href={`/client/all-doctors/${selectedDoctor.id}`}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              View full profile
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-border bg-background p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profile details</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Prefix</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedDoctor.nameDetails.prefix || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Suffix</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedDoctor.nameDetails.suffix || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">First name</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedDoctor.nameDetails.firstName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last name</p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedDoctor.nameDetails.lastName || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact</p>
              <div className="mt-4 space-y-3 text-sm text-foreground">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email</p>
                  <p className="mt-1 font-medium">{selectedDoctor.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Address</p>
                  <p className="mt-1 font-medium">{selectedDoctor.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-border bg-background p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credentials</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedDoctor.credentials.length ? (
                  selectedDoctor.credentials.map((credential) => (
                    <Badge key={credential} variant="outline">
                      {credential}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-foreground">No credentials available</span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Employee #</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {selectedDoctor.employeeNumber || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Experience</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {selectedDoctor.experienceLabel}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Member since</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {selectedDoctor.joinedDate}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
