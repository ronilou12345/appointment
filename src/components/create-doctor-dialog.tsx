"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, SearchIcon } from "lucide-react"

type UserOption = {
  id: string
  name: string
  avatar?: string | null
  email: string
  designations: string | null
  role: string
  status: string
}

function formatRole(role?: string) {
  const normalized = (role ?? "").toUpperCase()
  if (normalized === "NURSE") return "Doctor"
  if (normalized === "PATIENT") return "Patient"
  if (normalized === "ADMIN") return "Admin"
  if (normalized === "STAFF") return "Staff"
  return role || "User"
}

export function CreateDoctorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [users, setUsers] = useState<UserOption[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const [userQuery, setUserQuery] = useState("")
  const [specialtyPickerOpen, setSpecialtyPickerOpen] = useState(false)
  const [specialtyQuery, setSpecialtyQuery] = useState("")

  useEffect(() => {
    if (!open) {
      setUsers([])
      setSpecialties([])
      setSelectedUserId("")
      setSelectedName("")
      setSelectedDesignations([])
      setUserPickerOpen(false)
      setUserQuery("")
      setSpecialtyPickerOpen(false)
      setSpecialtyQuery("")
      return
    }

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Unable to load users")

        const data = await response.json()
        setUsers(data.users ?? [])
      } catch (error) {
        console.error("Unable to load users", error)
        setUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    const loadSpecialties = async () => {
      try {
        setIsLoadingSpecialties(true)
        const response = await fetch("/api/specialties")
        if (!response.ok) throw new Error("Unable to load specialties")

        const data = await response.json()
        const names = Array.isArray(data.specialties)
          ? data.specialties
              .map((item: unknown) => String(item ?? "").trim())
              .filter(Boolean)
          : []
        setSpecialties(Array.from(new Set(names)))
      } catch (error) {
        console.error("Unable to load specialties", error)
        setSpecialties([])
      } finally {
        setIsLoadingSpecialties(false)
      }
    }

    loadUsers()
    loadSpecialties()
  }, [open])

  const selectedUser = users.find((user) => user.id === selectedUserId)

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase()
    return users.filter((user) => {
      if (!user.id) return false
      if (!query) return true
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        formatRole(user.role).toLowerCase().includes(query)
      )
    })
  }, [users, userQuery])

  const filteredSpecialties = useMemo(() => {
    const query = specialtyQuery.trim().toLowerCase()
    return specialties.filter((specialty) => {
      if (!query) return true
      return specialty.toLowerCase().includes(query)
    })
  }, [specialties, specialtyQuery])

  const handleUserSelect = (value: string) => {
    const nextUser = users.find((user) => user.id === value)

    if (!nextUser) {
      setSelectedUserId("")
      setSelectedName("")
      return
    }

    setSelectedUserId(value)
    setSelectedName(nextUser.name)
    setUserPickerOpen(false)
    setUserQuery("")
  }

  const userInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"

  const toggleDesignation = (designation: string, checked: boolean) => {
    setSelectedDesignations((current) =>
      checked
        ? [...current, designation]
        : current.filter((item) => item !== designation)
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedUserId) {
      toast.error("Please select a user before saving.")
      return
    }

    if (!selectedDesignations.length) {
      toast.error("Please select at least one specialty.")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUserId,
          designations: JSON.stringify(selectedDesignations),
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Unable to save specialties.")
      }

      toast.success("Specialties recorded successfully.")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save specialties."
      toast.error(message)
      console.error("Failed to save specialties", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button size="sm" className="shadow-md shadow-primary/20" onClick={() => onOpenChange(true)}>
        <PlusIcon className="size-4 mr-2" />
        Assign Specialties
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Specialties</DialogTitle>
            <DialogDescription>
              Create the basic details for your Employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Select a user</Label>
                <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="name"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={userPickerOpen}
                      className="h-11 w-full justify-between px-2.5 font-normal"
                    >
                      {selectedUser ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar size="sm" className="size-7">
                            {selectedUser.avatar ? (
                              <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback>{userInitials(selectedUser.name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{selectedUser.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {isLoadingUsers ? "Loading users..." : "Select a user"}
                        </span>
                      )}
                      <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="z-[200] w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="relative border-b p-2">
                      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={userQuery}
                        onChange={(event) => setUserQuery(event.target.value)}
                        placeholder="Search name, email, or role"
                        className="h-9 pl-8"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1">
                      {isLoadingUsers ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading users...</p>
                      ) : filteredUsers.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No users found.</p>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected = user.id === selectedUserId
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user.id)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <Avatar size="sm" className="size-7">
                                {user.avatar ? (
                                  <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                ) : null}
                                <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{user.name}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {user.email} · {formatRole(user.role)}
                                </span>
                              </span>
                              {isSelected ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedName ? (
                  <p className="text-sm text-muted-foreground">Selected: {selectedName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designations">Select specialties</Label>
                <Popover open={specialtyPickerOpen} onOpenChange={setSpecialtyPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="designations"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={specialtyPickerOpen}
                      className="h-11 w-full justify-between px-2.5 font-normal"
                    >
                      <span className="truncate">
                        {selectedDesignations.length
                          ? selectedDesignations.join(", ")
                          : isLoadingSpecialties
                          ? "Loading specialties..."
                          : "Select specialties"}
                      </span>
                      <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="z-[200] w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="relative border-b p-2">
                      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={specialtyQuery}
                        onChange={(event) => setSpecialtyQuery(event.target.value)}
                        placeholder="Search specialties"
                        className="h-9 pl-8"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto p-1">
                      {isLoadingSpecialties ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">Loading specialties...</p>
                      ) : filteredSpecialties.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No specialties found.</p>
                      ) : (
                        filteredSpecialties.map((specialty) => {
                          const isSelected = selectedDesignations.includes(specialty)
                          return (
                            <button
                              key={specialty}
                              type="button"
                              onClick={() => toggleDesignation(specialty, !isSelected)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <span className="min-w-0 flex-1 truncate">{specialty}</span>
                              {isSelected ? <CheckIcon className="size-4 shrink-0 text-primary" /> : null}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create Specialties"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
