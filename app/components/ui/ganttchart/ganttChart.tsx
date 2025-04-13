import { useEffect, useRef, useState, useMemo } from "react"
import { FixedSizeList as List } from "react-window"
import { EllipsisVertical, ListFilter, MoveUp, MoveDown, MoveVertical } from "lucide-react"
import { cn } from "../../../lib/utils"
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"

// インポートを整理
import { FilterModal } from "../boxgrid/filter-modal"
import { getDaysArray, formatDate, formatMonth, groupByMonth } from "./date-utils"
import { customFilterFn, enhanceColumnsWithFilters, isColumnFiltered } from "./filter-utils"
import { TableRow } from "./TableRow"
import { GanttRow } from "./GanttRow"
import type { Task, GanttChartProps } from "./types"

// カラムヘルパーをエクスポート (外部からの使用を容易にするため)
export const columnHelper = createColumnHelper<any>()

/* add funciton
-すでに全てのテーブル列を表示している場合は、dividerがこれ以上動けないように
-スケジュールデータを親側からインポート
-テーブルのデザインを洗練
-dividerが半透明になっているのも直したい。色々試したがダメだった。さらに小さくする？
*/

export default function GanttChart({
  tasks = [], // デフォルト値を追加して undefined を回避
  startDate = new Date(2025, 0, 21),
  endDate = new Date(2025, 3, 14),
  tableColumns = [],
  enableColumnVisibility = false,
  enableFiltering = true,
  enableSorting = true,
}: Partial<GanttChartProps>) {
  // 状態管理
  const [dividerPosition, setDividerPosition] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [tableScrollLeft, setTableScrollLeft] = useState(0)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  
  // フィルターモーダル用の状態
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
  const [filterPosition, setFilterPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  
  // 参照
  const containerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<List>(null)
  const ganttRef = useRef<List>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // 定数
  const days = getDaysArray(startDate, endDate)
  const ROW_HEIGHT = 36
  const DAY_WIDTH = 30
  const GANTT_HEADER_HEIGHT = 62
  
  // 列にフィルター関数とソート設定を追加
  const columnsWithFilters = useMemo(() => {
    return enhanceColumnsWithFilters(tableColumns, enableSorting)
  }, [tableColumns, enableSorting])
  
  // TanStack Tableの設定
  const table = useReactTable({
    data: tasks,
    columns: columnsWithFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnVisibility,
      columnFilters,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    filterFns: {
      custom: customFilterFn,
    },
    globalFilterFn: customFilterFn,
  })
  
  // 表示する列から幅を取得
  const COLUMN_WIDTHS = useMemo(() => {
    const widths: Record<string, number> = {}
    
    table.getVisibleLeafColumns().forEach(column => {
      const width = column.columnDef.meta?.width || 150
      widths[column.id] = width
    })
    
    return widths
  }, [table.getVisibleLeafColumns()])
  
  // テーブルの全体幅を計算
  const TABLE_TOTAL_WIDTH = useMemo(() => {
    return Object.values(COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0)
  }, [COLUMN_WIDTHS])

  // 月ごとに日付をグループ化
  const months = useMemo(() => {
    return groupByMonth(days)
  }, [days])

  // Handle divider dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const newPosition = e.clientX - containerRect.left

        // 合理的な範囲内に制限
        const minPosition = 200
        const maxPosition = containerRect.width - 200

        if (newPosition >= minPosition && newPosition <= maxPosition) {
          setDividerPosition(newPosition)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // フィルターアイコンクリックハンドラー
  const handleFilterClick = (columnId: string, e: React.MouseEvent) => {
    e.stopPropagation() // ソートイベントの伝播を防止
    
    const rect = e.currentTarget.getBoundingClientRect()
    setFilterPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    })
    
    setActiveFilterColumn(columnId)
    setFilterModalOpen(true)
  }

  // スクロール同期
  const handleTableScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    setScrollTop(scrollOffset)
    if (ganttRef.current) {
      ganttRef.current.scrollTo(scrollOffset)
    }
  }

  const handleGanttScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    setScrollTop(scrollOffset)
    if (tableRef.current) {
      tableRef.current.scrollTo(scrollOffset)
    }
  }

  // テーブル水平スクロールハンドラー
  const handleTableHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setTableScrollLeft(newScrollLeft)
    
    // ヘッダーのスクロール位置も同期させる
    const headerElement = e.currentTarget.previousElementSibling;
    if (headerElement && headerElement instanceof HTMLElement) {
      headerElement.scrollLeft = newScrollLeft;
    }
  }

  // フィルタリング後の行数
  const filteredRowCount = table.getRowModel().rows.length

  return (
    <div className="flex flex-col h-[600px] border border-gray-300 bg-white overflow-hidden" ref={containerRef}>
      {/* Headers と Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側: テーブル */}
        <div 
          className="overflow-hidden border-r border-gray-300" 
          style={{ width: dividerPosition }}
        >
          {/* テーブルのヘッダー */}
          <div 
            className="border-b border-gray-300 sticky top-0 z-10 overflow-hidden"
            style={{ height: GANTT_HEADER_HEIGHT, width: '100%' }}
          >
            <div 
              className="flex h-full" 
              style={{ 
                width: TABLE_TOTAL_WIDTH, 
                transform: `translateX(-${tableScrollLeft}px)` 
              }}
            >
              {table.getVisibleLeafColumns().map(column => {
                const canSort = enableSorting && column.getCanSort()
                const canFilter = enableFiltering && column.getCanFilter()
                
                // ソートハンドラを事前に取得
                const sortHandler = canSort 
                  ? column.getToggleSortingHandler() 
                  : undefined
                
                return (
                  <div 
                    key={column.id}
                    className={cn(
                      "flex-none p-2 font-light border-r border-gray-300 text-gray-500 text-sm flex items-center justify-start",
                      canSort && "cursor-pointer group"
                    )}
                    style={{ width: COLUMN_WIDTHS[column.id] || 150 }}
                    onClick={sortHandler}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {/* シンプルな方法でヘッダーをレンダリング */}
                        {typeof column.columnDef.header === 'string' 
                          ? column.columnDef.header 
                          : column.id }
                        
                        {/* ソート状態に応じたアイコン表示 */}
                        {canSort && (
                          <div className="ml-1">
                            {{
                              asc: <MoveUp className="h-3 w-3" />,
                              desc: <MoveDown className="h-3 w-3" />,
                            }[column.getIsSorted() as string] ?? (
                              <MoveVertical className="h-0 w-0 opacity-30 group-hover:opacity-100" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* フィルターアイコン部分 */}
                      <div className="flex items-center">
                        {canFilter && (
                          <button
                            className={cn(
                              "ml-2 text-muted-foreground hover:text-foreground p-1 rounded-sm",
                              isColumnFiltered(column) && "text-pink-600 hover:text-pink-800"
                            )}
                            onClick={(e) => handleFilterClick(column.id, e)}
                          >
                            <ListFilter className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* スクロール可能なテーブルコンテナ */}
          <div 
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-hidden"
            style={{ height: 600 - GANTT_HEADER_HEIGHT }}
            onScroll={handleTableHorizontalScroll}
          >
            <div style={{ width: TABLE_TOTAL_WIDTH }}>
              {filteredRowCount === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  表示できるデータがありません
                </div>
              ) : (
                <List
                  ref={tableRef}
                  height={600 - GANTT_HEADER_HEIGHT}
                  itemCount={filteredRowCount}
                  itemSize={ROW_HEIGHT}
                  width={TABLE_TOTAL_WIDTH}
                  onScroll={handleTableScroll}
                  itemData={tasks}
                  style={{ overflow: 'hidden' }}
                >
                  {({ index, style }) => (
                    <TableRow 
                      index={index} 
                      style={style} 
                      table={table} 
                      columnWidths={COLUMN_WIDTHS} 
                    />
                  )}
                </List>
              )}
            </div>
          </div>
        </div>

        {/* 中央: divider */}
        <div 
          className="w-1 bg-gray-300 cursor-col-resize hover:bg-red-600 z-10 flex-shrink-0 relative flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute bg-white rounded-full p-0.5 shadow-sm border border-gray-200">
            <EllipsisVertical className="h-3.5 w-3.5 text-gray-500"/>
          </div>
        </div>

        {/* 右側: ガントチャート */}
        <div className="flex-1 overflow-auto">
          <div style={{ width: days.length * DAY_WIDTH }}>
            {/* ガントチャートのヘッダー */}
            <div 
              className="border-b border-gray-300 sticky top-0 z-10" 
              style={{ height: GANTT_HEADER_HEIGHT }}
            >
              {/* 月ヘッダー */}
              <div className="flex border-b border-gray-300" style={{ height: GANTT_HEADER_HEIGHT / 2 }}>
                {Object.entries(months).map(([monthKey, monthDays]) => (
                  <div
                    key={monthKey}
                    className="border-r border-gray-300 text-center text-xs p-1 font-xs text-gray-500 flex items-center justify-center flex-shrink-0"
                    style={{ width: monthDays.length * DAY_WIDTH, height: '100%' }}
                  >
                    {formatMonth(monthDays[0])}
                  </div>
                ))}
              </div>

              {/* 日ヘッダー */}
              <div className="flex" style={{ height: GANTT_HEADER_HEIGHT / 2 }}>
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-none border-r border-gray-300 text-xs text-gray-600 text-center p-1 flex items-center justify-center",
                      day.getDay() === 0 || day.getDay() === 6 ? "bg-gray-100 border-b border-gray-300" : "",
                    )}
                    style={{ width: DAY_WIDTH, height: '100%' }}
                  >
                    {formatDate(day)}
                  </div>
                ))}
              </div>
            </div>

            {/* ガントチャートのコンテンツ */}
            {filteredRowCount === 0 ? (
              <div className="p-4 text-center text-gray-500">
                表示できるデータがありません
              </div>
            ) : (
              <List
                ref={ganttRef}
                height={600 - GANTT_HEADER_HEIGHT}
                itemCount={filteredRowCount}
                itemSize={ROW_HEIGHT}
                width={days.length * DAY_WIDTH}
                onScroll={handleGanttScroll}
                itemData={table.getRowModel().rows}
                layout="vertical"
                style={{ overflowX: 'hidden' }}
              >
                {({ index, style }) => (
                  <GanttRow 
                    index={index} 
                    style={style} 
                    table={table} 
                    days={days} 
                    dayWidth={DAY_WIDTH} 
                  />
                )}
              </List>
            )}
          </div>
        </div>
      </div>

      {/* フィルターモーダル */}
      {filterModalOpen && activeFilterColumn && (
        <FilterModal
          column={table.getColumn(activeFilterColumn)!}
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          data={tasks}
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
            applyButton: "適用",
            clearButton: "クリア",
          }}
        />
      )}
    </div>
  )
} 