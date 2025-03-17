import { z } from 'zod';

// 基本的なサプライヤースキーマ
export const supplierBaseSchema = z.object({
  name: z.string().min(1, "仕入先名は必須です"),
  contact: z.string().optional(),
  address: z.string().optional(),
});

// 新規サプライヤー作成リクエスト
export const createSupplierSchema = supplierBaseSchema;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

// サプライヤー更新リクエスト
export const updateSupplierSchema = supplierBaseSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// レスポンススキーマ
export const supplierSchema = supplierBaseSchema.extend({
  id: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Supplier = z.infer<typeof supplierSchema>;
// 後方互換性のために残します
export type SupplierResponse = Supplier;

// 一覧取得レスポンススキーマ
export const suppliersSchema = z.array(supplierSchema);
export type Suppliers = z.infer<typeof suppliersSchema>;
// 後方互換性のために残します
// export const suppliersResponseSchema = suppliersSchema; 