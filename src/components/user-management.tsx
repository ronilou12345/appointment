"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowUpDownIcon,
  Columns3Icon,
  EllipsisIcon,
  DownloadIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  UserIcon,
  MailIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XIcon,
  CheckIcon,
  LockIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { createUserAction } from "@/lib/actions/user"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = {
  id: string
  name: string
  email: string
  avatar?: string
  status: "Active" | "Inactive" | "Suspended"
  designations: string[]

}

// Removed Sample Data

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function StatusBadge({ status }: { status: User["status"] }) {
  const variants: Record<User["status"], string> = {
    Active:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    Inactive:
      "bg-zinc-500/15 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20",
    Suspended:
      "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${variants[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function SortableHeader({
  column,
  children,
}: {
  column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => string | false }
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDownIcon className="size-3.5 opacity-60" />
    </Button>
  )
}

const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center px-1">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center px-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9 shrink-0 ring-2 ring-background">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <SortableHeader column={column}>Institutional Email</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => <RowActionsMenu user={row.original} />,
    enableHiding: false,
  },
]

// ─── Row Actions ─────────────────────────────────────────────────────────────

function RowActionsMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity"
          aria-label="Open actions"
        >
          <EllipsisIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="gap-2">
          <EyeIcon className="size-3.5 text-muted-foreground" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <PencilIcon className="size-3.5 text-muted-foreground" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="gap-2">
          <TrashIcon className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
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
    status: "Active",
    role: "",
    password: "",
  })

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    const formData = new FormData()
    Object.entries(form).forEach(([key, val]) => {
      if (key !== "") {
        formData.set(key, String(val))
      }
    })
    const result = await createUserAction(formData)
    setLoading(false)
    if (result.success) {
      if (onSuccess) onSuccess("User has been created and saved to the database successfully.")
      onOpenChange(false)
      setTimeout(() => router.refresh(), 100)
    } else {
      setErrorMsg(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <UserIcon className="size-4 text-primary" />
            </div>
            Create New User
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="py-3 px-4 shadow-sm border-destructive/20 bg-destructive/10 text-destructive mt-1">
            <AlertCircleIcon className="size-4 text-destructive" />
            <div className="pl-6">
              <AlertTitle className="text-sm font-bold mb-0">Error creating user</AlertTitle>
              <AlertDescription className="text-xs mt-0">{errorMsg}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-4 py-1">
          {/* Name Section */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Personal Information
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Juan"
                  className="h-9 text-sm"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Dela Cruz"
                  className="h-9 text-sm"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="middleName" className="text-xs font-medium">
                Middle Name{" "}
                <span className="text-muted-foreground/60 font-normal">(optional)</span>
              </Label>
              <Input
                id="middleName"
                placeholder="e.g. Santos"
                className="h-9 text-sm"
                value={form.middleName}
                onChange={(e) => handleChange("middleName", e.target.value)}
              />
            </div>
          </div>

          {/* Account Section */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Account Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Institutional Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MailIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="username@ckcm.edu.ph"
                    className="h-9 pl-8 text-sm"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="h-9 pl-8 text-sm"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role & Status Section */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role" className="text-xs font-medium">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.role}
                onValueChange={(v) => handleChange("role", v)}
              >
                <SelectTrigger id="role" className="h-9 text-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="NURSE">Doctor / Nurse</SelectItem>
                    <SelectItem value="PATIENT">Patient</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className="text-xs font-medium">
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger id="status" className="h-9 text-sm">
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
          </div>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
          >
            <XIcon className="size-3.5" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="gap-1.5 shadow-lg shadow-primary/20"
          >
            <CheckIcon className="size-3.5" />
            {loading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const data = initialUsers
  const [successMsg, setSuccessMsg] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [createOpen, setCreateOpen] = React.useState(false)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const totalCount = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-0">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage user information and profiles.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <DownloadIcon className="size-3.5" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs shadow-md shadow-primary/20"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-3.5" />
            New
          </Button>
        </div>
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

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 pl-8 pr-8 text-sm"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column Customization */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Columns3Icon className="size-3.5" />
                Column Customization
                <span className="text-muted-foreground/50 text-[10px]">⌃</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter(
                  (col) =>
                    typeof col.accessorFn !== "undefined" && col.getCanHide()
                )
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize text-sm"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id.charAt(0).toUpperCase() + col.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Refresh"
          >
            <RefreshCwIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/60">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-muted-foreground py-2.5"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row border-b border-border/40 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ShieldCheckIcon className="size-8 opacity-30" />
                    No users found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {selectedCount > 0 ? (
            <>
              <span className="font-medium text-foreground">{selectedCount}</span>
              {" "}of{" "}
            </>
          ) : null}
          <span className="font-medium text-foreground">{totalCount}</span>
          {" "}user{totalCount !== 1 ? "s" : ""}
          {selectedCount > 0 ? " selected" : " total"}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-7 w-14 text-xs" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground min-w-20 text-center">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(table.getPageCount(), 1)}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Create User Modal ───────────────────────────────────────────── */}
      <CreateUserModal 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        onSuccess={(msg) => setSuccessMsg(msg)} 
      />
    </div>
  )
}
