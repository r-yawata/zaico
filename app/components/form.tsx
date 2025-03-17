import type React from "react"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"

export default function SampleRegistrationForm() {
  const [formData, setFormData] = useState({
    sampleId: "",
    sampleName: "",
    status: "未収納",
    sampleType: "大腸菌",
    containerType: "2 mLセラムチューブ",
    creationDate: "",
    locationName: "指定なし",
    parentSampleId: "",
    cellCount: "",
    liquidVolume: "1.0",
    sampleCount: "1",
    note: "",
    customField1: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Here you would typically send the data to your API
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="sampleId" className="text-base font-normal">
          サンプルID
        </Label>
        <Input
          id="sampleId"
          placeholder="未入力時自動入力"
          value={formData.sampleId}
          onChange={(e) => handleChange("sampleId", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="sampleName" className="text-base font-normal">
          サンプル名
        </Label>
        <Input
          id="sampleName"
          value={formData.sampleName}
          onChange={(e) => handleChange("sampleName", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="status" className="text-base font-normal">
          ステータス
        </Label>
        <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="ステータスを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="未収納">未収納</SelectItem>
            <SelectItem value="収納済">収納済</SelectItem>
            <SelectItem value="使用中">使用中</SelectItem>
            <SelectItem value="使用済">使用済</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="sampleType" className="text-base font-normal">
          検体タイプ
        </Label>
        <Select value={formData.sampleType} onValueChange={(value) => handleChange("sampleType", value)}>
          <SelectTrigger id="sampleType">
            <SelectValue placeholder="検体タイプを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="大腸菌">大腸菌</SelectItem>
            <SelectItem value="血液">血液</SelectItem>
            <SelectItem value="組織">組織</SelectItem>
            <SelectItem value="細胞株">細胞株</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="containerType" className="text-base font-normal">
          容器タイプ
        </Label>
        <Select value={formData.containerType} onValueChange={(value) => handleChange("containerType", value)}>
          <SelectTrigger id="containerType">
            <SelectValue placeholder="容器タイプを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2 mLセラムチューブ">2 mLセラムチューブ</SelectItem>
            <SelectItem value="15 mL遠沈管">15 mL遠沈管</SelectItem>
            <SelectItem value="50 mL遠沈管">50 mL遠沈管</SelectItem>
            <SelectItem value="マイクロプレート">マイクロプレート</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="creationDate" className="text-base font-normal">
          作成日
        </Label>
        <Input
          id="creationDate"
          type="date"
          value={formData.creationDate}
          onChange={(e) => handleChange("creationDate", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="locationName" className="text-base font-normal">
          拠点名<span className="text-red-500">*</span>
        </Label>
        <Select value={formData.locationName} onValueChange={(value) => handleChange("locationName", value)} required>
          <SelectTrigger id="locationName">
            <SelectValue placeholder="拠点名を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="指定なし">指定なし</SelectItem>
            <SelectItem value="東京">東京</SelectItem>
            <SelectItem value="大阪">大阪</SelectItem>
            <SelectItem value="福岡">福岡</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="parentSampleId" className="text-base font-normal">
          親サンプルID
        </Label>
        <Input
          id="parentSampleId"
          value={formData.parentSampleId}
          onChange={(e) => handleChange("parentSampleId", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="cellCount" className="text-base font-normal">
          細胞数
        </Label>
        <Input id="cellCount" value={formData.cellCount} onChange={(e) => handleChange("cellCount", e.target.value)} />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="liquidVolume" className="text-base font-normal">
          液量(mL)
        </Label>
        <Input
          id="liquidVolume"
          type="number"
          step="0.1"
          value={formData.liquidVolume}
          onChange={(e) => handleChange("liquidVolume", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="sampleCount" className="text-base font-normal">
          作成本数
        </Label>
        <Select value={formData.sampleCount} onValueChange={(value) => handleChange("sampleCount", value)}>
          <SelectTrigger id="sampleCount">
            <SelectValue placeholder="作成本数を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-start">
        <Label htmlFor="note" className="text-base font-normal pt-2">
          備考
        </Label>
        <Textarea id="note" rows={4} value={formData.note} onChange={(e) => handleChange("note", e.target.value)} />
      </div>

      <div className="grid grid-cols-[1fr,2fr] gap-4 items-center">
        <Label htmlFor="customField1" className="text-base font-normal">
          カスタム項目1
        </Label>
        <Input
          id="customField1"
          value={formData.customField1}
          onChange={(e) => handleChange("customField1", e.target.value)}
        />
      </div>

      <div className="flex justify-center pt-4">
        <Button type="submit" className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white">
          登録
        </Button>
      </div>
    </form>
  )
}

