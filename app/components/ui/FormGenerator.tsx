import * as React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import * as Select from "@radix-ui/react-select";
import { cn } from "../../lib/utils";
import { Check, ChevronDown } from "lucide-react";

// フォームフィールドの型定義
export type FormFieldConfig = {
  id: string;
  label: string;
  elementType: 
    | 'input' 
    | 'textarea' 
    | 'select' 
    | 'date' 
    | 'number' 
    | 'radio' 
    | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  width?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  suffix?: string;
  autoFocus?: boolean;
  rows?: number;
};

// フォームデータの型
export type FormData = Record<string, string>;

// フォームジェネレーターのプロパティ
export interface FormGeneratorProps {
  fields: FormFieldConfig[];
  initialData?: FormData;
  className?: string;
  layout?: 'grid' | 'vertical' | 'horizontal';
  inputWidth?: string;
  onSubmit?: (data: FormData) => void;
  onChange?: (field: string, value: string) => void;
}

export const FormGenerator: React.FC<FormGeneratorProps> = ({
  fields,
  initialData = {},
  className,
  layout = 'horizontal',
  inputWidth = 'w-full',
  onChange,
  onSubmit,
}) => {
  // フォームデータの状態
  const [formData, setFormData] = useState<FormData>(() => {
    // 初期データとデフォルト値をマージ
    const data: FormData = {};
    fields.forEach(field => {
      data[field.id] = initialData[field.id] !== undefined 
        ? initialData[field.id] 
        : (field.defaultValue || '');
    });
    return data;
  });

  // メモ化したフィールド初期化
  const initialFormData = useMemo(() => {
    const data: FormData = {};
    fields.forEach(field => {
      data[field.id] = initialData[field.id] !== undefined 
        ? initialData[field.id] 
        : (field.defaultValue || '');
    });
    return data;
  }, [fields, initialData]);

  // 初期データが変更されたときにフォームデータを更新
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  // コールバック関数のメモ化
  const handleChange = useCallback((fieldId: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // 親コンポーネントのonChangeハンドラーを呼び出す
    if (onChange) {
      onChange(fieldId, value);
    }
  }, [onChange]);

  // フォーム送信ハンドラー
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // フィールドのレンダリング
  const renderField = (field: FormFieldConfig) => {
    const { 
      id, 
      label, 
      elementType, 
      required, 
      placeholder, 
      options, 
      disabled, 
      min, 
      max, 
      step, 
      suffix,
      autoFocus,
      rows,
      width
    } = field;

    // ラベル要素
    const labelElement = (
      <Label 
        htmlFor={id} 
        className="text-sm font-medium"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
    );

    // 入力要素のラッパークラス
    const inputWrapperClass = cn(
      width || inputWidth,
      "flex-1"
    );

    // 入力要素
    let inputElement;

    switch (elementType) {
      case 'input':
        inputElement = (
          <Input
            id={id}
            value={formData[id] || ''}
            onChange={(e) => handleChange(id, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            className="w-full"
          />
        );
        break;

      case 'textarea':
        inputElement = (
          <Textarea
            id={id}
            value={formData[id] || ''}
            onChange={(e) => handleChange(id, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows || 4}
            className="w-full"
          />
        );
        break;

      case 'select':
        if (!options || options.length === 0) {
          console.error(`Select field ${id} has no options`);
          return null;
        }
        
        inputElement = (
          <div className="relative w-full">
            <Select.Root 
              value={formData[id]} 
              onValueChange={(value) => handleChange(id, value)}
              disabled={disabled}
            >
              <Select.Trigger 
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-400 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={label}
              >
                <Select.Value placeholder={placeholder || "選択してください"} />
                <Select.Icon className="h-4 w-4 opacity-50 flex items-center justify-center">
                  <ChevronDown className="h-4 w-4" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-md shadow-md z-50 border border-gray-400">
                  <Select.Viewport className="p-1">
                    {options.map((option) => (
                      <Select.Item 
                        key={option.value} 
                        value={option.value}
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                        <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        );
        break;

      case 'date':
        inputElement = (
          <Input
            id={id}
            type="date"
            value={formData[id] || ''}
            onChange={(e) => handleChange(id, e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full"
          />
        );
        break;

      case 'number':
        inputElement = (
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step || "1"}
            value={formData[id] || ''}
            onChange={(e) => handleChange(id, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full"
          />
        );
        break;

      case 'radio':
        if (!options || options.length === 0) {
          console.error(`Radio field ${id} has no options`);
          return null;
        }
        
        inputElement = (
          <div className="flex space-x-4">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${id}-${option.value}`}
                  name={id}
                  value={option.value}
                  checked={formData[id] === option.value}
                  onChange={(e) => handleChange(id, e.target.value)}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={disabled}
                />
                <label htmlFor={`${id}-${option.value}`} className="text-sm font-medium text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        break;

      case 'checkbox':
        inputElement = (
          <div className="flex items-center h-5">
            <input
              id={id}
              type="checkbox"
              checked={formData[id] === 'true'}
              onChange={(e) => handleChange(id, e.target.checked ? 'true' : 'false')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
        );
        break;

      default:
        inputElement = (
          <Input
            id={id}
            value={formData[id] || ''}
            onChange={(e) => handleChange(id, e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full"
          />
        );
    }

    // サフィックス要素
    const suffixElement = suffix ? (
      <span className="text-sm text-gray-500 ml-2">{suffix}</span>
    ) : null;

    // レイアウトに応じたフィールドのレンダリング
    if (layout === 'horizontal') {
      return (
        <div key={id} className="flex items-center space-x-4">
          <div className="w-1/3">
            {labelElement}
          </div>
          <div className="w-2/3 flex items-center">
            <div className={inputWrapperClass}>
              {inputElement}
            </div>
            {suffixElement}
          </div>
        </div>
      );
    } else if (layout === 'grid') {
      return (
        <div key={id} className="space-y-2">
          {labelElement}
          <div className="flex items-center w-full">
            {inputElement}
            {suffixElement}
          </div>
        </div>
      );
    } else {
      return (
        <div key={id} className="space-y-2">
          {labelElement}
          <div className="flex items-center w-full">
            {inputElement}
            {suffixElement}
          </div>
        </div>
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className={cn("space-y-6", layout === 'horizontal' && "space-y-4")}>
        {fields.map(renderField)}
      </div>
    </form>
  );
};

export default FormGenerator; 