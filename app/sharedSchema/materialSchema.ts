import { z } from 'zod';

// 基本的な資材スキーマ
export const materialBaseSchema = z.object({
  name: z.string().min(1, "資材名は必須です"),
  specification: z.string().optional(),
  customAttributes: z.record(z.any()).optional(),
  packageCount: z.number().optional(),
  unitWeight: z.string().optional(), // 文字列として受け取り、Decimalに変換
  supplierId: z.number(),
  manufacturerId: z.number(),
  categoryId: z.number(),
  vesselId: z.number().optional(), // 容器ID追加
  note: z.string().optional(),
  categoryName: z.string().optional(),
  manufacturerName: z.string().optional(),
  supplierName: z.string().optional(),
  enableLotControl: z.boolean().default(false),
  enableWeightControl: z.boolean().default(false),
});

// 新規資材作成リクエスト
export const createMaterialSchema = z.object({
  name: z.string().min(1),
  specification: z.string().optional(),
  customAttributes: z.record(z.string(), z.any()).optional(),
  packageCount: z.number().optional(),
  unitWeight: z.string().optional(),
  supplierId: z.number(),
  manufacturerId: z.number(),
  categoryId: z.number(),
  vesselId: z.number().optional(), // 容器ID追加
  note: z.string().optional(),
  enableLotControl: z.boolean().default(false),
  enableWeightControl: z.boolean().default(false),
});
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

// 資材更新リクエスト
export const updateMaterialSchema = materialBaseSchema.partial();
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;

// レスポンススキーマ
export const materialSchema = materialBaseSchema.extend({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Material = z.infer<typeof materialSchema>;

// 一覧取得レスポンススキーマ
export const materialsSchema = z.array(materialSchema);
export type Materials = z.infer<typeof materialsSchema>;