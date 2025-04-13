"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

// フィルター演算子の型定義
export type FilterOperator = "contains" | "equals" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "in"

// 翻訳オブジェクトの型
type OperatorTranslations = Record<FilterOperator, string>

// コンポーネントのプロパティ型定義
interface CustomSelectProps {
  value: FilterOperator
  onChange: (value: FilterOperator) => void
  options: FilterOperator[]
  translations: OperatorTranslations
  className?: string
}

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  translations, 
  className = "" 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  // ドロップダウン位置を計算する関数
  const getDropdownPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 }
    
    const rect = triggerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    }
  }

  // ESCキーでドロップダウンを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.custom-dropdown-menu')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`w-full relative custom-select-container text-[12px] ${className}`}>
      <div 
        ref={triggerRef}
        className="flex items-center justify-between w-full border-b border-gray-400 pb-1 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}>
        <span className="text-[12px]">{translations[value]}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      
      {isOpen && createPortal(
        <div 
          className="fixed bg-white shadow-lg rounded-md z-[9999] max-h-48 overflow-auto py-1 custom-dropdown-menu"
          style={{
            top: getDropdownPosition().top,
            left: getDropdownPosition().left,
            width: getDropdownPosition().width,
          }}
        >
          {options.map((op) => (
            <div
              key={op}
              className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-gray-100 ${value === op ? 'bg-pink-500 text-white' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(op);
                setIsOpen(false);
                // モーダルが閉じないよう、イベント伝播を止める
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              {translations[op]}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
} 