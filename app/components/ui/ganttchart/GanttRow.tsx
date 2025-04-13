import React from "react"
import { cn } from "../../../lib/utils"
import type { Table } from "@tanstack/react-table"
import type { Task } from "./types"

interface GanttRowProps {
  index: number
  style: React.CSSProperties
  table: Table<Task>
  days: Date[]
  dayWidth: number
}

/**
 * ガントチャート行コンポーネント
 * react-windowで仮想化されたリストで使用される
 */
export const GanttRow = ({ index, style, table, days, dayWidth }: GanttRowProps) => {
  // ソート/フィルタリング後の行を取得
  const rows = table.getRowModel().rows
  
  // インデックスが範囲外の場合は何も表示しない
  if (index >= rows.length) return null
  
  const row = rows[index]
  const task = row.original

  // バーのスタイルを計算するヘルパー関数
  const getTaskBarStyle = (): React.CSSProperties | undefined => {
    // startDate または endDate が未定義の場合はスタイルを返さない
    if (!task.startDate || !task.endDate) {
      return undefined
    }

    // task の開始日/終了日が days 配列内のどのインデックスに対応するか検索
    const startIndex = days.findIndex((d) => d.getTime() === task.startDate!.getTime())
    const endIndex = days.findIndex((d) => d.getTime() === task.endDate!.getTime())

    // 開始日または終了日がガントチャートの表示期間外の場合
    // バーの描画開始/終了インデックスを計算 (表示範囲内に収める)
    const barStartIndex = Math.max(0, startIndex)
    // 終了日は表示範囲の最終日と比較
    const barEndIndex = endIndex === -1 ? days.length - 1 : Math.min(days.length - 1, endIndex)

    // 開始日が期間後にあり、バーが表示されない場合 or 終了日が期間前にある場合
    if (startIndex >= days.length || endIndex < 0) {
      return undefined
    }
    // 開始日が期間より前で、終了日も期間より前の場合
    if (startIndex < 0 && endIndex < 0) {
      return undefined
    }

    // バーの左端位置を計算
    // 開始日が期間より前の場合は、0番目の位置から開始
    const leftPosition = (startIndex < 0 ? 0 : barStartIndex) * dayWidth

    // バーの幅を計算
    // 開始日が期間より前の場合、0から終了インデックスまで
    // 終了日が期間より後の場合、開始インデックスから最終日まで
    const width = ((endIndex === -1 ? days.length - 1 : barEndIndex) - (startIndex < 0 ? -1 : barStartIndex)) * dayWidth

    // 丸角スタイルを決定
    const borderRadius = `${startIndex === barStartIndex && startIndex >= 0 ? "0.375rem" : "0"} ${
      endIndex === barEndIndex && endIndex !== -1 ? "0.375rem" : "0"
    } ${endIndex === barEndIndex && endIndex !== -1 ? "0.375rem" : "0"} ${
      startIndex === barStartIndex && startIndex >= 0 ? "0.375rem" : "0"
    }`

    return {
      position: "absolute",
      left: `${leftPosition}px`,
      width: `${width}px`,
      height: "2rem", // h-8相当
      top: "0.1rem", // top-1相当
      backgroundColor: "rgb(16 185 129)", // bg-emerald-500相当
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.75rem", // text-xs相当
      lineHeight: "1rem",
      borderRadius: borderRadius, // 計算した丸角を適用
      whiteSpace: 'nowrap', // テキストが折り返さないように
      overflow: 'hidden',   // はみ出したテキストを隠す
      textOverflow: 'ellipsis', // 省略記号(...)を表示
      paddingLeft: '0.25rem', // 少しパディングを追加
      paddingRight: '0.25rem',
    }
  }

  const taskBarStyle = getTaskBarStyle()

  return (
    // 各行の高さを style から適用し、背景色と罫線を設定
    <div
      className={cn("flex border-b border-gray-200 relative", index % 2 === 0 ? "bg-white" : "bg-gray-50")}
      style={style} // react-window から渡される style (高さと top を含む) を適用
    >
      {/* 日付グリッドの描画 */}
      {days.map((day, dayIndex) => (
        <div
          key={dayIndex}
          className={cn(
            "flex-none", // 縦罫線. border-r border-gray-200
            day.getDay() === 0 || day.getDay() === 6 ? "bg-gray-100" : "", // 土日の背景色と下部ボーダー
          )}
          style={{ width: dayWidth, height: "100%" }} // 各日の幅と、行の高さいっぱいに広がるように
        />
      ))}
      {/* タスクバーの描画 (スタイルが存在する場合のみ) */}
      {taskBarStyle && (
        <div style={taskBarStyle} title={task.status}> {/* title属性で全文表示 */}
          {task.status}
        </div>
      )}
    </div>
  )
} 