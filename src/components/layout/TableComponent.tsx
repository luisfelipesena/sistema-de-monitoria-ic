import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"

// Custom filter function for multiselect (array of values)
// Handles both string and number comparisons by converting to strings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const multiselectFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
    return true
  }
  const cellValue = row.getValue(columnId)
  // Convert both to strings for comparison (handles number vs string mismatch)
  const cellValueStr = String(cellValue)
  return filterValue.some((v) => String(v) === cellValueStr)
}

export interface ServerPaginationConfig {
  /** Total number of items across all pages */
  totalCount: number
  /** Current page index (0-based) */
  pageIndex: number
  /** Number of items per page */
  pageSize: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void
  /** Available page size options */
  pageSizeOptions?: number[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchableColumn?: string
  searchPlaceholder?: string
  showPagination?: boolean
  isLoading?: boolean
  emptyMessage?: string
  /** External column filters state (controlled mode) */
  columnFilters?: ColumnFiltersState
  /** Callback when column filters change (controlled mode) */
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  /** Server-side pagination config. When provided, uses server pagination instead of client-side. */
  serverPagination?: ServerPaginationConfig
  /** Default sorting state */
  defaultSorting?: SortingState
}

export function TableComponent<TData, TValue>({
  columns,
  data,
  searchableColumn,
  searchPlaceholder = "Buscar...",
  showPagination = true,
  isLoading = false,
  emptyMessage = "Nenhum resultado encontrado.",
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
  serverPagination,
  defaultSorting,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting ?? [])
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])

  // Use external filters if provided, otherwise use internal state
  const columnFilters = externalColumnFilters ?? internalColumnFilters
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters

  const isServerPagination = !!serverPagination

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side pagination/filtering if not server-side
    ...(isServerPagination
      ? {
          manualPagination: true,
          manualFiltering: true,
          manualSorting: true,
          pageCount: Math.ceil(serverPagination.totalCount / serverPagination.pageSize),
          state: {
            sorting,
            columnFilters,
            pagination: {
              pageIndex: serverPagination.pageIndex,
              pageSize: serverPagination.pageSize,
            },
          },
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          state: {
            sorting,
            columnFilters,
          },
        }),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      multiselect: multiselectFilterFn,
    },
  })

  // Server pagination helpers
  const totalPages = serverPagination
    ? Math.ceil(serverPagination.totalCount / serverPagination.pageSize)
    : table.getPageCount()
  const currentPage = serverPagination ? serverPagination.pageIndex : table.getState().pagination.pageIndex
  const canPreviousPage = serverPagination ? serverPagination.pageIndex > 0 : table.getCanPreviousPage()
  const canNextPage = serverPagination
    ? serverPagination.pageIndex < totalPages - 1
    : table.getCanNextPage()

  const handlePreviousPage = () => {
    if (serverPagination) {
      serverPagination.onPageChange(serverPagination.pageIndex - 1)
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (serverPagination) {
      serverPagination.onPageChange(serverPagination.pageIndex + 1)
    } else {
      table.nextPage()
    }
  }

  const handleFirstPage = () => {
    if (serverPagination) {
      serverPagination.onPageChange(0)
    } else {
      table.setPageIndex(0)
    }
  }

  const handleLastPage = () => {
    if (serverPagination) {
      serverPagination.onPageChange(totalPages - 1)
    } else {
      table.setPageIndex(totalPages - 1)
    }
  }

  const totalItems = serverPagination ? serverPagination.totalCount : table.getFilteredRowModel().rows.length
  const pageSizeOptions = serverPagination?.pageSizeOptions ?? [10, 20, 50, 100]

  return (
    <div className="w-full space-y-4">
      {searchableColumn && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-2 sm:py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchableColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn(searchableColumn)?.setFilterValue(event.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-hidden bg-card">
        <div className="overflow-x-auto scrollbar-visible">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => {
                const lastCol = headerGroup.headers[headerGroup.headers.length - 1]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lastColDef = lastCol?.column.columnDef as any
                const hasActionsColumn = lastColDef?.accessorKey === "acoes" || lastColDef?.id === "actions"
                return (
                  <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                    {headerGroup.headers.map((header, idx) => {
                      const isSticky = hasActionsColumn && idx === headerGroup.headers.length - 1
                      return (
                        <TableHead
                          key={header.id}
                          style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                          className={`h-12 px-2 sm:px-4 text-left align-middle font-medium text-slate-500 text-xs sm:text-sm whitespace-nowrap ${
                            isSticky ? "sticky right-0 z-10 bg-muted/95 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]" : ""
                          }`}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const cells = row.getVisibleCells()
                  const lastCell = cells[cells.length - 1]
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const lastCellDef = lastCell?.column.columnDef as any
                  const hasActions = lastCellDef?.accessorKey === "acoes" || lastCellDef?.id === "actions"
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/10 border-b"
                    >
                      {cells.map((cell, idx) => {
                        const isSticky = hasActions && idx === cells.length - 1
                        return (
                          <TableCell
                            key={cell.id}
                            className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${
                              isSticky ? "sticky right-0 z-10 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]" : ""
                            }`}
                          >
                            <div className="max-w-[150px] truncate sm:max-w-none sm:overflow-visible sm:whitespace-normal sm:text-ellipsis">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-sm">{emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 sm:py-4">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <div className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </div>
            {serverPagination?.onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar</span>
                <Select
                  value={String(serverPagination.pageSize)}
                  onValueChange={(value) => serverPagination.onPageSizeChange?.(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            {serverPagination && totalPages > 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFirstPage}
                disabled={!canPreviousPage}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!canPreviousPage}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center space-x-1 px-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {currentPage + 1} de {totalPages || 1}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!canNextPage}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {serverPagination && totalPages > 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastPage}
                disabled={!canNextPage}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
