"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"

type UserOption = {
  id: string
  name: string
  email: string
  designations: string | null
  role: string
  status: string
}

export function CreateDoctorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedName, setSelectedName] = useState("")
  const [selectedDesignation, setSelectedDesignation] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    if (!open) {
      setUsers([])
      setSelectedUserId("")
      setSelectedName("")
      setSelectedDesignation("")
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

    loadUsers()
  }, [open])

  const handleUserSelect = (value: string) => {
    const selectedUser = users.find((user) => user.id === value)

    if (!selectedUser) {
      setSelectedUserId("")
      setSelectedName("")
      setSelectedDesignation("")
      return
    }

    setSelectedUserId(value)
    setSelectedName(selectedUser.name)

    if (!selectedUser.designations) {
      setSelectedDesignation("")
      return
    }

    try {
      const parsed = JSON.parse(selectedUser.designations)
      const normalizedDesignation = Array.isArray(parsed)
        ? parsed.find((item) => typeof item === "string" && item.trim())?.toString().toLowerCase() ?? ""
        : ""

      setSelectedDesignation(normalizedDesignation)
    } catch {
      setSelectedDesignation("")
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
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Select value={selectedUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger id="name">
                    <SelectValue placeholder={isLoadingUsers ? "Loading names..." : "Select existing user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedName ? (
                  <p className="text-sm text-muted-foreground">Selected: {selectedName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designations">Designations</Label>
                <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                  <SelectTrigger id="designations">
                    <SelectValue placeholder="Select designations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button className="bg-orange-500 hover:bg-orange-600">
                Create Specialties
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
