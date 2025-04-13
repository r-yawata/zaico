import React from "react"
import { flexRender } from "@tanstack/react-table"
import { cn } from "../../../lib/utils"
import type { Table } from "@tanstack/react-table"
import type { Task } from "./types"

interface TableRowProps {
  index: number
  style: React.CSSProperties
  table: Table<Task>
  columnWidths: Record<string, number>
}

/**
 * テーブル行コンポーネント
 * react-windowで仮想化されたリストで使用される
 */
export const TableRow = ({ index, style, table, columnWidths }: TableRowProps) => {
  // フィルタリング後の行を取得
  const rows = table.getRowModel().rows
  
  // インデックスが範囲外の場合は何も表示しない
  if (index >= rows.length) return null
  
  const row = rows[index]
  const task = row.original

  return (
    <div 
      className={cn("flex border-b border-gray-200 h-full", index % 2 === 0 ? "bg-white" : "bg-gray-50")} 
      style={style}
    >
      {row.getVisibleCells().map((cell) => {
        const column = cell.column
        const width = columnWidths[column.id] || 150
        
        return (
          <div 
            key={cell.id} 
            className="flex-none p-2 truncate border-r border-gray-200 flex items-center text-sm font-light text-gray-600" 
            style={{ width }}
          >
            {/* 適切なコンテキストでcellをレンダリング */}
            {flexRender(
              cell.column.columnDef.cell, 
              {
                ...cell.getContext(),
                value: task[column.id], // 値を明示的に提供
                getValue: () => task[column.id], // getValue関数も明示的に提供
              }
            )}
          </div>
        )
      })}
    </div>
  )
} 