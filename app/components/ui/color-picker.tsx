import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"

interface ColorPickerProps {
  onApply?: (color: string) => void
  onCancel?: () => void
  defaultColor?: string
}

export default function ColorPicker({ onApply, onCancel, defaultColor = "#000000" }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(defaultColor)
  const [previousColor, setPreviousColor] = useState(defaultColor)
  const [showManualPicker, setShowManualPicker] = useState(false)

  // Color palette definition - matches the image with various hues and shades
  const colorPalette = [
    // Black to white column
    ["#000000", "#FFFFFF", "#F5F5F5", "#E0E0E0", "#BDBDBD", "#9E9E9E", "#757575", "#616161", "#424242", "#212121"],
    // Red column
    ["#F44336", "#FFEBEE", "#FFCDD2", "#EF9A9A", "#E57373", "#EF5350", "#F44336", "#E53935", "#D32F2F", "#C62828"],
    // Pink column
    ["#E91E63", "#FCE4EC", "#F8BBD0", "#F48FB1", "#F06292", "#EC407A", "#E91E63", "#D81B60", "#C2185B", "#AD1457"],
    // Purple column
    ["#9C27B0", "#F3E5F5", "#E1BEE7", "#CE93D8", "#BA68C8", "#AB47BC", "#9C27B0", "#8E24AA", "#7B1FA2", "#6A1B9A"],
    // Deep Purple column
    ["#673AB7", "#EDE7F6", "#D1C4E9", "#B39DDB", "#9575CD", "#7E57C2", "#673AB7", "#5E35B1", "#512DA8", "#4527A0"],
    // Blue column
    ["#2196F3", "#E3F2FD", "#BBDEFB", "#90CAF9", "#64B5F6", "#42A5F5", "#2196F3", "#1E88E5", "#1976D2", "#1565C0"],
    // Light Blue column
    ["#03A9F4", "#E1F5FE", "#B3E5FC", "#81D4FA", "#4FC3F7", "#29B6F6", "#03A9F4", "#039BE5", "#0288D1", "#0277BD"],
    // Teal column
    ["#009688", "#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A", "#009688", "#00897B", "#00796B", "#00695C"],
    // Green column
    ["#4CAF50", "#E8F5E9", "#C8E6C9", "#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32"],
    // Yellow column
    ["#FFEB3B", "#FFFDE7", "#FFF9C4", "#FFF59D", "#FFF176", "#FFEE58", "#FFEB3B", "#FDD835", "#FBC02D", "#F9A825"],
  ]

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleApply = () => {
    setPreviousColor(selectedColor)
    if (onApply) onApply(selectedColor)
  }

  const handleCancel = () => {
    setSelectedColor(previousColor)
    if (onCancel) onCancel()
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
      {showManualPicker ? (
        <div className="space-y-4">
          {/* カラープレビュー */}
          {/* <div 
            className="w-full h-20 rounded-md shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
           */}
          {/* カラー入力エリア */}
          <div className="flex flex-col gap-3">
            {/* カラーピッカー */}
            <div className="w-full">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-12 p-1 cursor-pointer"
              />
            </div>
            
            {/* HEXコード入力 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20">HEXコード:</span>
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-10 gap-0">
          {colorPalette.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-0">
              {column.map((color, rowIndex) => (
                <button
                  key={`${colIndex}-${rowIndex}`}
                  className="w-full aspect-square transition-all relative"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Select color ${color}`}
                >
                  {selectedColor === color && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: "0 0 0 1px white, 0 0 3px 1px rgba(0,0,0,0.7)",
                        zIndex: 10,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        {/* 左下のモード切替アイコン */}
        <button
          style={{ backgroundColor: selectedColor }}
          onClick={() => setShowManualPicker(!showManualPicker)}
          className="w-12 h-12 rounded-md border border-gray-200 flex items-center justify-center transition-all hover:bg-gray-50"
          aria-label={showManualPicker ? "パレットモードに切り替え" : "マニュアルモードに切り替え"}
        >
          {/* {showManualPicker ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="5" y="5" rx="1" />
              <rect width="3" height="3" x="7" y="7" rx="0.5" />
              <rect width="3" height="3" x="14" y="7" rx="0.5" />
              <rect width="3" height="3" x="7" y="14" rx="0.5" />
              <rect width="3" height="3" x="14" y="14" rx="0.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="10.5" r="2.5" />
              <circle cx="9.5" cy="10.5" r="2.5" />
              <circle cx="5.5" cy="14.5" r="2.5" />
              <circle cx="13.5" cy="14.5" r="2.5" />
            </svg>
          )} */}
        </button>
        
        {/* 右側のボタン */}
        <div className="flex gap-4">
          <Button
            onClick={handleApply}
            className="bg-transparent hover:bg-transparent text-black-500 hover:text-black-600"
          >
            更新
          </Button>
          <Button onClick={handleCancel} variant="ghost" className="text-white-100">
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  )
} 