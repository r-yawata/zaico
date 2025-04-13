import { Row } from "@tanstack/react-table"
import type { FilterValue } from "./types"

/**
 * カスタムフィルター関数
 * TanStack Tableで使用するフィルタリングロジック
 */
export const customFilterFn = (row: Row<any>, columnId: string, filterValue: any): boolean => {
  // フィルター値がない場合はすべての行を表示
  if (!filterValue) return true

  // セルの値を取得
  const cellValue = row.getValue(columnId)
  if (cellValue === undefined || cellValue === null) return false

  // セルの値を文字列に変換
  const cellValueStr = String(cellValue).toLowerCase()
  
  // フィルター値が文字列の場合（containsの場合）
  if (typeof filterValue === 'string') {
    return cellValueStr.includes(filterValue.toLowerCase())
  }

  // フィルター値がオブジェクトの場合
  if (typeof filterValue === 'object' && 'operator' in filterValue) {
    const { operator, value } = filterValue as FilterValue
    
    // 空フィルター（何も表示しない）
    if (operator === 'empty') {
      return false
    }
    
    // value が配列の場合（選択肢タイプの場合）
    if (Array.isArray(value)) {
      if (operator === 'in') {
        return value.some(val => String(val).toLowerCase() === cellValueStr)
      }
      return false
    }
    
    // value が文字列の場合（通常のフィルター）
    const filterValueStr = String(value).toLowerCase()

    switch (operator) {
      case 'contains':
        return cellValueStr.includes(filterValueStr)
      case 'equals':
        return cellValueStr === filterValueStr
      case 'startsWith':
        return cellValueStr.startsWith(filterValueStr)
      case 'endsWith':
        return cellValueStr.endsWith(filterValueStr)
      case 'greaterThan':
        return Number(cellValue) > Number(value)
      case 'lessThan':
        return Number(cellValue) < Number(value)
      default:
        return true
    }
  }

  return true
}

/**
 * 列にフィルターとソート設定を追加
 */
export const enhanceColumnsWithFilters = (columns: any[], enableSorting: boolean) => {
  return columns.map(column => ({
    ...column,
    filterFn: customFilterFn,
    enableSorting: column.enableSorting !== false && enableSorting,
  }))
}

/**
 * 列がフィルターされているかチェック
 */
export const isColumnFiltered = (column: any) => Boolean(column.getFilterValue()) 