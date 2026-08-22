"use client"

import { useEffect, useState, type FormEvent } from "react"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"

type UserOption = {
  id: string
  name: string
  avatar?: string | null
  email: string
  designations: string | null
  role: string
  status: string
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

  useEffect(() => {
    if (!open) {
      setUsers([])
      setSpecialties([])
      setSelectedUserId("")
      setSelectedName("")
      setSelectedDesignations([])
      return
    }

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const response = await fetch("/api/users?role=NURSE")
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
        setSpecialties(Array.isArray(data.specialties) ? data.specialties : [])
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

  const handleUserSelect = (value: string) => {
    const nextUser = users.find((user) => user.id === value)

    if (!nextUser) {
      setSelectedUserId("")
      setSelectedName("")
      return
    }

    setSelectedUserId(value)
    setSelectedName(nextUser.name)
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
        New
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
                <Select value={selectedUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger id="name" className="h-11 w-full">
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
                      <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" className="size-7">
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedName ? (
                  <p className="text-sm text-muted-foreground">Selected: {selectedName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designations">Select specialties</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between w-full text-left"
                    >
                      <span>
                        {selectedDesignations.length
                          ? selectedDesignations.join(", ")
                          : isLoadingSpecialties
                          ? "Loading specialties..."
                          : "Select specialties"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-full max-w-sm">
                    <DropdownMenuLabel>Specialties</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {specialties.map((specialty) => (
                      <DropdownMenuCheckboxItem
                        key={specialty}
                        checked={selectedDesignations.includes(specialty)}
                        onCheckedChange={(checked) => toggleDesignation(specialty, Boolean(checked))}
                      >
                        {specialty}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
