"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"
import type { VitalRow } from "@/app/client/add-bmi/columns"

const emptyForm = {
  weight: "",
  height: "",
  heartRate: "",
  bodyTemp: "",
  bloodSugar: "",
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function computeBmi(weight: string, height: string) {
  const weightKg = parseOptionalNumber(weight)
  const heightCm = parseOptionalNumber(height)
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function AddVitalsDialog({
  open,
  onOpenChange,
  onSaved,
  vital,
  showTrigger = true,
  canSelectUser = false,
  selectedUserId = "",
  onUserChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  vital?: VitalRow | null
  showTrigger?: boolean
  canSelectUser?: boolean
  selectedUserId?: string
  onUserChange?: (userId: string) => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [users, setUsers] = React.useState<{ id: string; name: string; email: string; avatar?: string | null }[]>([])
  const [userSearch, setUserSearch] = React.useState("")
  const [userPickerOpen, setUserPickerOpen] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const isEditing = Boolean(vital?.id)
  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase()
    return !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
  })
  const selectedUser = users.find((user) => user.id === selectedUserId)

  React.useEffect(() => {
    if (!open || !canSelectUser) return

    fetch("/api/users?role=PATIENT")
      .then(async (res) => {
        const result = await res.json()
        if (!res.ok || !result.success) throw new Error(result.error || "Unable to load client users")
        setUsers(Array.isArray(result.users) ? result.users : [])
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load client users"))
  }, [open, canSelectUser])

  React.useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setLoading(false)
      setUserPickerOpen(false)
      setUserSearch("")
      return
    }

    if (vital) {
      setForm({
        weight: vital.weight != null ? String(vital.weight) : "",
        height: vital.height != null ? String(vital.height) : "",
        heartRate: vital.heartRate != null ? String(vital.heartRate) : "",
        bodyTemp: vital.temp != null ? String(vital.temp) : "",
        bloodSugar: vital.bloodSugar != null ? String(vital.bloodSugar) : "",
      })
      return
    }

    setForm(emptyForm)
  }, [open, vital])

  const bmi = computeBmi(form.weight, form.height)

  const handleChange = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const weight = parseOptionalNumber(form.weight)
    const height = parseOptionalNumber(form.height)
    const heartRate = parseOptionalNumber(form.heartRate)
    const bodyTemperature = parseOptionalNumber(form.bodyTemp)
    const bloodSugar = parseOptionalNumber(form.bloodSugar)

    if (!weight || weight <= 0) {
      toast.error("Please enter a valid weight.")
      return
    }

    if (!height || height <= 0) {
      toast.error("Please enter a valid height.")
      return
    }

    if (canSelectUser && !selectedUserId) {
      toast.error("Please select a client user.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/vital-signs", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vital?.id,
          user_id: canSelectUser ? selectedUserId : undefined,
          weight,
          height,
          heart_rate: heartRate,
          body_temperature: bodyTemperature,
          blood_sugar: bloodSugar,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || (isEditing ? "Unable to update vitals" : "Unable to add vitals"))

      toast.success(isEditing ? "Vitals updated" : "Vitals saved")
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showTrigger ? (
        <Button
          size="sm"
          onClick={() => {
            onOpenChange(true)
          }}
          className="shadow-md shadow-primary/20"
        >
          <PlusIcon className="size-4 mr-2" />
          Add
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Vital Signs" : "Add Vital Signs"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update this vitals record."
                : canSelectUser
                  ? "Select a client user and record their vital signs."
                  : "Record weight, height, heart rate, temperature, and blood sugar."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {canSelectUser ? (
              <Field>
                <FieldLabel htmlFor="vital-user">Client user</FieldLabel>
                <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative">
                      {selectedUser ? (
                        <Avatar className="pointer-events-none absolute left-2 top-1/2 z-10 size-7 -translate-y-1/2">
                          {selectedUser.avatar ? <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} /> : null}
                          <AvatarFallback>{userInitials(selectedUser.name)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      )}
                      <Input
                        id="vital-user"
                        value={userPickerOpen ? userSearch : selectedUser?.name ?? ""}
                        onFocus={() => {
                          setUserPickerOpen(true)
                          setUserSearch("")
                        }}
                        onChange={(event) => {
                          setUserSearch(event.target.value)
                          setUserPickerOpen(true)
                        }}
                        placeholder="Select a client user"
                        aria-label="Search client users"
                        autoComplete="off"
                        disabled={isEditing || loading}
                        className={`h-10 w-full ${selectedUser ? "pl-11" : "pl-9"}`}
                      />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    align="start"
                    className="z-[200] w-[var(--radix-popover-trigger-width)] p-0"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                  >
                    <div className="max-h-72 overflow-y-auto p-1">
                      {filteredUsers.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No clients found.</p>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              onUserChange?.(user.id)
                              setUserPickerOpen(false)
                              setUserSearch("")
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            <Avatar size="sm" className="size-7">
                              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                              <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{user.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                            </span>
                            {user.id === selectedUserId ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </Field>
            ) : null}
            <FieldGroup className="grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="vital-weight">Weight (kg)</FieldLabel>
                <Input
                  id="vital-weight"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 65.5"
                  required
                  value={form.weight}
                  onChange={(event) => handleChange("weight", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-height">Height (cm)</FieldLabel>
                <Input
                  id="vital-height"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 170"
                  required
                  value={form.height}
                  onChange={(event) => handleChange("height", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-heart-rate">Heart Rate (bpm)</FieldLabel>
                <Input
                  id="vital-heart-rate"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Optional"
                  value={form.heartRate}
                  onChange={(event) => handleChange("heartRate", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-temp">Body Temperature (°C)</FieldLabel>
                <Input
                  id="vital-temp"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="Optional"
                  value={form.bodyTemp}
                  onChange={(event) => handleChange("bodyTemp", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-blood-sugar">Blood Sugar (mg/dL)</FieldLabel>
                <Input
                  id="vital-blood-sugar"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="Optional"
                  value={form.bloodSugar}
                  onChange={(event) => handleChange("bloodSugar", event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">BMI</p>
              <p className="mt-1 text-lg font-semibold">{bmi ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Calculated from weight and height.</p>
            </div>

            <DialogFooter className="mt-0">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Save changes" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
