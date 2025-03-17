import React from 'react';

// テーブルのカラム定義の型
export type TableColumn<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
};

// テーブルのプロパティの型
export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor?: (item: T) => string | number;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  rowProps?: (item: T) => Record<string, any>;
  // onRowClick?: (item: T, index: number) => void;
};


// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

export function Table<T>({
  columns,
  data,
  isLoading = false,
  keyExtractor,
  emptyMessage = 'データがありません',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  onRowClick,
}: TableProps<T>) {
  // アイテムからキーを抽出する関数
  const getKey = (item: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(item);
    }
    
    // @ts-ignore - 'id'が存在する場合はそれを使用
    if (item.id) {
      // @ts-ignore
      return item.id;
    }
    
    return index;
  };

  // アクセサーから値を取得する関数
  const getCellValue = (item: T, accessor: TableColumn<T>['accessor']) => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    
    return item[accessor] as React.ReactNode;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className={cn("bg-gray-50 dark:bg-gray-900", headerClassName)}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={cn(
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn("bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700", bodyClassName)}>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map((item, rowIndex) => (
              <tr 
                key={getKey(item, rowIndex)} 
                className={cn("hover:bg-gray-50 dark:hover:bg-gray-700", rowClassName)}
                onClick={() => onRowClick?.(item, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={cn(
                      "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white",
                      column.className
                    )}
                  >
                    {getCellValue(item, column.accessor) || '-'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 