"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { columns, UserRow } from "./columns"
import { DataTable } from "@/components/data-table"
import { createUserAction } from "@/lib/actions/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MailIcon, UserIcon, LockIcon, HashIcon, BriefcaseIcon, CheckIcon, XIcon } from "lucide-react"

export type CreateUserForm = {
  userType: string
  email: string
  status: string
  firstName: string
  middleName: string
  lastName: string
  prefix: string
  suffix: string
  credentials: string
  password: string
  studentNumber: string
  employeeNumber: string
}

function CreateUserModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [form, setForm] = React.useState<CreateUserForm>({
    userType: "PATIENT",
    email: "",
    status: "Active",
    firstName: "",
    middleName: "",
    lastName: "",
    prefix: "",
    suffix: "",
    credentials: "",
    password: "",
    studentNumber: "",
    employeeNumber: "",
  })

  const handleChange = (field: keyof CreateUserForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (result.success) {
      onSuccess("User account created successfully.")
      onOpenChange(false)
      setTimeout(() => router.refresh(), 100)
    } else {
      setErrorMsg(result.error || "Unable to create user.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Create User</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Create the basic details for your user account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                  User Account
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="userType" className="text-xs font-medium">
                      User
                    </Label>
                    <Select
                      value={form.userType}
                      onValueChange={(value) => handleChange("userType", value)}
                    >
                      <SelectTrigger id="userType" className="h-10 text-sm">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="PATIENT">Patient</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Personal Email
                    </Label>
                    <div className="relative">
                      <MailIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="username@school.edu"
                        className="h-10 pl-10 text-sm"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="status" className="text-xs font-medium">
                    Status
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger id="status" className="h-10 text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Applicant">Applicant</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-end"></div>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                  Basic Information
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      className="h-10 text-sm"
                      value={form.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="middleName" className="text-xs font-medium">
                      Middle Name
                    </Label>
                    <Input
                      id="middleName"
                      placeholder="Middle name"
                      className="h-10 text-sm"
                      value={form.middleName}
                      onChange={(e) => handleChange("middleName", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      className="h-10 text-sm"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prefix" className="text-xs font-medium">
                    Prefix
                  </Label>
                  <Input
                    id="prefix"
                    placeholder="e.g. Mr., Ms., Dr."
                    className="h-10 text-sm"
                    value={form.prefix}
                    onChange={(e) => handleChange("prefix", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="suffix" className="text-xs font-medium">
                    Suffix
                  </Label>
                  <Input
                    id="suffix"
                    placeholder="e.g. Jr., Sr., III"
                    className="h-10 text-sm"
                    value={form.suffix}
                    onChange={(e) => handleChange("suffix", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="credentials" className="text-xs font-medium">
                    Credentials
                  </Label>
                  <Input
                    id="credentials"
                    placeholder="e.g. PhD, MD, RN"
                    className="h-10 text-sm"
                    value={form.credentials}
                    onChange={(e) => handleChange("credentials", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      className="h-10 pl-10 text-sm"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="studentNumber" className="text-xs font-medium">
                    Student Number
                  </Label>
                  <div className="relative">
                    <HashIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="studentNumber"
                      placeholder="Official student ID number"
                      className="h-10 pl-10 text-sm font-mono"
                      value={form.studentNumber}
                      onChange={(e) => handleChange("studentNumber", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="employeeNumber" className="text-xs font-medium">
                    Employee Number
                  </Label>
                  <div className="relative">
                    <BriefcaseIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="employeeNumber"
                      placeholder="Official employee ID number"
                      className="h-10 pl-10 text-sm font-mono"
                      value={form.employeeNumber}
                      onChange={(e) => handleChange("employeeNumber", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 pt-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <XIcon className="size-4" />
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2">
              <CheckIcon className="size-4" />
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ManageUsersClient({ users }: { users: UserRow[] }) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground">Manage user information and profiles.</p>
          </div>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setCreateOpen(true)}>
            ADD USER
          </Button>
        </div>

        {successMessage ? (
          <Alert className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <AlertTitle className="text-sm font-semibold">Success</AlertTitle>
            <AlertDescription className="text-sm">{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <DataTable columns={columns} data={users} />
      </div>

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={(message) => setSuccessMessage(message)} />
    </div>
  )
}
