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
  getDay
} from "date-fns";
import { ja } from "date-fns/locale";

//表示サイズの綺麗さはこちらの方がいいけど、UIが大きすぎて使い勝手に影響でてる

export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  locale?: Locale;
  className?: string;
  initialMonth?: Date;
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  initialFocus = false,
  locale = ja,
  className = "",
  initialMonth,
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
  
  // 月の最初の日と最後の日を取得
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // 表示する日付範囲を取得（前月と次月の日も含む）
  const startDate = startOfWeek(monthStart, { locale });
  const endDate = endOfWeek(monthEnd, { locale });
  
  // 日付の配列を生成
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  // 曜日の配列を生成
  const weekdays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startDate, i);
    return format(date, "ccccc", { locale });
  });
  
  // 週ごとに日付を分割
  const weeks: Date[][] = [];
  let week: Date[] = [];
  
  dateRange.forEach((date) => {
    week.push(date);
    if (getDay(date) === 6) {
      weeks.push([...week]);
      week = [];
    }
  });
  
  if (week.length > 0) {
    weeks.push(week);
  }
  
  return (
    <div className={`p-3 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium">
          {format(currentMonth, "yyyy年MM月", { locale })}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="前月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="次月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="border-b border-gray-200 pb-2">
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((weekday, i) => (
            <div key={i} className="text-center text-xs text-gray-500">
              {weekday}
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((date, dateIndex) => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = selected ? isSameDay(date, selected) : false;
              
              return (
                <button
                  key={dateIndex}
                  onClick={() => onSelect?.(date)}
                  className={`
                    h-8 w-8 p-0 rounded-md text-sm
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