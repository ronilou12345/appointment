"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { DataTableToolbar } from "@/components/data-table-toolbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

const NON_SORTABLE_COLUMN_IDS = new Set(["drag", "select", "actions", "addToCart", "image"])

export function DataTableSortIcon({ active = false }: { active?: boolean }) {
  return (
    <ArrowUpDown
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 text-foreground",
        active ? "opacity-80" : "opacity-45",
      )}
    />
  )
}

function getColumnId<TData, TValue>(column: ColumnDef<TData, TValue>) {
  if (column.id) return column.id
  if ("accessorKey" in column && column.accessorKey != null) return String(column.accessorKey)
  return ""
}

function shouldEnableSorting<TData, TValue>(column: ColumnDef<TData, TValue>) {
  if (column.enableSorting === false) return false
  if (NON_SORTABLE_COLUMN_IDS.has(getColumnId(column))) return false
  if (column.header === "" || column.header == null) return false
  return true
}

function getRowControlColumns<TData, TValue>(): ColumnDef<TData, TValue>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: () => (
        <button
          type="button"
          className="flex cursor-grab items-center justify-center text-muted-foreground/70 active:cursor-grabbing"
          aria-label="Reorder row"
          tabIndex={-1}
        >
          <GripVertical className="size-4" />
        </button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="size-[18px] rounded-[5px] border-muted-foreground/35"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="size-[18px] rounded-[5px] border-muted-foreground/35"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

interface DataTableProps<TData, TValue> {
  columns?: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowId?: (originalRow: TData, index: number) => string
  onSelectedRowsChange?: (rows: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  onSelectedRowsChange,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const baseColumns = (() => {
      if (columns && columns.length > 0) {
        return columns.filter((column) => column.id !== "drag" && column.id !== "select")
      }

      const firstRow = data[0] as Record<string, unknown> | undefined

      if (!firstRow) {
        return []
      }

      return Object.keys(firstRow).map((key) => ({
        accessorKey: key as keyof TData,
        header: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase()),
        cell: ({ row }: any) => String(row.getValue(key) ?? ""),
      })) as ColumnDef<TData, TValue>[]
    })()

    return [
      ...getRowControlColumns<TData, TValue>(),
      ...baseColumns.map((column) => ({
        ...column,
        enableSorting: shouldEnableSorting(column),
      })),
    ]
  }, [columns, data])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    getRowId,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  React.useEffect(() => {
    onSelectedRowsChange?.(table.getFilteredSelectedRowModel().rows.map((row) => row.original))
  }, [onSelectedRowsChange, rowSelection])

  const filterableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter() && !["drag", "select", "actions"].includes(column.id))

  return (
    <div>
      <DataTableToolbar
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        activeFilterCount={columnFilters.length}
        filterContent={
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filters</p>
              {columnFilters.length > 0 ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => table.resetColumnFilters()}>
                  Clear
                </Button>
              ) : null}
            </div>
            {filterableColumns.map((column) => (
              <div key={column.id} className="grid gap-1.5">
                <label className="text-xs font-medium capitalize text-muted-foreground">{column.id}</label>
                <Input
                  value={String(column.getFilterValue() ?? "")}
                  onChange={(event) => column.setFilterValue(event.target.value)}
                  placeholder={`Filter ${column.id}...`}
                  className="h-8"
                />
              </div>
            ))}
          </div>
        }
        columnsContent={table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      />

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted hover:bg-muted">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "drag" || header.column.id === "select"
                        ? "w-8 px-1.5 text-foreground"
                        : "text-foreground"
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 text-foreground select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <DataTableSortIcon active={Boolean(header.column.getIsSorted())} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="border-b border-border last:border-b-0 hover:bg-muted/50 data-[state=selected]:bg-muted/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "drag" || cell.column.id === "select"
                          ? "w-8 px-1.5 text-foreground"
                          : "text-foreground"
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    table.previousPage()
                  }}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.max(1, table.getPageCount()) }, (_, index) => {
                const pageIndex = index
                const isCurrentPage = table.getState().pagination.pageIndex === pageIndex

                if (table.getPageCount() > 5 && (index === 0 || index === table.getPageCount() - 1 || (index >= table.getState().pagination.pageIndex - 1 && index <= table.getState().pagination.pageIndex + 1))) {
                  return (
                    <PaginationItem key={pageIndex}>
                      <PaginationLink
                        href="#"
                        isActive={isCurrentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          table.setPageIndex(pageIndex)
                        }}
                      >
                        {pageIndex + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }

                if (table.getPageCount() > 5 && index === 1 && table.getState().pagination.pageIndex > 2) {
                  return <PaginationEllipsis key="ellipsis-start" />
                }

                if (table.getPageCount() > 5 && index === table.getPageCount() - 2 && table.getState().pagination.pageIndex < table.getPageCount() - 3) {
                  return <PaginationEllipsis key="ellipsis-end" />
                }

                if (table.getPageCount() <= 5) {
                  return (
                    <PaginationItem key={pageIndex}>
                      <PaginationLink
                        href="#"
                        isActive={isCurrentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          table.setPageIndex(pageIndex)
                        }}
                      >
                        {pageIndex + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }

                return null
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    table.nextPage()
                  }}
                  aria-disabled={!table.getCanNextPage()}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
