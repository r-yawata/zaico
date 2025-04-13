"use client"

import { useState, useEffect, useRef, RefObject } from "react"
import { Button } from "../button"
import { Input } from "../input"
import type { Column } from "@tanstack/react-table"
import { CustomSelect, type FilterOperator } from "./custom-select"
import { SafeHTML } from "./virtualized-grid-table"
import { Checkbox } from "../checkbox"
import { Search } from "lucide-react"

// フィルター値の型定義
interface FilterValue {
  operator: FilterOperator
  value: string | string[] // 配列型も許可
}

// コンポーネントのプロパティ型定義
interface FilterModalProps<TData> {
  column: Column<TData, unknown>
  isOpen: boolean
  onClose: () => void
  data: TData[]
  position?: { top: number; left: number }
  translations?: {
    operators: Record<FilterOperator, string>
    placeholder: string
    applyButton: string
    clearButton: string
  }
}

// デフォルトの翻訳
const defaultTranslations = {
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
}

// クリック外部監視のカスタムフック
function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  ignoreSelectors: string[] = []
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      
      // モーダル内部のクリックを無視
      if (ref.current?.contains(target)) {
        return
      }
      
      // 指定されたセレクタに一致する要素のクリックを無視
      for (const selector of ignoreSelectors) {
        try {
          if (target instanceof Element && (target.closest(selector) || target.matches(selector))) {
            return
          }
        } catch (e) {
          console.warn(`Invalid selector: ${selector}`, e);
        }
      }
      
      handler()
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, ignoreSelectors])
}

// 日付選択用コンポーネント
const DatePicker = ({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-0 pb-0 border-0 border-b border-gray-400 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-pink-600 focus-visible:border-pink-600 text-[12px] transition-colors"
    />
  );
};

// 全選択チェックボックス用のスタイル
const checkboxStyles = `
  data-[state=checked]:bg-pink-600 
  data-[state=checked]:text-white 
  data-[state=checked]:border-pink-600 
  data-[state=unchecked]:border-gray-300
  focus:ring-0 
  focus:ring-offset-0 
  focus-visible:ring-0 
  focus-visible:ring-offset-0 
  focus:outline-none 
  focus-visible:outline-none
  outline-none
`;

// カスタムチェックボックスコンポーネント
const CustomCheckbox = ({ 
  checked, 
  onCheckedChange, 
  id 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  id: string;
}) => {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Checkbox 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        id={id} 
        className={`
          data-[state=checked]:bg-pink-600 
          data-[state=checked]:text-white 
          data-[state=checked]:border-pink-600 
          data-[state=unchecked]:border-gray-300
          focus:ring-0 
          focus:ring-offset-0 
          focus-visible:ring-0 
          focus-visible:ring-offset-0 
          focus:outline-none 
          focus-visible:outline-none
          outline-none
        `}
        style={{ outline: 'none' }}
      />
      {/* オーバーレイdivでフォーカス時の表示をブロック */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        onClick={(e) => e.preventDefault()}
      />
    </div>
  );
};

// 選択肢リスト用コンポーネント（テーブル形式）
const SelectOptions = <TData,>({ 
  data, 
  column, 
  selectedValues, 
  onSelectionChange 
}: {
  data: TData[];
  column: Column<TData, unknown>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // データからユニークな値を抽出
  const uniqueValues = Array.from(new Set(
    data.map(item => {
      const value = item[column.id as keyof TData];
      return value !== undefined && value !== null ? String(value) : '';
    }).filter(Boolean)
  )).sort();

  // 検索クエリに基づいてフィルタリングされた値
  const filteredValues = searchQuery.trim() === "" 
    ? uniqueValues 
    : uniqueValues.filter(value => 
        value.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // isHTML設定の確認
  const isHTML = Boolean(column.columnDef.meta?.isHTML);

  // 全選択の状態をチェック
  const allSelected = uniqueValues.length > 0 && uniqueValues.length === selectedValues.length;
  
  // フィルタリングされた項目の全選択状態をチェック
  const allFilteredSelected = filteredValues.length > 0 && 
    filteredValues.every(value => selectedValues.includes(value));

  // 全選択/解除の処理
  const toggleSelectAll = () => {
    if (searchQuery.trim() === "") {
      // 検索クエリがない場合は全ての選択肢を対象に
      if (allSelected) {
        onSelectionChange([]);
      } else {
        onSelectionChange([...uniqueValues]);
      }
    } else {
      // 検索クエリがある場合はフィルタリングされた選択肢のみを対象に
      if (allFilteredSelected) {
        // フィルターされた項目をすべて除外
        onSelectionChange(selectedValues.filter(value => !filteredValues.includes(value)));
      } else {
        // フィルターされた項目をすべて追加（重複なく）
        const newSelection = [...new Set([...selectedValues, ...filteredValues])];
        onSelectionChange(newSelection);
      }
    }
  };

  // 個別アイテムの選択/解除
  const toggleSelectItem = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  // 検索フィールドのフォーカス設定
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // モーダルが開いたら検索フィールドにフォーカス
    searchInputRef.current?.focus();
  }, []);

  // チェックボックスのスタイル
  const checkboxStyle = {
    outline: 'none',
    boxShadow: 'none'
  };

  return (
    <div className="space-y-2">
      {/* 検索バー */}
      <div className="relative">
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="pl-8 pr-2 py-1 text-xs mb-3 border-0 border-b rounded-none border-pink-600 focus:border-pink-600 focus:ring-0 focus-visible:ring-0"
        />
      </div>
      
      <div className="max-h-60 overflow-y-auto rounded-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleSelectAll()}
            >
              <th className="p-2 pb-3 text-left">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={searchQuery.trim() === "" ? allSelected : allFilteredSelected} 
                    onCheckedChange={toggleSelectAll}
                    id="select-all" 
                    className="data-[state=checked]:bg-pink-600 data-[state=checked]:text-white data-[state=checked]:border-pink-600"
                    style={checkboxStyle}
                    onClick={(e) => e.stopPropagation()} // 伝播は止めるが、チェックボックス自体の処理は実行
                  />
                  <label 
                    htmlFor="select-all" 
                    className="text-xs font-medium cursor-pointer w-full"
                    onClick={(e) => e.preventDefault()} // ラベルクリックでもチェックボックスの標準動作を防止
                  >
                    Select All
                  </label>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredValues.length > 0 ? (
              filteredValues.map((value, index) => (
                <tr 
                  key={index} 
                  className="last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleSelectItem(value)}
                >
                  <td className="p-2 pb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={selectedValues.includes(value)} 
                        onCheckedChange={() => toggleSelectItem(value)}
                        id={`select-item-${index}`} 
                        className="data-[state=checked]:bg-pink-600 data-[state=checked]:text-white data-[state=checked]:border-pink-600"
                        style={checkboxStyle}
                        onClick={(e) => e.stopPropagation()} // 伝播は止めるが、チェックボックス自体の処理は実行
                      />
                      <label 
                        htmlFor={`select-item-${index}`} 
                        className="text-xs cursor-pointer"
                        onClick={(e) => e.preventDefault()} // ラベルクリックでもチェックボックスの標準動作を防止
                      >
                        {isHTML ? (
                          <SafeHTML html={value} />
                        ) : (
                          <span>{value}</span>
                        )}
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2 text-center text-gray-500 text-xs">
                  該当する項目がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export function FilterModal<TData>({ 
  column, 
  isOpen, 
  onClose, 
  data, 
  position,
  translations = defaultTranslations 
}: FilterModalProps<TData>) {
  const [filterValue, setFilterValue] = useState<FilterValue>({
    operator: "startsWith",
    value: "",
  })
  // 選択肢タイプ用の選択状態
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 列のフィルタータイプを取得
  const filterType = column.columnDef.meta?.filterType || 'text';

  // 現在のフィルター値を取得
  useEffect(() => {
    console.log('Current filters:', column.getFilterValue());

    if (isOpen) {
      const currentFilter = column.getFilterValue()
      
      if (filterType === 'select') {
        // 選択肢タイプの場合
        if (currentFilter === undefined) {
          // データからユニークな値を抽出して全選択状態にする
          const uniqueValues = Array.from(new Set(
            data.map(item => {
              const value = item[column.id as keyof TData];
              return value !== undefined && value !== null ? String(value) : '';
            }).filter(Boolean)
          ));
          setSelectedOptions(uniqueValues);
        } else if (Array.isArray(currentFilter)) {
          // 配列の場合はそのまま使用
          setSelectedOptions(currentFilter);
        } else if (currentFilter !== null && typeof currentFilter === 'object' && 
                  'value' in currentFilter && Array.isArray((currentFilter as any).value)) {
          // オブジェクトで値が配列の場合
          setSelectedOptions((currentFilter as any).value);
        } else {
          // それ以外の場合は空配列
          setSelectedOptions([]);
        }
      } else {
        // 通常のテキスト/日付タイプの場合（既存のコード）
        if (typeof currentFilter === "string") {
          setFilterValue({
            operator: "contains",
            value: currentFilter,
          })
        } else if (
          currentFilter &&
          typeof currentFilter === "object" &&
          "operator" in currentFilter &&
          "value" in currentFilter
        ) {
          setFilterValue(currentFilter as FilterValue)
        } else {
          setFilterValue({
            operator: "startsWith",
            value: "",
          })
        }
      }
    }
  }, [isOpen, column, data, filterType])

  // フォーカス設定のためのEffect
  useEffect(() => {
    if (isOpen && inputRef.current && filterType === 'text') {
      // わずかな遅延を設けることでモーダル表示後に確実にフォーカスされるようにする
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, filterType]);

  // カスタムフックを使用してより簡潔に外部クリック処理を実装
  useOnClickOutside(modalRef, onClose, ['.custom-dropdown-menu']);

  // フィルターを適用
  const applyFilter = () => {
    if (filterType === 'select') {
      // 選択肢タイプの場合
      const uniqueValues = Array.from(new Set(
        data.map(item => {
          const value = item[column.id as keyof TData];
          return value !== undefined && value !== null ? String(value) : '';
        }).filter(Boolean)
      ));
      
      if (selectedOptions.length === uniqueValues.length) {
        // 全て選択の場合はフィルターなし
        column.setFilterValue(undefined);
      } else if (selectedOptions.length === 0) {
        // 全て非選択の場合は「何も表示しない」特殊フィルター
        column.setFilterValue({ operator: "empty", value: [] });
      } else {
        // 一部選択の場合は選択された値の配列でフィルター
        column.setFilterValue({ operator: "in", value: selectedOptions });
      }
    } else {
      // 通常のテキスト/日付タイプの場合（既存のコード）
      if (filterValue.value) {
        column.setFilterValue(
          filterValue.operator === "contains"
            ? filterValue.value
            : { operator: filterValue.operator, value: filterValue.value },
        )
      } else {
        column.setFilterValue(undefined)
      }
    }
    onClose()
  }

  // フィルターをクリア
  const clearFilter = () => {
    column.setFilterValue(undefined)
    onClose()
  }

  // モーダルが閉じている場合は何も表示しない
  if (!isOpen) return null

  // カラムが数値型かどうかチェック
  const isNumericColumn = () => {
    if (!data.length) return false
    
    const sampleValue = data[0]?.[column.id as keyof typeof data[0]]
    if (sampleValue === undefined || sampleValue === null) return false
    
    // 数値変換を試みる
    return !isNaN(Number(sampleValue))
  }

  // モーダルの位置を調整する
  const modalStyle = {
    top: position?.top || 0,
    left: (position?.left || 0) - 280, // サイズ調整
    maxHeight: '80vh',
    overflowY: 'auto' as const
  }

  // 利用可能な演算子を取得
  const getAvailableOperators = () => {
    // フィルタータイプに応じて演算子を制限
    if (filterType === 'select') {
      return ["equals", "contains"] as FilterOperator[];
    } else if (filterType === 'date') {
      return ["equals", "greaterThan", "lessThan"] as FilterOperator[];
    }
    
    const operators: FilterOperator[] = ["contains", "equals", "startsWith", "endsWith"];
    
    if (isNumericColumn()) {
      operators.push("greaterThan", "lessThan");
    }
    
    return operators;
  };

  // フィルタータイプに基づいて入力UIをレンダリング
  const renderInputByType = () => {
    switch (filterType) {
      case 'date':
        return (
          <DatePicker
            value={filterValue.value as string || ""}
            onChange={(value) => setFilterValue({ ...filterValue, value })}
            placeholder={translations.placeholder}
          />
        );
      
      case 'select':
        return (
          <SelectOptions
            data={data}
            column={column}
            selectedValues={selectedOptions}
            onSelectionChange={setSelectedOptions}
          />
        );
      
      default: // 'text'
        return (
          <Input
            ref={inputRef}
            value={filterValue.value as string || ""}
            onChange={(e) => setFilterValue({ ...filterValue, value: e.target.value })}
            placeholder={translations.placeholder}
            className="pl-0 pb-0 border-0 border-b border-gray-400 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-pink-600 focus-visible:border-pink-600 text-[12px] transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyFilter();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
        );
    }
  };

  return (
    <div
      ref={modalRef}
      className="absolute z-50 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] rounded-sm border border-gray-200 w-80"
      style={modalStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* グローバルスタイルは削除し、代わりにインラインスタイルを使用 */}
      
      <div className="p-4 pt-5 space-y-4">
        {/* オペレーター選択は選択肢タイプでは表示しない */}
        {filterType !== 'select' && (
          <CustomSelect 
            value={filterValue.operator}
            onChange={(operator) => setFilterValue({...filterValue, operator})}
            options={getAvailableOperators()}
            translations={translations.operators}
          />
        )}

        {/* フィルタータイプに応じた入力UI */}
        {renderInputByType()}

        <div className="flex justify-end gap-5 pt-2 text-[14px]">
          <span 
            onClick={applyFilter} 
            className="text-pink-600 hover:text-pink-800 cursor-pointer font-medium transition-colors"
          >
            {translations.applyButton}
          </span>
          <span 
            onClick={clearFilter} 
            className="text-gray-500 hover:text-gray-700 cursor-pointer font-medium transition-colors"
          >
            {translations.clearButton}
          </span>
        </div>
      </div>
    </div>
  )
}
