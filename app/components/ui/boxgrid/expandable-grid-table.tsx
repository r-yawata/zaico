import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../button";
import { ExpandIcon } from "./expandable-grid-icons";

// 行データの基本型
export interface ExpandableGridItem {
  id: string | number;         // 一意のID
  parentId?: string | number;  // 親ID（親行の場合は未設定）
  [key: string]: any;          // その他のデータフィールド
}

// コンポーネントのプロパティ型
export type ExpandableGridTableProps<TData extends ExpandableGridItem, TChildData extends ExpandableGridItem = TData> = {
  data: TData[];                                     // 親行のデータ
  columns: ColumnDef<TData, any>[];                 // 親行の列定義
  childColumns?: ColumnDef<TChildData, any>[];       // 子行の列定義
  enableSelection?: boolean;                        // 行選択機能の有効化
  enableFiltering?: boolean;                        // フィルタリング機能の有効化
  enableSorting?: boolean;                          // ソート機能の有効化
  className?: string;                               // 追加CSSクラス
  onRowClick?: (row: TData | TChildData) => void; // 行クリック時のコールバック
  onParentRowToggle?: (parentId: string | number, isExpanded: boolean) => void; // 親行展開時のコールバック
  rowHeight?: number;                               // 行の高さ
  height?: string | number;                         // テーブル全体の高さ
  idField?: string;                                 // ID参照フィールド名（デフォルト: "id"）
  parentIdField?: string;                           // 親ID参照フィールド名（デフォルト: "parentId"）
  expandColumnIndex?: number;                       // 展開アイコンを表示する列のインデックス（デフォルト: 0）
  initialExpandedIds?: (string | number)[];         // 初期状態で展開する親行ID
  expandIconProps?: {                               // 展開アイコンのプロパティ
    size?: number;                                  // アイコンサイズ
    color?: string;                                 // アイコン色
    expandedColor?: string;                         // 展開時のアイコン色
  };
  childTableTitle?: string;                         // 子テーブルのタイトル
  getChildRowsForParent?: (parentId: string | number) => TChildData[]; // 親IDから子行を取得する関数
};

// カスタムCSS変数をJSX要素に設定するヘルパー関数
const setCSSVariables = (columns: { id: string; size: number }[]) => {
  const gridTemplateColumns = columns
    .map((col) => `${col.size === 150 ? "1fr" : `${col.size}px`}`)
    .join(" ");
  
  return {
    "--grid-template-columns": gridTemplateColumns,
  } as React.CSSProperties;
};

export function ExpandableGridTable<TData extends ExpandableGridItem>({
  data,
  columns,
  childColumns,
  enableSelection = false,
  enableFiltering = true,
  enableSorting = true,
  className,
  onRowClick,
  onParentRowToggle,
  rowHeight = 40,
  height = "calc(100vh - 200px)",
  idField = "id",
  parentIdField = "parentId",
  expandColumnIndex = 0,
  initialExpandedIds = [],
  expandIconProps,
  childTableTitle,
  getChildRowsForParent,
}: ExpandableGridTableProps<TData>) {
  // 子行の列定義が必須
  const actualChildColumns = childColumns || columns as unknown as ColumnDef<TData, any>[];

  // ステート管理
  const [expandedIds, setExpandedIds] = useState<(string | number)[]>(initialExpandedIds);
  const [selectedRowId, setSelectedRowId] = useState<string | number | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  // テーブルコンテナへの参照
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // 親行と子行のデータ分離
  const { parentRows, childRowsMap } = useMemo(() => {

    
    // 子データを取得する関数が提供されている場合
    if (getChildRowsForParent) {
      const childMap: Record<string | number, TData[]> = {};
      data.forEach(item => {
        const parentId = item[idField];
        childMap[parentId] = getChildRowsForParent(parentId);
      });
      
      return {
        parentRows: data,
        childRowsMap: childMap
      };
    }
    
    // 従来の方法：データを親と子に分類
    const parents: TData[] = [];
    const childrenMap: Record<string | number, TData[]> = {};
    
    // データを親と子に分類
    data.forEach(item => {
      if (item[parentIdField] === undefined || item[parentIdField] === null) {
        // 親行
        parents.push(item);
      } else {
        // 子行
        const parentId = item[parentIdField];
        if (!childrenMap[parentId]) {
          childrenMap[parentId] = [];
        }
        childrenMap[parentId].push(item);
      }
    });
    
    return {
      parentRows: parents,
      childRowsMap: childrenMap as Record<string | number, TData[]>
    };
  }, [data, parentIdField, idField, getChildRowsForParent]);
  
  // 親テーブル用のCSS変数の設定
  const parentCssVars = useMemo(() => {
    return setCSSVariables(columns.map(col => ({
      id: col.id || (col as any).accessorKey || '',
      size: (col as any).size || 150,
    })));
  }, [columns]);
  
  // 子テーブル用のCSS変数の設定
  const childCssVars = useMemo(() => {
    return setCSSVariables(actualChildColumns.map(col => ({
      id: col.id || (col as any).accessorKey || '',
      size: (col as any).size || 150,
    })));
  }, [actualChildColumns]);
  
  // 親行の展開・折りたたみ切り替え
  const toggleRowExpand = (parentId: string | number) => {
    const newExpandedIds = expandedIds.includes(parentId)
      ? expandedIds.filter(id => id !== parentId)
      : [...expandedIds, parentId];
    
    setExpandedIds(newExpandedIds);
    setActiveParentId(parentId);
    
    // コールバックが提供されている場合は呼び出し
    if (onParentRowToggle) {
      onParentRowToggle(parentId, newExpandedIds.includes(parentId));
    }
  };
  
  // すべての親行を一括で折りたたむ
  const collapseAll = () => {
    setExpandedIds([]);
    setActiveParentId(null);
  };
  
  // 親行のIDセルクリック処理（展開/折りたたみトグル）
  const handleParentIdCellClick = (parentId: string | number, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素へのイベント伝播を防止
    toggleRowExpand(parentId);
  };
  
  // 親行全体のクリック処理（選択処理のみ、展開はしない）
  const handleParentRowClick = (row: TData) => {
    const rowId = row[idField];
    setSelectedRowId(rowId);
    
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  // 子行クリック処理
  const handleChildRowClick = (row: TData) => {
    const rowId = row[idField];
    setSelectedRowId(rowId);
    
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  // 親テーブル構成
  const parentTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });
  
  // 子テーブル構成
  const childTable = useReactTable({
    data,
    columns: actualChildColumns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });
  
  // 親行の仮想スクロール設定
  const parentRowVirtualizer = useVirtualizer({
    count: parentRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: (index) => {
      const parentId = parentRows[index][idField];
      // 展開されている場合、子行の高さも考慮
      const isExpanded = expandedIds.includes(parentId);
      const childrenCount = isExpanded ? (childRowsMap[parentId]?.length || 0) : 0;
      
      // 子テーブルのヘッダー行の高さを含める
      const childHeaderHeight = isExpanded && childrenCount > 0 ? rowHeight : 0;
      
      // 親行 + 子テーブルヘッダー + 子行数 * 行高さ
      return rowHeight + childHeaderHeight + (childrenCount * rowHeight);
    },
    overscan: 5,
  });
  
  // 展開状態が変更されたら再計算を実行
  useEffect(() => {
    parentRowVirtualizer.measure();
  }, [expandedIds, parentRowVirtualizer]);
  
  // セルの値を取得する関数
  const getCellValue = (row: TData, columnId: string) => {
    // アクセサーキー
    const accessorKey = columnId;
    
    // 先にプロパティにアクセスを試みる（一般的なケース）
    if (row[accessorKey] !== undefined) {
      return row[accessorKey];
    }
    
    // 列定義から対応する列を見つける
    const column = columns.find(col => col.id === columnId || (col as any).accessorKey === columnId);
    
    // もし見つかった列にアクセサー関数があればそれを使用
    if (column && (column as any).accessorFn) {
      return (column as any).accessorFn(row, 0);
    }
    
    // 最後の手段として空文字を返す
    return '';
  };
  
  // 子テーブル用のセルの値を取得する関数
  const getChildCellValue = (row: TData, columnId: string) => {
    // アクセサーキー
    const accessorKey = columnId;
    
    // 先にプロパティにアクセスを試みる（一般的なケース）
    if (row[accessorKey] !== undefined) {
      return row[accessorKey];
    }
    
    // 列定義から対応する列を見つける
    const column = actualChildColumns.find(col => col.id === columnId || (col as any).accessorKey === columnId);
    
    // もし見つかった列にアクセサー関数があればそれを使用
    if (column && (column as any).accessorFn) {
      return (column as any).accessorFn(row, 0);
    }
    
    // cell関数があれば、それを使用してセルの内容をレンダリング
    if (column && (column as any).cell) {
      const context = {
        row: { original: row },
        getValue: () => row[accessorKey]
      };
      return (column as any).cell(context);
    }
    
    // 最後の手段として空文字を返す
    return '';
  };
  
  // 親行のレンダリング関数
  const renderParentRow = (row: TData, index: number) => {
    const rowId = row[idField];
    const isExpanded = expandedIds.includes(rowId);
    const isSelected = selectedRowId === rowId;
    
    return (
      <React.Fragment key={`parent-${rowId}`}>
        <div
          className={cn(
            "expandable-grid-row",
            isSelected && "bg-muted",
            "border-t border-gray-200 transition-colors hover:bg-gray-50"
          )}
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--grid-template-columns)',
            height: `${rowHeight}px`,
          }}
          onClick={() => handleParentRowClick(row)}
          data-row-id={rowId}
          data-parent-row="true"
          data-expanded={isExpanded ? "true" : "false"}
          aria-expanded={isExpanded}
          aria-controls={`child-rows-${rowId}`}
        >
          {parentTable.getHeaderGroups()[0].headers.map((header, cellIndex) => {
            // IDセル（指定された列）に展開アイコンと下線を追加
            if (cellIndex === expandColumnIndex) {
              return (
                <div
                  key={`cell-${header.id}-${rowId}`}
                  className="px-4 py-2 flex items-center overflow-hidden cursor-pointer"
                >
                  <div 
                    className="mr-2 flex items-center expand-icon"
                    onClick={(e) => handleParentIdCellClick(rowId, e)}
                  >
                    <ExpandIcon
                      isExpanded={isExpanded}
                      size={expandIconProps?.size || 16}
                      color={expandIconProps?.color || "#666"}
                      expandedColor={expandIconProps?.expandedColor || "#333"}
                    />
                  </div>
                  <div className="text-ellipsis overflow-hidden whitespace-nowrap underline text-sm">
                    {getCellValue(row, header.id)}
                  </div>
                </div>
              );
            }
            
            // 通常のセル
            return (
              <div
                key={`cell-${header.id}-${rowId}`}
                className="px-4 py-2 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-sm"
              >
                {getCellValue(row, header.id)}
              </div>
            );
          })}
        </div>
        
        {/* 展開時の子行表示 */}
        {isExpanded && (<div>
          <div 
            id={`child-rows-${rowId}`} 
            className="child-table-container ml-4 mr-0 border border-gray-200 border-opacity-70" 
            style={{ padding: '2px' }}
          >
            {/* 子テーブルの内容をpadding: 2pxの内側に配置 */}
            <div className="border border-gray-200 border-opacity-50" style={childCssVars}>
              {/* 子テーブルタイトル（オプション） */}
              {childTableTitle && (
                <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                  {childTableTitle}
                </div>
              )}
              
              {/* 子テーブルヘッダー */}
              <div 
                className="child-table-header" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'var(--grid-template-columns)',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                {childTable.getHeaderGroups()[0].headers.map((header) => (
                  <div
                    key={`child-header-${header.id}`}
                    className="h-8 px-4 text-left flex items-center font-medium text-gray-500 text-xs"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                ))}
              </div>
              
              {/* 子テーブル本体 */}
              {renderChildRows(rowId)}
            </div>
          </div>
        </div>)}
      </React.Fragment>
    );
  };
  
  // 子行のレンダリング関数
  const renderChildRows = (parentId: string | number) => {
    const children = childRowsMap[parentId] || [];
    
    if (children.length === 0) {
      return (
        <div
          className="expandable-grid-empty-child-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--grid-template-columns)',
            height: `${rowHeight}px`,
          }}
        >
          <div
            className="px-4 py-2 flex items-center text-gray-400 text-xs col-span-full"
          >
            子項目がありません
          </div>
        </div>
      );
    }
    
    return children.map((childRow, index) => {
      const childId = childRow[idField];
      const isSelected = selectedRowId === childId;
      const isLastChild = index === children.length - 1;
      
      return (
        <div
          key={`child-${childId}`}
          className={cn(
            "expandable-grid-child-row",
            isSelected && "bg-muted",
            !isLastChild && "border-b border-gray-200",
            "hover:bg-gray-50 cursor-pointer transition-colors"
          )}
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--grid-template-columns)',
            height: `${rowHeight}px`,
          }}
          onClick={() => handleChildRowClick(childRow)}
          data-row-id={childId}
          data-parent-id={parentId}
          data-child-row="true"
        >
          {childTable.getHeaderGroups()[0].headers.map((header) => {
            const column = actualChildColumns.find(col => col.id === header.id || (col as any).accessorKey === header.id);
            const cellContent = column && (column as any).cell 
              ? (column as any).cell({ row: { original: childRow }, getValue: () => childRow[header.id] })
              : getChildCellValue(childRow, header.id);
              
            return (
              <div
                key={`child-cell-${header.id}-${childId}`}
                className="px-4 py-2 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-sm"
              >
                {cellContent}
              </div>
            );
          })}
        </div>
      );
    });
  };
  
  return (
    <div className={cn("w-full expandable-grid-container", className)} style={parentCssVars}>
      {/* 全て折りたたむボタン */}
      {/* <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={collapseAll}
          className="text-xs"
        >
          すべて折りたたむ
        </Button>
      </div> */}
      
      <div className="border border-gray-200">
        {/* ヘッダー部分 */}
        <div 
          className="expandable-grid-header" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'var(--grid-template-columns)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'white',
          }}
        >
          {parentTable.getHeaderGroups()[0].headers.map((header) => {
            const canSort = enableSorting && header.column.getCanSort();
            
            return (
              <div
                key={`header-${header.id}`}
                className="h-11 px-4 text-left flex items-center font-medium text-gray-500 text-xs bg-gray-50"
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
              >
                <div className="flex items-center justify-between w-full">
                  <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                  {canSort && (
                    <div className="flex items-center">
                      {{
                        asc: <ChevronDown className="h-3 w-3 transform rotate-180" />,
                        desc: <ChevronDown className="h-3 w-3" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* テーブル本体 */}
        <div 
          className="expandable-grid-scroll-container" 
          ref={tableContainerRef}
          style={{ 
            height: typeof height === 'number' ? `${height}px` : height,
            overflow: 'auto'
          }}
        >
          {parentRows.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">
              表示可能なデータがありません
            </div>
          ) : (
            <div
              className="expandable-grid-rows-container"
              style={{
                height: `${parentRowVirtualizer.getTotalSize()}px`,
                position: 'relative',
                width: '100%'
              }}
            >
              {parentRowVirtualizer.getVirtualItems().map((virtualRow) => {
                const parentRow = parentRows[virtualRow.index];
                
                return (
                  <div
                    key={`parent-container-${parentRow[idField]}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderParentRow(parentRow, virtualRow.index)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <style>
        {`
          .expandable-grid-row:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          
          .expandable-grid-child-row:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          
          .expandable-grid-row .expand-icon {
            transition: transform 0.2s ease-in-out;
          }
         
          .expandable-grid-row[data-expanded="true"] .expand-icon {
            transform: rotate(90deg);
          }
            
          /* 親行コンテナ内の最後の要素に下部ボーダーを追加 */
          .expandable-grid-rows-container > div:last-child .expandable-grid-row {
            padding-bottom: 2px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          /* 子行のボーダー設定 */
          .expandable-grid-child-row {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .expandable-grid-child-row:last-child {
            border-bottom: none;
          }
        `}
      </style>
    </div>
  );
} 