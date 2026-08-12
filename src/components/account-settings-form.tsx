"use client"

import React, { useEffect, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfileAction } from "@/lib/actions/user"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AccountSettingsFormProps {
  user: {
    id: string
    name: string
    email: string
    role?: string | null
    status?: string | null
    designations?: string | null
  }
  redirectPath: string
  title: string
  description: string
}

export function AccountSettingsForm({ user, redirectPath, title, description }: AccountSettingsFormProps) {
  const nameParts = (user.name || "").split(" ")
  const [firstName, setFirstName] = useState(nameParts[0] ?? "")
  const [middleName, setMiddleName] = useState(nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : nameParts[1] ?? "")
  const [lastName, setLastName] = useState(nameParts.length > 1 ? nameParts[nameParts.length - 1] : "")
  const [personalEmail, setPersonalEmail] = useState(user.email ?? "")

  const [composedName, setComposedName] = useState(user.name ?? "")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordValue, setNewPasswordValue] = useState("")
  const [currentPasswordValue, setCurrentPasswordValue] = useState("")
  const [currentPasswordMatch, setCurrentPasswordMatch] = useState<boolean | null>(null)

  // Debounce timer
  const [validateTimer, setValidateTimer] = useState<number | null>(null)

  const getLevel = (len: number, match?: boolean) => {
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

  const initials = (user.name || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex flex-col items-center">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/5 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <button type="button" className="mt-2 text-sm text-primary underline">Change profile</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={updateUserProfileAction} className="space-y-6">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <input type="hidden" name="name" value={composedName} />
          <input type="hidden" name="email" value={personalEmail} />

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
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentPasswordMatch === null ? 'Enter current password to validate.' : currentPasswordMatch ? 'Password matches.' : 'Password does not match.'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input id="newPassword" name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="Enter your new password" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} />
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
                <p className="mt-1 text-xs text-muted-foreground">Must be at least 8 characters long.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Role:</span> {user.role ?? "USER"}</p>
            <p><span className="font-medium text-foreground">Status:</span> {user.status ?? "ACTIVE"}</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
