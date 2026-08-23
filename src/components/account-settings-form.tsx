"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CameraIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, XCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { logoutUser } from "@/lib/actions/auth"
import { updateUserProfileAction } from "@/lib/actions/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getNameInitials, hasProfileImage } from "@/lib/user-initials"

interface AccountSettingsFormProps {
  user: {
    id: string
    name: string
    email: string
    role?: string | null
    status?: string | null
    designations?: string | null
    avatar?: string | null
  }
  doctorBackground?: {
    prefix?: string
    suffix?: string
    address?: string
    credentials?: string
    licenseNumber?: string
    yearsOfExperience?: string
    boardCertifications?: string
    specialties?: string
  }
  redirectPath: string
  title: string
  description: string
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function getInitials(name: string) {
  return getNameInitials(name)
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."))
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error("Image must be under 2MB."))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Unable to read the selected image."))
    reader.readAsDataURL(file)
  })
}

export function AccountSettingsForm({ user, doctorBackground, redirectPath, title, description }: AccountSettingsFormProps) {
  const router = useRouter()
  const nameParts = (user.name || "").split(" ")
  const [firstName, setFirstName] = useState(nameParts[0] ?? "")
  const [middleName, setMiddleName] = useState(nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : nameParts[1] ?? "")
  const [lastName, setLastName] = useState(nameParts.length > 1 ? nameParts[nameParts.length - 1] : "")
  const [personalEmail, setPersonalEmail] = useState(user.email ?? "")

  const [composedName, setComposedName] = useState(user.name ?? "")
  const [profileImagePreview, setProfileImagePreview] = useState(user.avatar ?? "")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordValue, setNewPasswordValue] = useState("")
  const [currentPasswordValue, setCurrentPasswordValue] = useState("")
  const [currentPasswordMatch, setCurrentPasswordMatch] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notify, setNotify] = useState({ title: "", message: "", success: true, askLogout: false })
  const [loggingOut, setLoggingOut] = useState(false)

  // Debounce timer
  const [validateTimer, setValidateTimer] = useState<number | null>(null)

  const getLevel = (len: number, match?: boolean) => {
    if (match === false) return { cls: "bg-red-500", width: 100 }
    if (match === true) return { cls: "bg-emerald-500", width: 100 }
    if (len === 0) return { cls: "bg-muted/40", width: 0 }
    if (len < 4) return { cls: "bg-red-500", width: Math.min(100, (len / 8) * 100) }
    if (len < 8) return { cls: "bg-amber-500", width: Math.min(100, (len / 8) * 100) }
    return { cls: "bg-emerald-500", width: Math.min(100, (len / 8) * 100) }
  }

  useEffect(() => {
    const parts = [firstName, middleName, lastName].filter(Boolean)
    setComposedName(parts.join(" "))
  }, [firstName, middleName, lastName])

  const initials = getInitials(user.name || "")
  const canSetNewPassword = currentPasswordMatch === true

  const showNotify = (title: string, message: string, success: boolean, askLogout = false) => {
    setNotify({ title, message, success, askLogout })
    setNotifyOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      if (newPasswordValue) {
        if (!canSetNewPassword) {
          showNotify(
            "Unable to save",
            "Current password does not match. Enter your old password before creating a new one.",
            false,
          )
          return
        }

        if (newPasswordValue.length < 8) {
          showNotify("Unable to save", "New password must be at least 8 characters long.", false)
          return
        }
      }

      const result = await updateUserProfileAction(new FormData(event.currentTarget))
      if (!result?.success) {
        showNotify("Unable to save", result?.error || "Unable to save changes.", false)
        return
      }

      const passwordChanged = Boolean(newPasswordValue)
      showNotify(
        "Changes saved",
        passwordChanged
          ? "Your password was updated successfully. Do you want to log out or stay on this page?"
          : "Your profile was updated successfully.",
        true,
        passwordChanged,
      )
      setCurrentPasswordValue("")
      setNewPasswordValue("")
      setCurrentPasswordMatch(null)
      router.refresh()
    } catch (error) {
      showNotify("Unable to save", error instanceof Error ? error.message : "Unable to save changes.", false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="profile-image-upload" className="relative cursor-pointer">
              <Avatar size="lg">
                {hasProfileImage(profileImagePreview) ? (
                  <AvatarImage src={profileImagePreview} alt={user.name || "Profile"} />
                ) : null}
                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                <CameraIcon className="size-3.5" />
              </span>
            </label>
            <div className="grid gap-1 text-left">
              <Label htmlFor="profile-image-upload" className="cursor-pointer text-sm font-medium text-primary">Change profile</Label>
              <Input
                id="profile-image-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden h-9 max-w-xs cursor-pointer text-sm"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return

                  try {
                    const dataUrl = await readImageFile(file)
                    setProfileImagePreview(dataUrl)
                  } catch (error) {
                    console.error(error)
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF up to 2MB.</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <input type="hidden" name="name" value={composedName} />
          <input type="hidden" name="email" value={personalEmail} />
          <input type="hidden" name="profileImage" value={profileImagePreview.startsWith("data:image/") ? profileImagePreview : ""} />
          {doctorBackground ? <input type="hidden" name="updateDoctorBackground" value="1" /> : null}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" defaultValue={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle name</Label>
              <Input id="middleName" name="middleName" defaultValue={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal email</Label>
              <Input id="personalEmail" name="personalEmail" type="email" defaultValue={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Current password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showCurrentPassword ? "text" : "password"} value={currentPasswordValue} onChange={(e) => {
                  const v = e.target.value
                  setCurrentPasswordValue(v)

                  // debounce validate
                  if (validateTimer) window.clearTimeout(validateTimer)
                  const t = window.setTimeout(async () => {
                    if (!v) {
                      setCurrentPasswordMatch(null)
                      return
                    }
                    try {
                      const res = await fetch('/api/auth/validate-current-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: v }) })
                      const json = await res.json()
                      setCurrentPasswordMatch(Boolean(json?.match))
                    } catch {
                      setCurrentPasswordMatch(false)
                    }
                  }, 500)
                  setValidateTimer(t)
                }} placeholder="Enter your current password" />
                <button type="button" onClick={() => setShowCurrentPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrentPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>

              <div className="mt-2">
                <div className="h-2 w-full rounded bg-muted/40">
                  {(() => {
                    const lvl = getLevel(currentPasswordValue.length, currentPasswordMatch ?? undefined)
                    return <div className={`h-2 rounded ${lvl.cls}`} style={{ width: `${lvl.width}%` }} />
                  })()}
                </div>
                <p className={`mt-1 text-xs ${currentPasswordMatch === false ? "text-red-600 dark:text-red-400" : currentPasswordMatch ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {currentPasswordMatch === null ? "Enter current password to validate." : currentPasswordMatch ? "Password matches." : "Password does not match."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder={canSetNewPassword ? "Enter your new password" : "Confirm current password first"}
                  value={newPasswordValue}
                  disabled={!canSetNewPassword}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                />
                <button type="button" onClick={() => setShowNewPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNewPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>

              <div className="mt-2">
                <div className="h-2 w-full rounded bg-muted/40">
                  {(() => {
                    const lvl = getLevel(newPasswordValue.length)
                    return <div className={`h-2 rounded ${lvl.cls}`} style={{ width: `${lvl.width}%` }} />
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {canSetNewPassword
                    ? "Must be at least 8 characters long."
                    : "Enter a matching current password before creating a new one."}
                </p>
              </div>
            </div>
          </div>

          {doctorBackground ? (
            <>
              <Separator className="h-px w-full bg-border" />
              <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold">Doctor background</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Professional details shown on your doctor profile.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Prefix</Label>
                    <Input id="prefix" name="prefix" defaultValue={doctorBackground.prefix} placeholder="e.g. Dr." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input id="suffix" name="suffix" defaultValue={doctorBackground.suffix} placeholder="e.g. Jr., MD" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" defaultValue={doctorBackground.address} placeholder="Enter full address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentials">Credentials</Label>
                    <Input id="credentials" name="credentials" defaultValue={doctorBackground.credentials} placeholder="e.g. MD, PhD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License number</Label>
                    <Input id="licenseNumber" name="licenseNumber" defaultValue={doctorBackground.licenseNumber} placeholder="Official license ID" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of experience</Label>
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      min="0"
                      defaultValue={doctorBackground.yearsOfExperience}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boardCertifications">Board certifications</Label>
                    <Input
                      id="boardCertifications"
                      name="boardCertifications"
                      defaultValue={doctorBackground.boardCertifications}
                      placeholder="e.g. Cardiology, Family Medicine"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="specialties">Specialties</Label>
                    <Input
                      id="specialties"
                      defaultValue={doctorBackground.specialties}
                      placeholder="Assigned specialties"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Specialties are assigned by an administrator.</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="mx-auto max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {notify.success ? (
                <CheckCircleIcon className="mt-0.5 size-6 text-emerald-600" />
              ) : (
                <XCircleIcon className="mt-0.5 size-6 text-red-600" />
              )}
              <div>
                <DialogTitle>{notify.title}</DialogTitle>
                <DialogDescription className="mt-1">{notify.message}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            {notify.askLogout ? (
              <div className="flex w-full justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNotifyOpen(false)}>
                  Stay on this page
                </Button>
                <Button
                  type="button"
                  disabled={loggingOut}
                  onClick={async () => {
                    setLoggingOut(true)
                    await logoutUser()
                  }}
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={() => setNotifyOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
