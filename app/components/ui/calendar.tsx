import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  addMonths, 
  subMonths, 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  getDay,
  Locale
} from "date-fns";
import { ja } from "date-fns/locale";

export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  locale?: Locale;
  className?: string;
  initialMonth?: Date;
  weekStartsOn?: 0 | 1; // 0: 日曜日始まり, 1: 月曜日始まり
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  initialFocus = false,
  locale = ja,
  className = "",
  initialMonth,
  weekStartsOn = 0, // デフォルトは日曜日始まり
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    initialMonth || selected || new Date()
  );
  
  React.useEffect(() => {
    if (initialMonth) {
      setCurrentMonth(initialMonth);
    } else if (selected) {
      setCurrentMonth(selected);
    }
  }, [initialMonth, selected]);
  
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const goToPreviousYear = () => {
    setCurrentMonth(subMonths(currentMonth, 12));
  };
  
  const goToNextYear = () => {
    setCurrentMonth(addMonths(currentMonth, 12));
  };
  
  // 月の最初の日と最後の日を取得
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // 表示する日付範囲を取得（前月と次月の日も含む）
  const startDate = startOfWeek(monthStart, { locale, weekStartsOn });
  const endDate = endOfWeek(monthEnd, { locale, weekStartsOn });
  
  // 日付の配列を生成
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  // 曜日の配列を生成（週の開始日に応じて調整）
  const weekdays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startDate, i);
    return format(date, "ccccc", { locale });
  });
  
  // 週ごとに日付を分割（週の開始日に応じて調整）
  const weeks: Date[][] = [];
  let week: Date[] = [];
  
  dateRange.forEach((date) => {
    week.push(date);
    if (getDay(date) === (weekStartsOn === 1 ? 0 : 6)) { // 月曜始まりの場合は日曜日で区切る
      weeks.push([...week]);
      week = [];
    }
  });
  
  if (week.length > 0) {
    weeks.push(week);
  }
  
  return (
    <div className={`p-2 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousYear}
              className="p-0.5 rounded-md hover:bg-gray-100"
              aria-label="前年"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium">
              {format(currentMonth, "yyyy年", { locale })}
            </span>
            <button
              onClick={goToNextYear}
              className="p-0.5 rounded-md hover:bg-gray-100"
              aria-label="次年"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-0.5 rounded-md hover:bg-gray-100"
              aria-label="前月"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-medium">
              {format(currentMonth, "MM月", { locale })}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-0.5 rounded-md hover:bg-gray-100"
              aria-label="次月"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="border-b border-gray-200 pb-1">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((weekday, i) => (
            <div key={i} className="text-center text-[0.65rem] text-gray-500">
              {weekday}
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-0.5">
            {week.map((date, dateIndex) => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = selected ? isSameDay(date, selected) : false;
              
              return (
                <button
                  key={dateIndex}
                  onClick={() => onSelect?.(date)}
                  className={`
                    h-6 w-6 p-0 rounded-md text-xs
                    ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                    ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-100"}
                    disabled:opacity-50
                  `}
                  disabled={!isCurrentMonth}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
} 