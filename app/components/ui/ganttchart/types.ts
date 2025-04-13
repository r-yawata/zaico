import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table"

// タスクモデルの型定義
export interface Task {
  id: string
  barcode: string
  modelNumber: string
  deviceName: string
  startDate?: Date
  endDate?: Date
  status?: string
  [key: string]: any // 任意のプロパティを許可
}

// ガントチャートのプロパティ型定義
export interface GanttChartProps {
  tasks: Task[]
  startDate: Date
  endDate: Date
  // テーブル列の定義をサポート
  tableColumns?: ColumnDef<Task, any>[]
  // 列表示設定を有効にするオプション
  enableColumnVisibility?: boolean
  // フィルタリングを有効にするオプション
  enableFiltering?: boolean
  // ソートを有効にするオプション
  enableSorting?: boolean
}

// フィルター値の型定義
export interface FilterValue {
  operator: string
  value: string | string[] // 配列型も許可
}

// TanStack Table の型拡張（他のファイルでも使用するため）
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    isHTML?: boolean
    exportOnly?: boolean
    filterType?: 'text' | 'date' | 'select'
    width?: number // 列の幅を指定
  }
} 