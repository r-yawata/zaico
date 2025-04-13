/**
 * 2つの日付の間にある全ての日付を配列として返す
 */
export const getDaysArray = (start: Date, end: Date): Date[] => {
  const arr = []
  const dt = new Date(start)
  while (dt <= end) {
    arr.push(new Date(dt))
    dt.setDate(dt.getDate() + 1)
  }
  return arr
}

/**
 * 日付を「日」のフォーマットで返す
 */
export const formatDate = (date: Date): string => {
  return date.getDate().toString()
}

/**
 * 日付を「yyyy年MM月」のフォーマットで返す
 */
export const formatMonth = (date: Date, locale = "ja-JP"): string => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

/**
 * 2つの日付が同じ月かどうかを判定
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}

/**
 * 日付の配列を月ごとにグループ化
 */
export const groupByMonth = (days: Date[]): { [key: string]: Date[] } => {
  const months: { [key: string]: Date[] } = {}
  
  days.forEach((day) => {
    const monthKey = `${day.getFullYear()}-${day.getMonth()}`
    if (!months[monthKey]) {
      months[monthKey] = []
    }
    months[monthKey].push(day)
  })
  
  return months
} 