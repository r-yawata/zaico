import React, { useState, useEffect, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
  type FilterFn,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { MoveDown, MoveUp, ListFilter, MoveVertical } from "lucide-react"
import { FilterModal } from "./filter-modal"
import { Checkbox } from "../checkbox"
import { cn } from "../../../lib/utils"
import { Button } from "../button"
import { Input } from "../input"
import { Label } from "../label"

// カスタムCSS変数をJSX要素に設定するヘルパー関数
const setCSSVariables = (columns: { id: string; size: number }[]) => {
  const gridTemplateColumns = columns
    .map((col) => `${col.size === 150 ? "1fr" : `${col.size}px`}`)
    .join(" ");
  
  return {
    "--grid-template-columns": gridTemplateColumns,
  } as React.CSSProperties;
};

// カスタムフィルター関数の型定義
interface CustomFilterValue {
  operator: string;
  value: string | string[];
}

// カスタムフィルター関数の実装
const customFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
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
    const { operator, value } = filterValue as CustomFilterValue
    
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

// サニタイズ関数（DOMPurifyを使用する場合）
// 注: 本番環境では実際にDOMPurifyのようなライブラリを使用することを推奨
const sanitizeHTML = (html: string): string => {
  // 基本的な悪意のあるスクリプトタグの除去（簡易版）
  // 本番環境では DOMPurify などのライブラリを使用することを強く推奨
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '');
};

// カスタムHTMLレンダリングを安全に行うためのコンポーネント
export function SafeHTML({ html, className }: { html: string, className?: string }) {
  // HTML文字列が実際にHTMLタグを含んでいるか確認
  const hasHTMLTags = /<[a-z][\s\S]*>/i.test(html);
  
  // HTMLタグを含んでいない場合は通常のテキストとして表示
  if (!hasHTMLTags) {
    return <span className={className}>{html}</span>;
  }
  
  // HTMLタグを含む場合はサニタイズしてからレンダリング
  const sanitizedHTML = sanitizeHTML(html);
  
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
}

// tanstack/react-tableの型定義拡張（hidden属性を追加）
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    isHTML?: boolean;
    exportOnly?: boolean;
    csvValue?: (value: any, row: TData) => string;
    hidden?: boolean;  // hiddenプロパティを追加
    filterType?: 'text' | 'date' | 'select'; // 列のフィルタータイプ
  }
}

export type VirtualizedGridTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  enableSelection?: boolean
  enableFiltering?: boolean
  enableSorting?: boolean
  className?: string
  onRowSelectionChange?: (rows: Row<TData>[]) => void
  rowHeight?: number
  height?: string | number
  enableColumnVisibility?: boolean
  defaultVisibility?: VisibilityState
}

export function VirtualizedGridTable<TData>({
  data,
  columns,
  enableSelection = false,
  enableFiltering = true,
  enableSorting = true,
  className,
  onRowSelectionChange,
  rowHeight = 37,
  height = "calc(100vh - 200px)",
  enableColumnVisibility = false,
  defaultVisibility = {},
}: VirtualizedGridTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  
  // exportOnly=trueの列のIDを収集
  const columnsToHide = useMemo(() => {
    const hideColumns: string[] = [];
    
    columns.forEach(col => {
      const columnId = (col as any).accessorKey || col.id;
      
      if (columnId && col.meta?.exportOnly) {
        hideColumns.push(columnId);
      }
    });
    
    return hideColumns;
  }, [columns]);
  
  // 初期表示状態の設定 - exportOnly列は初期非表示に
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const initialState = { ...defaultVisibility };
    columnsToHide.forEach(id => {
      initialState[id] = false;
    });
    return initialState;
  });
  
  const [rowSelection, setRowSelection] = useState({})
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
  const [filterPosition, setFilterPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false)

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // 選択列を追加
  const allColumns = useMemo(() => {
    if (!enableSelection) return columns;
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableFiltering: false,
        size: 40,
      },
      ...columns,
    ] as ColumnDef<TData, any>[];
  }, [columns, enableSelection]);
  
  // カスタムフィルタリングとHTML表示の設定
  const columnsWithCustomFilter = useMemo(() => {
    return allColumns.map(col => {
      // 列のメタ情報に基づいてカスタムレンダリングを設定
      const originalCell = col.cell;
      
      // カスタムcell関数
      const customCell = (props: any) => {
        // 元のセル内容をレンダリング
        const content = originalCell ? 
          (typeof originalCell === 'function' ? originalCell(props) : originalCell) 
          : props.getValue();
        
        // メタデータにisHTMLが指定されている場合はHTMLとしてレンダリング
        if (col.meta?.isHTML && content) {
          return <SafeHTML html={String(content)} />;
        }
        
        // 通常のレンダリング
        return content;
      };
      
      return {
        ...col,
        filterFn: customFilterFn,
        cell: customCell,
      }
    });
  }, [allColumns]);

  const table = useReactTable({
    data,
    columns: columnsWithCustomFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    filterFns: {
      custom: customFilterFn,
    },
    enableRowSelection: enableSelection,
    enableMultiRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // デバッグ用
    globalFilterFn: customFilterFn,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  })

  // エラー修正: getFilterValue()の結果をboolean変換する
  const isColumnFiltered = (column: any) => Boolean(column.getFilterValue());

  // Handle filter icon click
  const handleFilterClick = (columnId: string, e: React.MouseEvent) => {
    // クリックした要素の位置を取得
    const rect = e.currentTarget.getBoundingClientRect()
    setFilterPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    })
    
    setActiveFilterColumn(columnId)
    setFilterModalOpen(true)
  }

  // Set up virtualization
  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  // 表示列のみでCSSグリッドを生成
  const cssVars = useMemo(() => {
    // 表示列のみを取得 - 公式APIを使用
    const visibleColumnSizes = table.getVisibleLeafColumns().map(column => ({
      id: column.id,
      size: column.getSize(),
    }));
    
    return setCSSVariables(visibleColumnSizes);
  }, [table.getVisibleLeafColumns()]);

  // 表示列のフィルタリング（レンダリング時に直接除外する方法）
  const visibleHeaderGroups = useMemo(() => {
    return table.getHeaderGroups().map(headerGroup => ({
      ...headerGroup,
      headers: headerGroup.headers.filter(header => {
        // exportOnly列を除外
        return !header.column.columnDef.meta?.exportOnly;
      })
    }));
  }, [table]);

  return (
    <div className={cn("w-full virtualized-grid-container", className)} style={cssVars}>
      {enableColumnVisibility && (
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setColumnSelectorOpen(!columnSelectorOpen)}
            className="text-xs"
          >
            列表示設定
          </Button>
          
          {columnSelectorOpen && (
            <div className="absolute z-50 mt-8 p-4 bg-white border rounded-md shadow-md">
              <h3 className="mb-2 font-medium text-sm">表示する列を選択</h3>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {table.getAllColumns()
                  .filter(column => column.id !== 'select' && column.getCanHide())
                  .map(column => {
                    return (
                      <div key={column.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={() => setColumnVisibility(prev => ({
                            ...prev,
                            [column.id]: !prev[column.id]
                          }))}
                          id={`column-${column.id}`}
                        />
                        <Label htmlFor={`column-${column.id}`} className="text-xs">
                          {column.columnDef.header?.toString() || column.id}
                        </Label>
                      </div>
                    )
                  })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => setColumnSelectorOpen(false)}
                  className="text-xs"
                >
                  閉じる
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-gray-200 border">
        <div className="w-full overflow-auto virtualized-grid-scroll-container" 
             ref={tableContainerRef} 
             style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          
          {/* ヘッダー部分 - 常に表示 */}
          <div className="virtualized-grid-header" style={{ display: 'grid', gridTemplateColumns: 'var(--grid-template-columns)', position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #e5e7eb' }}>
            {/* 公式方法: getHeaderGroups()はすでに表示列のみを考慮している */}
            {table.getHeaderGroups()[0].headers.map((header) => {
              const canSort = enableSorting && header.column.getCanSort()
              const canFilter = enableFiltering && header.column.getCanFilter()
              
              return (
                <div key={header.id} className="h-11 px-4 text-left flex items-center font-medium text-gray-500 text-xs">
                  <div className="flex items-center justify-between w-full">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn("flex items-center justify-between w-full", canSort && "cursor-pointer select-none")}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {canSort && (
                          <div className="flex items-center">
                            {{
                              asc: <MoveUp className="h-3 w-3" />,
                              desc: <MoveDown className="h-3 w-3" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <MoveVertical className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            )
                            }
                          </div>
                        )}
                      </div>
                    )}
                    {canFilter && header.id !== "select" && (
                      <button
                        className={cn(
                          "ml-2 text-muted-foreground hover:text-foreground",
                          isColumnFiltered(header.column) && "text-pink-600 hover:text-pink-800"
                        )}
                        onClick={(e) => handleFilterClick(header.id, e)}
                      >
                        <ListFilter className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* ボディ部分 - データがない場合はメッセージを表示 */}
          {rows.length === 0 ? (
            <div className="p-3 text-sm text-gray-500" style={{ minHeight: '200px' }}>
              表示可能なデータがありません
            </div>
          ) : (
            <div className="virtualized-grid-body" style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    className={cn("virtualized-grid-row", row.getIsSelected() && "bg-muted", "cursor-pointer")}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: 'var(--grid-template-columns)',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                    data-index={virtualRow.index}
                    onClick={() => {
                      // 行がクリックされたときに選択状態を変更し、onRowSelectionChangeコールバックを呼び出す
                      if (onRowSelectionChange) {
                        onRowSelectionChange([row]);
                      }
                    }}
                  >
                    {/* 公式方法: getVisibleCells()は表示列のみを返す */}
                    {row.getVisibleCells().map((cell) => (
                      <div 
                        key={cell.id} 
                        className="p-4 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-xs"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {filterModalOpen && activeFilterColumn && (
        <FilterModal
          column={table.getColumn(activeFilterColumn)!}
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          data={data}
          position={filterPosition}
          translations={{
            operators: {
              contains: "を含む",
              equals: "と等しい",
              startsWith: "で始まる",
              endsWith: "で終わる",
              greaterThan: "より大きい",
              lessThan: "より小さい",
              in: "のいずれか",
            },
            placeholder: "値を入力してください",
            applyButton: "FILTER",
            clearButton: "CLEAR",
          }}
        />
      )}

      {/* <style dangerouslySetInnerHTML={{__html: `
        .virtualized-grid-row:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `}} /> */}
    </div>
  )
}

