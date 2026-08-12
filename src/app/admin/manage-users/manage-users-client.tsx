"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { columns, UserRow } from "./columns"
import { DataTable } from "@/components/data-table"
import { createUserAction } from "@/lib/actions/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
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
  boardCertifications: string
  password: string
  licenseNumber: string
  yearsofexperience: string
  address: string
}

type EditUserForm = {
  id: string
  name: string
  email: string
  status: string
  role: string
  address: string
  prefix: string
  suffix: string
  credentials: string
  licenseNumber: string
  yearsOfExperience: string
  boardCertifications: string
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
    boardCertifications: "",
    password: "",
    licenseNumber: "",
    yearsofexperience: "",
    address: "",
  })

  const handleChange = (field: keyof CreateUserForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const resetForm = React.useCallback(() => {
    setForm({
      userType: "PATIENT",
      email: "",
      status: "Active",
      firstName: "",
      middleName: "",
      lastName: "",
      prefix: "",
      suffix: "",
      credentials: "",
      boardCertifications: "",
      password: "",
      licenseNumber: "",
      yearsofexperience: "",
      address: "",
    })
    setErrorMsg("")
  }, [])

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
      toast.success("User account created successfully")
      onSuccess("User account created successfully.")
      resetForm()
      onOpenChange(false)
      setTimeout(() => router.refresh(), 100)
    } else {
      const errorMessage = result.error || "Unable to create user."
      setErrorMsg(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-[720px] sm:w-[90vw]">
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
                <FieldGroup className="grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="userType">User</FieldLabel>
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
                          <SelectItem value="PATIENT">Patient</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Personal Email</FieldLabel>
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
                  </Field>
                </FieldGroup>
              </div>

              <FieldGroup className="grid-cols-1 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
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
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="sm:pt-6" />
              </FieldGroup>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                  Basic Information
                </p>
                <FieldGroup className="grid-cols-1 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      className="h-10 text-sm"
                      value={form.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                    <Input
                      id="middleName"
                      placeholder="Middle name"
                      className="h-10 text-sm"
                      value={form.middleName}
                      onChange={(e) => handleChange("middleName", e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      className="h-10 text-sm"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </div>

              <FieldGroup className="grid-cols-1 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="prefix">
                    Prefix<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="prefix"
                    placeholder="e.g. Mr., Ms., Dr."
                    className="h-10 text-sm"
                    value={form.prefix}
                    onChange={(e) => handleChange("prefix", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="suffix">
                    Suffix<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="suffix"
                    placeholder="e.g. Jr., Sr., III"
                    className="h-10 text-sm"
                    value={form.suffix}
                    onChange={(e) => handleChange("suffix", e.target.value)}
                  />
                </Field>
              </FieldGroup>

              <Field>
                <FieldLabel htmlFor="address">
                  Address<span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="address"
                  placeholder="Enter full address"
                  className="h-10 text-sm"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </Field>

              <FieldGroup className="grid-cols-1 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="credentials">
                    Credentials<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="credentials"
                    placeholder="e.g. PhD, MD, RN"
                    className="h-10 text-sm"
                    value={form.credentials}
                    onChange={(e) => handleChange("credentials", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">
                    Password<span className="text-destructive">*</span>
                  </FieldLabel>
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
                </Field>
              </FieldGroup>

              {form.userType === "DOCTOR" ? (
                <FieldGroup className="grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="licenseNumber">
                      License Number<span className="text-destructive">*</span>
                    </FieldLabel>
                    <div className="relative">
                      <HashIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                      <Input
                        id="licenseNumber"
                        placeholder="Official license ID number"
                        className="h-10 pl-10 text-sm font-mono"
                        value={form.licenseNumber}
                        onChange={(e) => handleChange("licenseNumber", e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="yearsofexperience">
                      Years of Experience<span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={form.yearsofexperience}
                      onValueChange={(value) => handleChange("yearsofexperience", value)}
                    >
                      <SelectTrigger id="yearsofexperience" className="h-10 text-sm">
                        <SelectValue placeholder="Select years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Array.from({ length: 100 }, (_, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {index + 1} {index + 1 === 1 ? "year" : "years"}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="boardCertifications">Board Certifications</FieldLabel>
                    <Input
                      id="boardCertifications"
                      placeholder="e.g. Cardiology, Family Medicine"
                      className="h-10 text-sm"
                      value={form.boardCertifications}
                      onChange={(e) => handleChange("boardCertifications", e.target.value)}
                    />
                    <FieldDescription>
                      Add multiple certifications separated by commas.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              ) : null}
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

function EditUserSheet({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow | null
  onSuccess: (message: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [form, setForm] = React.useState<EditUserForm>({
    id: "",
    name: "",
    email: "",
    status: "Active",
    role: "PATIENT",
    address: "",
    prefix: "",
    suffix: "",
    credentials: "",
    licenseNumber: "",
    yearsOfExperience: "",
    boardCertifications: "",
  })

  React.useEffect(() => {
    if (!user) return
    setForm({
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      status: user.status ?? "Active",
      role: user.role ?? "PATIENT",
      address: user.address ?? "",
      prefix: user.prefix ?? "",
      suffix: user.suffix ?? "",
      credentials: user.credentials ?? "",
      licenseNumber: user.licenseNumber ?? "",
      yearsOfExperience: user.yearsOfExperience ?? "",
      boardCertifications: user.boardCertifications ?? "",
    })
    setErrorMsg("")
  }, [user])

  const handleChange = (field: keyof EditUserForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.id) return

    setLoading(true)
    setErrorMsg("")

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const result = await response.json()
    setLoading(false)

    if (result.success) {
      toast.success("User updated successfully")
      onSuccess("User updated successfully.")
      onOpenChange(false)
      setTimeout(() => router.refresh(), 100)
    } else {
      const errorMessage = result.error || "Unable to update user."
      setErrorMsg(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>Update the user profile details and access settings.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {errorMsg ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full name</Label>
                <Input id="edit-name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={form.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={form.role} onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="PATIENT">Patient</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-prefix">Prefix</Label>
                  <Input id="edit-prefix" value={form.prefix} onChange={(e) => handleChange("prefix", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-suffix">Suffix</Label>
                  <Input id="edit-suffix" value={form.suffix} onChange={(e) => handleChange("suffix", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-credentials">Credentials</Label>
                <Input id="edit-credentials" value={form.credentials} onChange={(e) => handleChange("credentials", e.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-license-number">License number</Label>
                  <Input id="edit-license-number" value={form.licenseNumber} onChange={(e) => handleChange("licenseNumber", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-years">Years of experience</Label>
                  <Input id="edit-years" value={form.yearsOfExperience} onChange={(e) => handleChange("yearsOfExperience", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-board">Board certifications</Label>
                <Input id="edit-board" value={form.boardCertifications} onChange={(e) => handleChange("boardCertifications", e.target.value)} />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function ManageUsersClient({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("")

  React.useEffect(() => {
    const openEditUser = (event: Event) => {
      const customEvent = event as CustomEvent<UserRow>
      setSelectedUser(customEvent.detail ?? null)
      setEditOpen(true)
    }

    const openDeleteUser = (event: Event) => {
      const customEvent = event as CustomEvent<UserRow>
      setSelectedUser(customEvent.detail ?? null)
      setDeleteOpen(true)
    }

    window.addEventListener("open-edit-user", openEditUser as EventListener)
    window.addEventListener("open-delete-user", openDeleteUser as EventListener)
    return () => {
      window.removeEventListener("open-edit-user", openEditUser as EventListener)
      window.removeEventListener("open-delete-user", openDeleteUser as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Users</h1>
              <p className="text-sm text-muted-foreground">Manage user information and profiles.</p>
            </div>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setCreateOpen(true)}>
               + Add
            </Button>
          </div>

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <AlertTitle className="text-sm font-semibold">Success</AlertTitle>
              <AlertDescription className="text-sm">{successMessage}</AlertDescription>
            </div>
          ) : null}

          <DataTable columns={columns} data={users} />
        </div>
      </div>

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={(message) => setSuccessMessage(message)} />
      <EditUserSheet open={editOpen} onOpenChange={setEditOpen} user={selectedUser} onSuccess={(message) => setSuccessMessage(message)} />
      <Dialog open={deleteOpen} onOpenChange={(o) => setDeleteOpen(o)}>
        <DialogContent className="mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Delete account</DialogTitle>
            <DialogDescription className="text-lg">Are you sure you want to delete this user account?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button disabled={selectedUser?.role === 'ADMIN'} className="bg-red-600 text-white" onClick={async () => {
                if (!selectedUser) return
                if (selectedUser.role === 'ADMIN') {
                  toast.error('Admin accounts cannot be deleted')
                  return
                }
                try {
                  const res = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedUser.id }) })
                  const result = await res.json()
                  if (!res.ok || !result.success) throw new Error(result.error || 'Unable to delete user')
                  toast.success('User deleted')
                  setDeleteOpen(false)
                  setTimeout(() => router.refresh(), 100)
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err)
                  toast.error(msg)
                }
              }}>Delete</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
