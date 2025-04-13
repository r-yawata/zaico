import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "./input";
import { ja } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "../../lib/utils";
import { createPortal } from 'react-dom';

// 現状は、input要素で直接日付情報を触るとかれんだーUIは消えるが、これでいいか考える

// シンプルなDatePickerコンポーネント
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  disabled = false,
  className = "",
}: DatePickerProps) {
  // valueが有効な日付の場合はその日付を使用、そうでなければundefined
  const parseDate = React.useCallback((dateStr: string): Date | undefined => {
    try {
      const date = new Date(dateStr);
      return isValid(date) ? date : undefined;
    } catch (e) {
      return undefined;
    }
  }, []);

  // 初期化時と再レンダリング時に安全に日付をパース
  const parsedValue = React.useMemo(() => parseDate(value), [value, parseDate]);
  
  // 各種ステートを設定
  const [date, setDate] = React.useState<Date | undefined>(parsedValue);
  const [inputValue, setInputValue] = React.useState(
    parsedValue ? format(parsedValue, "yyyy/MM/dd") : ""
  );
  const [open, setOpen] = React.useState(false);
  
  // 初期表示月を管理するステート
  const [initialMonth, setInitialMonth] = React.useState<Date | undefined>(
    parsedValue || undefined
  );
  
  // カレンダーコンポーネントの月表示を制御するためのref
  const calendarMonthRef = React.useRef<Date | null>(parsedValue || null);
  
  // ポップオーバーの位置を計算するための参照
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  
  // ポップオーバーの位置を計算
  const getPopoverPosition = React.useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    return {
      top: rect.bottom + scrollY + 4, // 4pxの余白を追加
      left: rect.left + scrollX,
    };
  }, []);

  // 日付選択時の処理
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const formattedDate = format(newDate, "yyyy-MM-dd");
      onChange(formattedDate);
      setInputValue(format(newDate, "yyyy/MM/dd"));
      calendarMonthRef.current = newDate;
    }
    setOpen(false);
  };

  // 入力変更時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    try {
      const parsedDate = parse(newValue, "yyyy/MM/dd", new Date());
      if (isValid(parsedDate)) {
        setDate(parsedDate);
        calendarMonthRef.current = parsedDate;
        onChange(format(parsedDate, "yyyy-MM-dd"));
      }
    } catch (error) {
      // 無効な日付形式の場合は何もしない
    }
  };

  // カレンダー表示を開くときに一度だけ実行
  const popoverOpenHandler = React.useCallback(() => {
    if (date) {
      setInitialMonth(date); // 現在選択されている日付で初期表示月を更新
    }
    setOpen(true);
  }, [date]);

  // 外部からの値の変更を監視
  React.useEffect(() => {
    const newParsedDate = parseDate(value);
    if (newParsedDate) {
      if (!date || newParsedDate.getTime() !== date.getTime()) {
        setDate(newParsedDate);
        setInitialMonth(newParsedDate); // 値が変更されたときに初期表示月も更新
        setInputValue(format(newParsedDate, "yyyy/MM/dd"));
      }
    } else if (value === "") {
      setDate(undefined);
      setInputValue("");
    }
  }, [value, parseDate, date]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={`relative w-full text-left ${className}`}
        disabled={disabled}
        onClick={popoverOpenHandler}
      >
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pr-10"
        />
        <CalendarIcon 
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        />
      </button>

      {/* オーバーレイレイヤー */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          style={{ pointerEvents: 'auto' }} 
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* カレンダーUI */}
      {open && createPortal(
        <div 
          className="absolute z-50 bg-white rounded-md shadow-lg"
          style={{
            top: getPopoverPosition().top,
            left: getPopoverPosition().left,
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialMonth={initialMonth}
            initialFocus
            locale={ja}
          />
        </div>,
        document.body
      )}
    </div>
  );
} 