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
  BadgeDollarSignIcon,
  Columns3Icon,
  CreditCardIcon,
  EllipsisIcon,
  EyeIcon,
  FilePlusIcon,
  HashIcon,
  MailIcon,
  MinusCircleIcon,
  PhoneIcon,
  PlusIcon,
  PrinterIcon,
  RefreshCwIcon,
  SearchIcon,
  TrashIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  ClockIcon,
  WalletIcon,
  CalendarIcon,
  PencilIcon,
} from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Partial"
type PaymentMethod = "Cash" | "GCash" | "Bank Transfer" | "Check" | ""

interface FeeItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface Invoice {
  id: string
  invoiceNo: string
  studentName: string
  studentNumber: string
  contact: string
  issueDate: string
  dueDate: string
  amount: number
  paid: number
  status: InvoiceStatus
  paymentMethod: PaymentMethod
  notes: string
  items: FeeItem[]
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const sampleInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-2024-001",
    studentName: "Mr. Crisvyguel A. Monticalvo",
    studentNumber: "252522",
    contact: "crisvyguelmonticalvo@ckcm.edu.ph",
    issueDate: "2024-01-05",
    dueDate: "2024-01-31",
    amount: 18500,
    paid: 18500,
    status: "Paid",
    paymentMethod: "GCash",
    notes: "",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 15000 },
      { id: "2", description: "Miscellaneous Fee", quantity: 1, unitPrice: 3500 },
    ],
  },
  {
    id: "2",
    invoiceNo: "INV-2024-002",
    studentName: "Mr. Ybrahim Buale",
    studentNumber: "250157",
    contact: "ybrahimbuale@ckcm.edu.ph",
    issueDate: "2024-02-01",
    dueDate: "2024-02-28",
    amount: 21000,
    paid: 10000,
    status: "Partial",
    paymentMethod: "Cash",
    notes: "Remaining balance due next term.",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 15000 },
      { id: "2", description: "Library Fee", quantity: 1, unitPrice: 500 },
      { id: "3", description: "Laboratory Fee", quantity: 1, unitPrice: 2500 },
      { id: "4", description: "Development Fee", quantity: 1, unitPrice: 3000 },
    ],
  },
  {
    id: "3",
    invoiceNo: "INV-2024-003",
    studentName: "Mr. Farhan A. Guina",
    studentNumber: "253938",
    contact: "farhanguina@ckcm.edu.ph",
    issueDate: "2024-01-10",
    dueDate: "2024-01-20",
    amount: 16800,
    paid: 0,
    status: "Overdue",
    paymentMethod: "",
    notes: "",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 15000 },
      { id: "2", description: "Miscellaneous Fee", quantity: 1, unitPrice: 1800 },
    ],
  },
  {
    id: "4",
    invoiceNo: "INV-2024-004",
    studentName: "Mr. Jhon Rico B. Maghuyop",
    studentNumber: "232150",
    contact: "jhonmaghuyop@ckcm.edu.ph",
    issueDate: "2024-03-01",
    dueDate: "2024-03-31",
    amount: 22500,
    paid: 0,
    status: "Unpaid",
    paymentMethod: "",
    notes: "",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 18000 },
      { id: "2", description: "Athletics Fee", quantity: 1, unitPrice: 1500 },
      { id: "3", description: "Miscellaneous Fee", quantity: 1, unitPrice: 3000 },
    ],
  },
  {
    id: "5",
    invoiceNo: "INV-2024-005",
    studentName: "Mr. Arham A. Guina",
    studentNumber: "252591",
    contact: "arhamguina@ckcm.edu.ph",
    issueDate: "2024-03-05",
    dueDate: "2024-04-05",
    amount: 19200,
    paid: 19200,
    status: "Paid",
    paymentMethod: "Bank Transfer",
    notes: "Scholarship applied.",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 15000 },
      { id: "2", description: "Scholarship Discount", quantity: 1, unitPrice: -2000 },
      { id: "3", description: "Miscellaneous Fee", quantity: 1, unitPrice: 4200 },
      { id: "4", description: "Activity Fee", quantity: 1, unitPrice: 2000 },
    ],
  },
  {
    id: "6",
    invoiceNo: "INV-2024-006",
    studentName: "Mr. Marc Asher L. Cabañero",
    studentNumber: "2535/3",
    contact: "marccabanero@ckcm.edu.ph",
    issueDate: "2024-02-14",
    dueDate: "2024-02-14",
    amount: 14000,
    paid: 0,
    status: "Overdue",
    paymentMethod: "",
    notes: "Multiple follow-ups sent.",
    items: [
      { id: "1", description: "Tuition Fee", quantity: 1, unitPrice: 12000 },
      { id: "2", description: "Miscellaneous Fee", quantity: 1, unitPrice: 2000 },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  Paid: {
    label: "Paid",
    className:
      "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    icon: <CheckIcon className="size-3" />,
  },
  Unpaid: {
    label: "Unpaid",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    icon: <ClockIcon className="size-3" />,
  },
  Overdue: {
    label: "Overdue",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: <AlertCircleIcon className="size-3" />,
  },
  Partial: {
    label: "Partial",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    icon: <WalletIcon className="size-3" />,
  },
}

function StatusPill({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  trend?: { up: boolean; text: string }
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className={`size-8 rounded-lg flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trend.up ? "text-emerald-500" : "text-red-400"
          }`}
        >
          {trend.up ? (
            <TrendingUpIcon className="size-3.5" />
          ) : (
            <TrendingDownIcon className="size-3.5" />
          )}
          {trend.text}
        </div>
      )}
    </div>
  )
}

// ─── Fee Line Items Editor ────────────────────────────────────────────────────

function FeeItemsEditor({
  items,
  onChange,
}: {
  items: FeeItem[]
  onChange: (items: FeeItem[]) => void
}) {
  const addItem = () =>
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ])

  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id))

  const updateItem = (id: string, field: keyof FeeItem, value: string | number) =>
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_56px_96px_28px] gap-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Qty</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Unit Price</p>
        <span />
      </div>

      {/* Line items */}
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_56px_96px_28px] gap-2 items-center">
          <Input
            placeholder="e.g. Tuition Fee"
            value={item.description}
            onChange={(e) => updateItem(item.id, "description", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
            className="h-8 text-sm text-center"
          />
          <Input
            type="number"
            min={0}
            value={item.unitPrice}
            onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
            className="h-8 text-sm text-right"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.id)}
            disabled={items.length === 1}
          >
            <MinusCircleIcon className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-8 gap-1.5 text-xs border-dashed mt-1"
        onClick={addItem}
      >
        <PlusIcon className="size-3.5" />
        Add Line Item
      </Button>

      {/* Subtotal */}
      <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/40 px-3 py-2 mt-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Subtotal
        </span>
        <span className="text-sm font-bold tabular-nums">
          {formatCurrency(subtotal)}
        </span>
      </div>
    </div>
  )
}

// ─── Create Invoice Modal ──────────────────────────────────────────────────────

const DEFAULT_ITEMS: FeeItem[] = [
  { id: "default-1", description: "Tuition Fee", quantity: 1, unitPrice: 15000 },
]

function CreateInvoiceModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (inv: Invoice) => void
}) {
  const [form, setForm] = React.useState({
    studentName: "",
    studentNumber: "",
    contact: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentMethod: "" as PaymentMethod,
    discount: 0,
    partialPaid: 0,
    notes: "",
  })
  const [items, setItems] = React.useState<FeeItem[]>(DEFAULT_ITEMS)

  const set = (field: string, value: string | number) =>
    setForm((p) => ({ ...p, [field]: value }))

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const total = Math.max(0, subtotal - form.discount)

  const statusFromPaid = (): InvoiceStatus => {
    if (form.partialPaid >= total) return "Paid"
    if (form.partialPaid > 0) return "Partial"
    return "Unpaid"
  }

  const handleSubmit = () => {
    const inv: Invoice = {
      id: crypto.randomUUID(),
      invoiceNo: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      studentName: form.studentName || "—",
      studentNumber: form.studentNumber,
      contact: form.contact,
      issueDate: form.issueDate,
      dueDate: form.dueDate || form.issueDate,
      amount: total,
      paid: form.partialPaid,
      status: statusFromPaid(),
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      items,
    }
    onCreated?.(inv)
    onOpenChange(false)
    // Reset
    setForm({
      studentName: "",
      studentNumber: "",
      contact: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      paymentMethod: "",
      discount: 0,
      partialPaid: 0,
      notes: "",
    })
    setItems(DEFAULT_ITEMS)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <FilePlusIcon className="size-4 text-primary" />
            </div>
            Create New Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* ── Student / Account ── */}
          <Section title="Student / Account" icon={<UserIcon className="size-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="studentName" className="text-xs font-medium">
                  Full Name <Required />
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="studentName"
                    placeholder="e.g. Juan Dela Cruz"
                    className="h-9 pl-8 text-sm"
                    value={form.studentName}
                    onChange={(e) => set("studentName", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="studentNumber" className="text-xs font-medium">
                  Student / Employee No.
                </Label>
                <div className="relative">
                  <HashIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="studentNumber"
                    placeholder="e.g. 252522"
                    className="h-9 pl-8 text-sm font-mono"
                    value={form.studentNumber}
                    onChange={(e) => set("studentNumber", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact" className="text-xs font-medium">
                  Contact / Email
                </Label>
                <div className="relative">
                  <MailIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="contact"
                    placeholder="email or phone"
                    className="h-9 pl-8 text-sm"
                    value={form.contact}
                    onChange={(e) => set("contact", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Invoice Info ── */}
          <Section title="Invoice Info" icon={<CreditCardIcon className="size-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="issueDate" className="text-xs font-medium">
                  Issue Date <Required />
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <Input
                    id="issueDate"
                    type="date"
                    className="h-9 pl-8 text-sm"
                    value={form.issueDate}
                    onChange={(e) => set("issueDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate" className="text-xs font-medium">
                  Due Date <Required />
                </Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    id="dueDate"
                    type="date"
                    className="h-9 pl-8 text-sm"
                    value={form.dueDate}
                    onChange={(e) => set("dueDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Fee Items ── */}
          <Section title="Fee Items" icon={<BadgeDollarSignIcon className="size-3.5" />}>
            <FeeItemsEditor items={items} onChange={setItems} />
          </Section>

          {/* ── Payment ── */}
          <Section title="Payment" icon={<WalletIcon className="size-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paymentMethod" className="text-xs font-medium">
                  Payment Method
                </Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) => set("paymentMethod", v)}
                >
                  <SelectTrigger id="paymentMethod" className="h-9 text-sm">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="GCash">GCash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discount" className="text-xs font-medium">
                  Discount (₱)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  placeholder="0.00"
                  className="h-9 text-sm"
                  value={form.discount || ""}
                  onChange={(e) => set("discount", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="partialPaid" className="text-xs font-medium">
                  Amount Paid (₱)
                </Label>
                <Input
                  id="partialPaid"
                  type="number"
                  min={0}
                  max={total}
                  placeholder="0.00"
                  className="h-9 text-sm"
                  value={form.partialPaid || ""}
                  onChange={(e) => set("partialPaid", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Notes
                </Label>
                <Input
                  id="notes"
                  placeholder="Optional remarks..."
                  className="h-9 text-sm"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* ── Summary ── */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1">
              Summary
            </p>
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
            {form.discount > 0 && (
              <SummaryRow
                label="Discount"
                value={`– ${formatCurrency(form.discount)}`}
                dim
              />
            )}
            <Separator className="my-1 opacity-40" />
            <SummaryRow label="Total" value={formatCurrency(total)} bold />
            {form.partialPaid > 0 && (
              <>
                <SummaryRow
                  label="Amount Paid"
                  value={formatCurrency(form.partialPaid)}
                  dim
                />
                <SummaryRow
                  label="Balance Due"
                  value={formatCurrency(Math.max(0, total - form.partialPaid))}
                  accent
                />
              </>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status upon creation:</span>
              <StatusPill status={statusFromPaid()} />
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
            size="sm"
            className="gap-1.5 shadow-lg shadow-primary/20"
            onClick={handleSubmit}
          >
            <FilePlusIcon className="size-3.5" />
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Required() {
  return <span className="text-destructive ml-0.5">*</span>
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground/70">{icon}</span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </p>
      </div>
      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  dim,
  accent,
}: {
  label: string
  value: string
  bold?: boolean
  dim?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-xs ${dim ? "text-muted-foreground" : bold ? "font-semibold" : ""}`}
      >
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${
          bold
            ? "font-bold"
            : dim
            ? "text-muted-foreground"
            : accent
            ? "font-semibold text-red-500"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function SortableHeader({
  column,
  children,
}: {
  column: { toggleSorting: (a: boolean) => void; getIsSorted: () => string | false }
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

const columns: ColumnDef<Invoice>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="pl-1">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="pl-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          className="border-muted-foreground/40"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "invoiceNo",
    header: ({ column }) => (
      <SortableHeader column={column}>Invoice #</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-primary">
        {row.original.invoiceNo}
      </span>
    ),
  },
  {
    accessorKey: "studentName",
    header: ({ column }) => (
      <SortableHeader column={column}>Student / Patient</SortableHeader>
    ),
    cell: ({ row }) => {
      const inv = row.original
      return (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{inv.studentName}</p>
          <p className="text-xs text-muted-foreground truncate">{inv.studentNumber}</p>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Due Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatDate(row.original.dueDate)}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <SortableHeader column={column}>Amount</SortableHeader>
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrency(row.original.amount)}
        </p>
        {row.original.paid > 0 && row.original.paid < row.original.amount && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Paid: {formatCurrency(row.original.paid)}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
    filterFn: (row, _, value) => value === "all" || row.original.status === value,
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100 transition-opacity"
          >
            <EllipsisIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem className="gap-2">
            <EyeIcon className="size-3.5 text-muted-foreground" />
            View Invoice
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <PencilIcon className="size-3.5 text-muted-foreground" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <PrinterIcon className="size-3.5 text-muted-foreground" />
            Print
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="gap-2">
            <TrashIcon className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillingManagement() {
  const [data, setData] = React.useState<Invoice[]>(sampleInvoices)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [createOpen, setCreateOpen] = React.useState(false)

  // Apply status filter
  const filteredData = React.useMemo(
    () =>
      statusFilter === "all"
        ? data
        : data.filter((inv) => inv.status === statusFilter),
    [data, statusFilter]
  )

  const table = useReactTable({
    data: filteredData,
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

  const handleCreated = (inv: Invoice) => setData((prev) => [inv, ...prev])

  // Stats derived from all data
  const totalBilled = data.reduce((s, i) => s + i.amount, 0)
  const totalPaid = data.reduce((s, i) => s + i.paid, 0)
  const outstanding = totalBilled - totalPaid
  const overdue = data.filter((i) => i.status === "Overdue").reduce((s, i) => s + (i.amount - i.paid), 0)

  return (
    <div className="flex flex-col gap-0">
      {/* ── Page Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage invoices, payments, and financial records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <PrinterIcon className="size-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs shadow-md shadow-primary/20"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Billed"
          value={formatCurrency(totalBilled)}
          sub={`${data.length} invoices`}
          icon={<BadgeDollarSignIcon className="size-4 text-primary" />}
          accent="bg-primary/10"
          trend={{ up: true, text: "+12% this month" }}
        />
        <StatCard
          label="Amount Paid"
          value={formatCurrency(totalPaid)}
          sub={`${data.filter((i) => i.status === "Paid").length} fully paid`}
          icon={<CheckIcon className="size-4 text-emerald-500" />}
          accent="bg-emerald-500/10"
          trend={{ up: true, text: "+8% vs last month" }}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          sub={`${data.filter((i) => i.status !== "Paid").length} invoices pending`}
          icon={<ClockIcon className="size-4 text-amber-500" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(overdue)}
          sub={`${data.filter((i) => i.status === "Overdue").length} overdue invoices`}
          icon={<AlertCircleIcon className="size-4 text-red-400" />}
          accent="bg-red-500/10"
          trend={{ up: false, text: "Needs immediate action" }}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search invoices..."
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

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs" size="sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Customization */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Columns3Icon className="size-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="text-sm capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id === "invoiceNo"
                      ? "Invoice #"
                      : col.id === "studentName"
                      ? "Student"
                      : col.id === "dueDate"
                      ? "Due Date"
                      : col.id.charAt(0).toUpperCase() + col.id.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="size-8" aria-label="Refresh">
            <RefreshCwIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="hover:bg-transparent border-b border-border/60"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-muted-foreground py-2.5"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <CreditCardIcon className="size-8 opacity-30" />
                    No invoices found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer ── */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {table.getFilteredRowModel().rows.length}
          </span>{" "}
          invoice{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              {" · "}
              <span className="font-medium text-foreground">
                {table.getFilteredSelectedRowModel().rows.length}
              </span>{" "}
              selected
            </>
          )}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-7 w-14 text-xs" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 50].map((s) => (
                    <SelectItem key={s} value={`${s}`} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(table.getPageCount(), 1)}
          </p>
          <div className="flex items-center gap-1">
            {(
              [
                { fn: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage(), icon: "⟪" },
                { fn: () => table.previousPage(), disabled: !table.getCanPreviousPage(), icon: "‹" },
                { fn: () => table.nextPage(), disabled: !table.getCanNextPage(), icon: "›" },
                { fn: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage(), icon: "⟫" },
              ] as const
            ).map((btn, i) => (
              <Button
                key={i}
                variant="outline"
                size="icon"
                className="size-7 text-xs"
                onClick={btn.fn}
                disabled={btn.disabled}
              >
                {btn.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create Invoice Modal ── */}
      <CreateInvoiceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
