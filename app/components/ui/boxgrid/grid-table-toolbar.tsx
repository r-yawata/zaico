import type React from "react"

import { useState } from "react"
import type { Table } from "@tanstack/react-table"
import { Button } from "../button"
import { Input } from "../input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { Download, Copy, Search, X, Columns2 } from "lucide-react"

interface GridTableToolbarProps<TData> {
  table: Table<TData>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  onExportCSV?: () => void
  onCopyToClipboard?: () => void
}

export function GridTableToolbar<TData>({
  table,
  globalFilter,
  setGlobalFilter,
  onExportCSV,
  onCopyToClipboard,
}: GridTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = useState(globalFilter)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalFilter(searchValue)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-8"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("")
                setGlobalFilter("")
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary" size="sm" className="flex-shrink-0">
          検索
        </Button>
      </form>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {onExportCSV && (
          <Button variant="outline" size="sm" onClick={onExportCSV} className="flex-shrink-0">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
        )}

        {onCopyToClipboard && (
          <Button variant="outline" size="sm" onClick={onCopyToClipboard} className="flex-shrink-0">
            <Copy className="mr-2 h-4 w-4" />
            コピー
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <Columns2 className="mr-2 h-4 w-4" />
              カラム
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value: boolean) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

