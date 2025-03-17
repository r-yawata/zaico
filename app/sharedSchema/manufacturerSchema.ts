import { z } from 'zod';

// 基本的なメーカースキーマ
export const manufacturerBaseSchema = z.object({
  name: z.string().min(1, "メーカー名は必須です"),
  location: z.string().optional(),
  contact: z.string().optional(),
});

// 新規メーカー作成リクエスト
export const createManufacturerSchema = manufacturerBaseSchema;
export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>;

// メーカー更新リクエスト
export const updateManufacturerSchema = manufacturerBaseSchema.partial();
export type UpdateManufacturerInput = z.infer<typeof updateManufacturerSchema>;

// レスポンススキーマ
export const manufacturerSchema = manufacturerBaseSchema.extend({
  id: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Manufacturer = z.infer<typeof manufacturerSchema>;
// 後方互換性のために残します
export type ManufacturerResponse = Manufacturer;

// 一覧取得レスポンススキーマ
export const manufacturersSchema = z.array(manufacturerSchema);
export type Manufacturers = z.infer<typeof manufacturersSchema>;
// 後方互換性のために残します
// export const manufacturersResponseSchema = manufacturersSchema; 