// import type React from "react"
// import { useEffect, useRef, useState, useMemo } from "react"
// import { FixedSizeList as List } from "react-window"
// import { ChevronDown, EllipsisVertical, ListFilter, MoveUp, MoveDown, MoveVertical } from "lucide-react"
// import { cn } from "../../../lib/utils"
// import {
//   createColumnHelper,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getSortedRowModel,
//   useReactTable,
//   type ColumnDef,
//   type ColumnFiltersState,
//   type SortingState,
// } from "@tanstack/react-table"
// import { FilterModal } from "../boxgrid/filter-modal"

// /* SPECIFICATION
// The left side displays a table, and the right side displays a Gantt chart, and they should scroll together in sync.

// The divider between the table and the Gantt chart can be moved horizontally, allowing either the table or the Gantt chart to be displayed larger. However, moving the divider should not change the column widths—it should only change the visible area of the table or Gantt chart.

// Supports both vertical and horizontal scrolling.
// */

// /* add funciton
// -すでに全てのテーブル列を表示している場合は、dividerがこれ以上動けないように
// -スケジュールデータを親側からインポート
// -テーブルのデザインを洗練
// */

// // Types
// interface Task {
//   id: string
//   barcode: string
//   modelNumber: string
//   deviceName: string
//   startDate?: Date
//   endDate?: Date
//   status?: string
//   [key: string]: any // 任意のプロパティを許可
// }

// interface GanttChartProps {
//   tasks: Task[]
//   startDate: Date
//   endDate: Date
//   // 追加: テーブル列の定義をサポート
//   tableColumns?: ColumnDef<Task, any>[]
//   // 追加: 列表示設定を有効にするオプション
//   enableColumnVisibility?: boolean
//   // フィルタリングを有効にするオプション
//   enableFiltering?: boolean
//   // ソートを有効にするオプション
//   enableSorting?: boolean
// }

// // TanStack Table の型定義拡張
// declare module '@tanstack/react-table' {
//   interface ColumnMeta<TData extends unknown, TValue> {
//     isHTML?: boolean;
//     exportOnly?: boolean;
//     filterType?: 'text' | 'date' | 'select';
//     width?: number; // 列の幅を指定
//   }
// }


// // Helper functions
// const getDaysArray = (start: Date, end: Date): Date[] => {
//   const arr = []
//   const dt = new Date(start)
//   while (dt <= end) {
//     arr.push(new Date(dt))
//     dt.setDate(dt.getDate() + 1)
//   }
//   return arr
// }

// const formatDate = (date: Date): string => {
//   return date.getDate().toString()
// }

// const formatMonth = (date: Date, locale = "ja-JP"): string => {
//   return `${date.getFullYear()}年${date.getMonth() + 1}月`
// }

// const isSameMonth = (date1: Date, date2: Date): boolean => {
//   return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
// }

// // デフォルトの列定義
// // const defaultTableColumns: ColumnDef<Task, any>[] = [
// //   {
// //     accessorKey: "barcode",
// //     header: "バーコード",
// //     cell: (info) => info.getValue ? info.getValue() : info.value,
// //     meta: { width: 150 }
// //   },
// //   {
// //     accessorKey: "modelNumber",
// //     header: "型番",
// //     cell: (info) => info.getValue ? info.getValue() : info.value,
// //     meta: { width: 150 }
// //   },
// //   {
// //     accessorKey: "deviceName",
// //     header: "機器名",
// //     cell: (info) => info.getValue ? info.getValue() : info.value,
// //     meta: { width: 200 }
// //   }
// // ]

// // 追加: カラムヘルパーをエクスポート (外部からの使用を容易にするため)
// export const columnHelper = createColumnHelper<any>()

// // カスタムフィルター関数の型定義を追加
// const customFilterFn = (row: any, columnId: string, filterValue: any) => {
//   // フィルター値がない場合はすべての行を表示
//   if (!filterValue) return true

//   // セルの値を取得
//   const cellValue = row.getValue(columnId)
//   if (cellValue === undefined || cellValue === null) return false

//   // セルの値を文字列に変換
//   const cellValueStr = String(cellValue).toLowerCase()
  
//   // フィルター値が文字列の場合（containsの場合）
//   if (typeof filterValue === 'string') {
//     return cellValueStr.includes(filterValue.toLowerCase())
//   }

//   // フィルター値がオブジェクトの場合
//   if (typeof filterValue === 'object' && 'operator' in filterValue) {
//     const { operator, value } = filterValue
    
//     // 空フィルター（何も表示しない）
//     if (operator === 'empty') {
//       return false
//     }
    
//     // value が配列の場合（選択肢タイプの場合）
//     if (Array.isArray(value)) {
//       if (operator === 'in') {
//         return value.some(val => String(val).toLowerCase() === cellValueStr)
//       }
//       return false
//     }
    
//     // value が文字列の場合（通常のフィルター）
//     const filterValueStr = String(value).toLowerCase()

//     switch (operator) {
//       case 'contains':
//         return cellValueStr.includes(filterValueStr)
//       case 'equals':
//         return cellValueStr === filterValueStr
//       case 'startsWith':
//         return cellValueStr.startsWith(filterValueStr)
//       case 'endsWith':
//         return cellValueStr.endsWith(filterValueStr)
//       case 'greaterThan':
//         return Number(cellValue) > Number(value)
//       case 'lessThan':
//         return Number(cellValue) < Number(value)
//       default:
//         return true
//     }
//   }

//   return true
// }

// // HTMLコンテンツを安全に表示するコンポーネント
// export function SafeHTML({ html, className }: { html: string, className?: string }) {
//   const hasHTMLTags = /<[a-z][\s\S]*>/i.test(html);
  
//   if (!hasHTMLTags) {
//     return <span className={className}>{html}</span>;
//   }
  
//   const sanitizedHTML = html
//     .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
//     .replace(/on\w+="[^"]*"/g, '')
//     .replace(/javascript:/gi, '');
  
//   return (
//     <div 
//       className={className} 
//       dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
//     />
//   );
// }

// export default function GanttChart({
//   tasks = [], // デフォルト値を追加して undefined を回避
//   startDate = new Date(2025, 0, 21),
//   endDate = new Date(2025, 3, 14),
//   tableColumns = [],
//   enableColumnVisibility = false,
//   enableFiltering = true,
//   enableSorting = true,
// }: Partial<GanttChartProps>) {
//   const [dividerPosition, setDividerPosition] = useState(400)
//   const [isDragging, setIsDragging] = useState(false)
//   const [scrollTop, setScrollTop] = useState(0)
//   const [tableScrollLeft, setTableScrollLeft] = useState(0)
//   const [columnVisibility, setColumnVisibility] = useState({})
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
//   const [sorting, setSorting] = useState<SortingState>([])
  
//   // フィルターモーダル用の状態
//   const [filterModalOpen, setFilterModalOpen] = useState(false)
//   const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null)
//   const [filterPosition, setFilterPosition] = useState<{ top: number; left: number } | undefined>(undefined)
  
//   const containerRef = useRef<HTMLDivElement>(null)
//   const tableRef = useRef<List>(null)
//   const ganttRef = useRef<List>(null)
//   const tableContainerRef = useRef<HTMLDivElement>(null)

//   const days = getDaysArray(startDate, endDate)
//   const ROW_HEIGHT = 36
//   const DAY_WIDTH = 30
//   // const TABLE_HEADER_HEIGHT = 40
//   const GANTT_HEADER_HEIGHT = 62
  
//   // 列にフィルター関数とソート設定を追加
//   const columnsWithFilters = useMemo(() => {
//     return tableColumns.map(column => ({
//       ...column,
//       filterFn: customFilterFn,
//       enableSorting: column.enableSorting !== false && enableSorting,
//     }))
//   }, [tableColumns, enableSorting])
  
//   // TanStack Tableの設定を更新
//   const table = useReactTable({
//     data: tasks,
//     columns: columnsWithFilters,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     state: {
//       columnVisibility,
//       columnFilters,
//       sorting,
//     },
//     onColumnVisibilityChange: setColumnVisibility,
//     onColumnFiltersChange: setColumnFilters,
//     onSortingChange: setSorting,
//     filterFns: {
//       custom: customFilterFn,
//     },
//     globalFilterFn: customFilterFn,
//   })
  
//   // 表示する列から幅を取得
//   const COLUMN_WIDTHS = useMemo(() => {
//     const widths: Record<string, number> = {}
    
//     table.getVisibleLeafColumns().forEach(column => {
//       const width = column.columnDef.meta?.width || 150
//       widths[column.id] = width
//     })
    
//     return widths
//   }, [table.getVisibleLeafColumns()])
  
//   // テーブルの全体幅を計算
//   const TABLE_TOTAL_WIDTH = useMemo(() => {
//     return Object.values(COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0)
//   }, [COLUMN_WIDTHS])

//   // Group days by month for the header
//   const months: { [key: string]: Date[] } = {}
//   days.forEach((day) => {
//     const monthKey = `${day.getFullYear()}-${day.getMonth()}`
//     if (!months[monthKey]) {
//       months[monthKey] = []
//     }
//     months[monthKey].push(day)
//   })

//   // Handle divider dragging
//   const handleMouseDown = (e: React.MouseEvent) => {
//     e.preventDefault()
//     setIsDragging(true)
//   }

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       if (isDragging && containerRef.current) {
//         const containerRect = containerRef.current.getBoundingClientRect()
//         const newPosition = e.clientX - containerRect.left

//         // 合理的な範囲内に制限
//         const minPosition = 200
//         const maxPosition = containerRect.width - 200

//         if (newPosition >= minPosition && newPosition <= maxPosition) {
//           setDividerPosition(newPosition)
          
//           // dividerの移動によるテーブルの自動スクロールを削除
//           // ユーザーが手動でスクロールした位置を尊重する
//         }
//       }
//     }

//     const handleMouseUp = () => {
//       setIsDragging(false)
//     }

//     if (isDragging) {
//       document.addEventListener("mousemove", handleMouseMove)
//       document.addEventListener("mouseup", handleMouseUp)
//     }

//     return () => {
//       document.removeEventListener("mousemove", handleMouseMove)
//       document.removeEventListener("mouseup", handleMouseUp)
//     }
//   }, [isDragging])

//   // フィルターアイコンクリックハンドラー
//   const handleFilterClick = (columnId: string, e: React.MouseEvent) => {
//     const rect = e.currentTarget.getBoundingClientRect()
//     setFilterPosition({
//       top: rect.bottom + window.scrollY,
//       left: rect.left + window.scrollX
//     })
    
//     setActiveFilterColumn(columnId)
//     setFilterModalOpen(true)
//   }

//   // 列がフィルターされているかチェック
//   const isColumnFiltered = (column: any) => Boolean(column.getFilterValue())

//   // Sync scrolling between table and gantt (vertical only)
//   const handleTableScroll = ({ scrollOffset }: { scrollOffset: number }) => {
//     setScrollTop(scrollOffset)
//     if (ganttRef.current) {
//       ganttRef.current.scrollTo(scrollOffset)
//     }
//   }

//   const handleGanttScroll = ({ scrollOffset }: { scrollOffset: number }) => {
//     setScrollTop(scrollOffset)
//     if (tableRef.current) {
//       tableRef.current.scrollTo(scrollOffset)
//     }
//   }

//   // Table horizontal scroll handler
//   const handleTableHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
//     const newScrollLeft = e.currentTarget.scrollLeft
//     setTableScrollLeft(newScrollLeft)
    
//     // ヘッダーのスクロール位置も同期させる
//     const headerElement = e.currentTarget.previousElementSibling;
//     if (headerElement && headerElement instanceof HTMLElement) {
//       headerElement.scrollLeft = newScrollLeft;
//     }
//   }

//   // カスタムテーブル行レンダラー - コンテキスト生成を修正
//   const TableRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
//     // フィルタリング後の行を取得
//     const rows = table.getRowModel().rows
    
//     // インデックスが範囲外の場合は何も表示しない
//     if (index >= rows.length) return null
    
//     const row = rows[index]
//     const task = row.original

//     return (
//       <div 
//         className={cn("flex border-b border-gray-200 h-full", index % 2 === 0 ? "bg-white" : "bg-gray-50")} 
//         style={style}
//       >
//         {row.getVisibleCells().map((cell) => {
//           const column = cell.column
//           const width = COLUMN_WIDTHS[column.id] || 150
          
//           return (
//             <div 
//               key={cell.id} 
//               className="flex-none p-2 truncate border-r border-gray-200 flex items-center text-sm font-light text-gray-600" 
//               style={{ width }}
//             >
//               {flexRender(
//                 cell.column.columnDef.cell, 
//                 {
//                   ...cell.getContext(),
//                   value: task[column.id], // 値を明示的に提供
//                   getValue: () => task[column.id], // getValue関数も明示的に提供
//                 }
//               )}
//             </div>
//           )
//         })}
//       </div>
//     )
//   }

//   // Row renderers
//   const GanttRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
//     // ソート/フィルタリング後の行を取得
//     const rows = table.getRowModel().rows
    
//     // インデックスが範囲外の場合は何も表示しない
//     if (index >= rows.length) return null
    
//     const row = rows[index]
//     const task = row.original

//     // バーのスタイルを計算するヘルパー関数
//     const getTaskBarStyle = (): React.CSSProperties | undefined => {
//       // startDate または endDate が未定義の場合はスタイルを返さない
//       if (!task.startDate || !task.endDate) {
//         return undefined
//       }

//       // task の開始日/終了日が days 配列内のどのインデックスに対応するか検索
//       const startIndex = days.findIndex((d) => d.getTime() === task.startDate!.getTime())
//       const endIndex = days.findIndex((d) => d.getTime() === task.endDate!.getTime())

//       // 開始日または終了日がガントチャートの表示期間外の場合
//       // バーの描画開始/終了インデックスを計算 (表示範囲内に収める)
//       const barStartIndex = Math.max(0, startIndex)
//       // 終了日は表示範囲の最終日と比較
//       const barEndIndex = endIndex === -1 ? days.length - 1 : Math.min(days.length - 1, endIndex)

//       // 開始日が期間後にあり、バーが表示されない場合 or 終了日が期間前にある場合
//       if (startIndex >= days.length || endIndex < 0) {
//         return undefined
//       }
//       // 開始日が期間より前で、終了日も期間より前の場合
//       if (startIndex < 0 && endIndex < 0) {
//         return undefined
//       }

//       // バーの左端位置を計算
//       // 開始日が期間より前の場合は、0番目の位置から開始
//       const leftPosition = (startIndex < 0 ? 0 : barStartIndex) * DAY_WIDTH

//       // バーの幅を計算
//       // 開始日が期間より前の場合、0から終了インデックスまで
//       // 終了日が期間より後の場合、開始インデックスから最終日まで
//       const width = ((endIndex === -1 ? days.length - 1 : barEndIndex) - (startIndex < 0 ? -1 : barStartIndex)) * DAY_WIDTH

//       // 丸角スタイルを決定
//       const borderRadius = `${startIndex === barStartIndex && startIndex >= 0 ? "0.375rem" : "0"} ${
//         endIndex === barEndIndex && endIndex !== -1 ? "0.375rem" : "0"
//       } ${endIndex === barEndIndex && endIndex !== -1 ? "0.375rem" : "0"} ${
//         startIndex === barStartIndex && startIndex >= 0 ? "0.375rem" : "0"
//       }`

//       return {
//         position: "absolute",
//         left: `${leftPosition}px`,
//         width: `${width}px`,
//         height: "2rem", // h-8相当
//         top: "0.1rem", // top-1相当
//         backgroundColor: "rgb(16 185 129)", // bg-emerald-500相当
//         color: "white",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         fontSize: "0.75rem", // text-xs相当
//         lineHeight: "1rem",
//         borderRadius: borderRadius, // 計算した丸角を適用
//         whiteSpace: 'nowrap', // テキストが折り返さないように
//         overflow: 'hidden',   // はみ出したテキストを隠す
//         textOverflow: 'ellipsis', // 省略記号(...)を表示
//         paddingLeft: '0.25rem', // 少しパディングを追加
//         paddingRight: '0.25rem',
//       }
//     }

//     const taskBarStyle = getTaskBarStyle()

//     return (
//       // 各行の高さを style から適用し、背景色と罫線を設定. ここのbg-gray-50で縞々つけてる
//       <div
//         className={cn("flex border-b border-gray-200 relative", index % 2 === 0 ? "bg-white" : "bg-gray-50")}
//         style={style} // react-window から渡される style (高さと top を含む) を適用
//       >
//         {/* 日付グリッドの描画 */}
//         {days.map((day, dayIndex) => (
//           <div
//             key={dayIndex}
//             className={cn(
//               "flex-none", // 縦罫線. border-r border-gray-200
//               day.getDay() === 0 || day.getDay() === 6 ? "bg-gray-100" : "", // 土日の背景色と下部ボーダー
//             )}
//             style={{ width: DAY_WIDTH, height: "100%" }} // 各日の幅と、行の高さいっぱいに広がるように
//           />
//         ))}
//         {/* タスクバーの描画 (スタイルが存在する場合のみ) */}
//         {taskBarStyle && (
//           <div style={taskBarStyle} title={task.status}> {/* title属性で全文表示 */}
//             {task.status}
//           </div>
//         )}
//       </div>
//     )
//   }

//   // フィルタリング後の行数
//   const filteredRowCount = table.getRowModel().rows.length

//   return (
//     <div className="flex flex-col h-[600px] border border-gray-300 bg-white overflow-hidden" ref={containerRef}>
//       {/* Headers と Content （左側：テーブル） */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* 左側: テーブル */}
//         <div 
//           className="overflow-hidden border-r border-gray-300" 
//           style={{ width: dividerPosition }}
//         >
//           {/* テーブルのヘッダー */}
//           <div 
//             className="border-b border-gray-300 sticky top-0 z-10 overflow-hidden"
//             style={{ height: GANTT_HEADER_HEIGHT, width: '100%' }}
//           >
//             <div 
//               className="flex h-full" 
//               style={{ 
//                 width: TABLE_TOTAL_WIDTH, 
//                 transform: `translateX(-${tableScrollLeft}px)` 
//               }}
//             >
//               {table.getVisibleLeafColumns().map(column => {
//                 const canSort = enableSorting && column.getCanSort()
//                 const canFilter = enableFiltering && column.getCanFilter()
                
//                 // ソートハンドラを事前に取得
//                 const sortHandler = canSort 
//                   ? column.getToggleSortingHandler() 
//                   : undefined
                
//                 return (
//                   <div 
//                     key={column.id}
//                     className={cn(
//                       "flex-none p-2 font-light border-r border-gray-300 text-gray-500 text-sm flex items-center justify-start",
//                       canSort && "cursor-pointer group"
//                     )}
//                     style={{ width: COLUMN_WIDTHS[column.id] || 150 }}
//                     onClick={sortHandler}
//                   >
//                     <div className="flex items-center justify-between w-full">
//                       <div className="flex items-center">
//                         {flexRender(
//                           column.columnDef.header, 
//                           {
//                             column,
//                             header: {
//                               id: column.id,
//                               column: column,
//                               colSpan: 1,
//                               rowSpan: 1,
//                               isPlaceholder: false,
//                               depth: 0,
//                               getLeafHeaders: () => [],
//                               getContext: () => ({ column, table }),
//                             },
//                             table
//                           }
//                         )}
                        
//                         {/* ソート状態に応じたアイコン表示 */}
//                         {canSort && (
//                           <div className="ml-1">
//                             {{
//                               asc: <MoveUp className="h-3 w-3" />,
//                               desc: <MoveDown className="h-3 w-3" />,
//                             }[column.getIsSorted() as string] ?? (
//                               <MoveVertical className="h-0 w-0 opacity-30 group-hover:opacity-100" />
//                             )}
//                           </div>
//                         )}
//                       </div>
                      
//                       {/* フィルターアイコン部分 */}
//                       <div className="flex items-center">
//                         {canFilter && (
//                           <button
//                             className={cn(
//                               "ml-2 text-muted-foreground hover:text-foreground p-1 rounded-sm",
//                               isColumnFiltered(column) && "text-pink-600 hover:text-pink-800"
//                             )}
//                             onClick={(e) => {
//                               e.stopPropagation()
//                               handleFilterClick(column.id, e)
//                             }}
//                           >
//                             <ListFilter className="h-3 w-3" />
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           </div>

//           {/* スクロール可能なテーブルコンテナ */}
//           <div 
//             ref={tableContainerRef}
//             className="overflow-x-auto overflow-y-hidden"
//             style={{ height: 600 - GANTT_HEADER_HEIGHT }}
//             onScroll={handleTableHorizontalScroll}
//           >
//             <div style={{ width: TABLE_TOTAL_WIDTH }}>
//               {filteredRowCount === 0 ? (
//                 <div className="p-4 text-center text-gray-500">
//                   表示できるデータがありません
//                 </div>
//               ) : (
//                 <List
//                   ref={tableRef}
//                   height={600 - GANTT_HEADER_HEIGHT}
//                   itemCount={filteredRowCount}
//                   itemSize={ROW_HEIGHT}
//                   width={TABLE_TOTAL_WIDTH}
//                   onScroll={handleTableScroll}
//                   itemData={tasks}
//                   style={{ overflow: 'hidden' }}
//                 >
//                   {TableRow}
//                 </List>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* 中央: 分割線. もう少しdividerの背景色を薄くしたい */}
//         <div 
//           className="w-1 bg-gray-300 opacity-80 cursor-col-resize hover:bg-red-600 z-10 flex-shrink-0 relative flex items-center justify-center"
//           onMouseDown={handleMouseDown}
//         >
//           <div className="absolute bg-white rounded-full p-0.5 shadow-sm border border-gray-200">
//             <EllipsisVertical className="h-3.5 w-3.5 text-gray-500" />
//           </div>
//         </div>

//         {/* 右側: ガントチャート（全体をスクロールコンテナにする） */}
//         <div className="flex-1 overflow-auto">
//           <div style={{ width: days.length * DAY_WIDTH }}>
//             {/* ガントチャートのヘッダー - position: sticky で固定 */}
//             <div 
//               className="border-b border-gray-300 sticky top-0 z-10" 
//               style={{ height: GANTT_HEADER_HEIGHT }}
//             >
//               {/* 月ヘッダー */}
//               <div className="flex border-b border-gray-300" style={{ height: GANTT_HEADER_HEIGHT / 2 }}>
//                 {Object.entries(months).map(([monthKey, monthDays]) => (
//                   <div
//                     key={monthKey}
//                     className="border-r border-gray-300 text-center text-xs p-1 font-xs text-gray-500 flex items-center justify-center flex-shrink-0"
//                     style={{ width: monthDays.length * DAY_WIDTH, height: '100%' }}
//                   >
//                     {formatMonth(monthDays[0])}
//                   </div>
//                 ))}
//               </div>

//               {/* 日ヘッダー */}
//               <div className="flex" style={{ height: GANTT_HEADER_HEIGHT / 2 }}>
//                 {days.map((day, index) => (
//                   <div
//                     key={index}
//                     className={cn(
//                       "flex-none border-r border-gray-300 text-xs text-gray-600 text-center p-1 flex items-center justify-center",
//                       day.getDay() === 0 || day.getDay() === 6 ? "bg-gray-100 border-b border-gray-300" : "",
//                     )}
//                     style={{ width: DAY_WIDTH, height: '100%' }}
//                   >
//                     {formatDate(day)}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* ガントチャートのコンテンツ */}
//             {filteredRowCount === 0 ? (
//               <div className="p-4 text-center text-gray-500">
//                 表示できるデータがありません
//               </div>
//             ) : (
//               <List
//                 ref={ganttRef}
//                 height={600 - GANTT_HEADER_HEIGHT}
//                 itemCount={filteredRowCount}
//                 itemSize={ROW_HEIGHT}
//                 width={days.length * DAY_WIDTH}
//                 onScroll={handleGanttScroll}
//                 itemData={table.getRowModel().rows}
//                 layout="vertical"
//                 style={{ overflowX: 'hidden' }}
//               >
//                 {GanttRow}
//               </List>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* フィルターモーダル */}
//       {filterModalOpen && activeFilterColumn && (
//         <FilterModal
//           column={table.getColumn(activeFilterColumn)!}
//           isOpen={filterModalOpen}
//           onClose={() => setFilterModalOpen(false)}
//           data={tasks}
//           position={filterPosition}
//           translations={{
//             operators: {
//               contains: "を含む",
//               equals: "と等しい",
//               startsWith: "で始まる",
//               endsWith: "で終わる",
//               greaterThan: "より大きい",
//               lessThan: "より小さい",
//               in: "のいずれか",
//             },
//             placeholder: "値を入力してください",
//             applyButton: "適用",
//             clearButton: "クリア",
//           }}
//         />
//       )}
//     </div>
//   )
// }
