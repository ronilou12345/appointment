"use client"

import * as React from "react"
import {
  UserIcon,
  SearchIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  MailIcon,
  HashIcon,
  ActivityIcon,
  CalendarIcon,
  FileTextIcon,
  AlertCircleIcon,
  EyeIcon
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import { createUserAction } from "@/lib/actions/user"

export type Patient = {
  id: string
  name: string
  email: string
  avatar?: string
  status: "Active" | "Inactive" | "Suspended"
  createdAt: string
}

// ─── Register Patient Modal ──────────────────────────────────────────────

function RegisterPatientModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (msg: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")

  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
  })

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    const formData = new FormData()
    formData.set("firstName", form.firstName)
    formData.set("lastName", form.lastName)
    formData.set("middleName", form.middleName)
    formData.set("email", form.email)
    formData.set("password", form.password)
    formData.set("role", "PATIENT")
    formData.set("status", "ACTIVE")

    const result = await createUserAction(formData)
    setLoading(false)
    if (result.success) {
      if (onSuccess) onSuccess("Patient registered successfully.")
      onOpenChange(false)
      setTimeout(() => router.refresh(), 100)
    } else {
      setErrorMsg(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <UserIcon className="size-4 text-primary" />
              </div>
              Register Patient
            </DialogTitle>
          </DialogHeader>
          
          {errorMsg && (
            <Alert variant="destructive" className="mt-2 py-2 px-3">
              <AlertCircleIcon className="size-4" />
              <div className="pl-6">
                <AlertTitle className="text-sm">Error</AlertTitle>
                <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-xs">First Name *</Label>
                <Input id="firstName" className="h-8" value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
                <Input id="lastName" className="h-8" value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input id="email" type="email" className="h-8" value={form.email} onChange={e => handleChange("email", e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs">Password *</Label>
              <Input id="password" type="password" className="h-8" value={form.password} onChange={e => handleChange("password", e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving..." : "Register"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PatientManagement({ initialPatients }: { initialPatients: Patient[] }) {
  const patients = initialPatients
  const [search, setSearch] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">Register new patients and view their medical history.</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)} className="gap-2 shadow-sm shrink-0">
          <PlusIcon className="size-4" /> Register Patient
        </Button>
      </div>

      {successMsg && (
        <Alert className="fixed bottom-8 right-8 z-50 w-full max-w-sm border-emerald-500/30 bg-emerald-50 text-emerald-900 shadow-xl py-3 px-4 animate-in slide-in-from-right-8 fade-in duration-300">
          <CheckIcon className="size-4 text-emerald-600" />
          <div className="pl-6">
            <AlertTitle className="text-sm font-bold mb-0 text-emerald-800">Success</AlertTitle>
            <AlertDescription className="text-xs mt-0 text-emerald-700/90">{successMsg}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input placeholder="Search patients by name or ID..." className="pl-8 bg-background" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground bg-muted/20">
                  <p>No patients found matching your search.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border-2 border-background shadow-sm">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm line-clamp-1">{patient.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{patient.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground text-sm">
                    {patient.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={`size-1.5 rounded-full ${patient.status === 'Active' ? 'bg-emerald-500' : patient.status === 'Inactive' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      {patient.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedPatient(patient)}
                      className="gap-1.5 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-colors h-8"
                    >
                      <EyeIcon className="size-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RegisterPatientModal 
        open={registerOpen} 
        onOpenChange={setRegisterOpen} 
        onSuccess={msg => {
          setSuccessMsg(msg)
          setTimeout(() => setSuccessMsg(""), 5000)
        }} 
      />

      <Sheet open={!!selectedPatient} onOpenChange={(val) => !val && setSelectedPatient(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          {selectedPatient && (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border bg-muted shadow-sm">
                    <AvatarImage src={selectedPatient.avatar} />
                    <AvatarFallback className="text-xl font-bold text-muted-foreground bg-primary/10 text-primary">{selectedPatient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 items-start">
                    <SheetTitle className="text-xl leading-none">{selectedPatient.name}</SheetTitle>
                    <SheetDescription className="text-sm">{selectedPatient.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex flex-col gap-6 py-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <UserIcon className="size-4 text-primary" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground/70 text-[10px] font-bold uppercase tracking-wider">Student ID</span>
                      <span className="font-medium text-foreground">{selectedPatient.email || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground/70 text-[10px] font-bold uppercase tracking-wider">Status</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {selectedPatient.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <span className="text-muted-foreground/70 text-[10px] font-bold uppercase tracking-wider">Date Registered</span>
                      <span className="font-medium text-foreground">{new Date(selectedPatient.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileTextIcon className="size-4 text-primary" /> Medical History
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col gap-1.5 border-l-4 border-l-primary/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">Annual Checkup</span>
                        <span className="text-muted-foreground font-medium">Oct 12, 2025</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Patient appeared healthy. Normal vitals. Cleared for physical activities.</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col gap-1.5 border-l-4 border-l-amber-500/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">Fever & Cough</span>
                        <span className="text-muted-foreground font-medium">Aug 05, 2025</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Prescribed Paracetamol and advised 3 days rest. Symptoms reported for two days prior.</p>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-3 gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5">
                      <PlusIcon className="size-4" /> Attach New Record
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
