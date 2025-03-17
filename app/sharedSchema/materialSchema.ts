import { z } from 'zod';

// 基本的な資材スキーマ
export const materialBaseSchema = z.object({
  name: z.string().min(1, "資材名は必須です"),
  specification: z.string().optional(),
  custom_attributes: z.record(z.any()).optional(),
  package_count: z.number().optional(),
  unit_weight: z.string().optional(), // 文字列として受け取り、Decimalに変換
  supplier_id: z.number(),
  manufacturer_id: z.number(),
  category_id: z.number(),
  note: z.string().optional(),
  category_name: z.string().optional(),
  manufacturer_name: z.string().optional(),
  supplier_name: z.string().optional(),
});

// 新規資材作成リクエスト
export const createMaterialSchema = materialBaseSchema;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

// 資材更新リクエスト
export const updateMaterialSchema = materialBaseSchema.partial();
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;

// レスポンススキーマ
export const materialSchema = materialBaseSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Material = z.infer<typeof materialSchema>;

// 一覧取得レスポンススキーマ
export const materialsSchema = z.array(materialSchema);
export type Materials = z.infer<typeof materialsSchema>;