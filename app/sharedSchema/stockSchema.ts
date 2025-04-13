import { z } from 'zod';

// 基本的な在庫スキーマ
export const stockBaseSchema = z.object({
  productName: z.string().min(1, "品名は必須です"),
  lot: z.string().min(1, "ロット番号は必須です"),
  status: z.string(),
  registrationDate: z.string().optional(),
  updateDate: z.string().optional(),
  remarks: z.string().optional(),
  expirationDate: z.string(),
  storageDate: z.string(),
  currentWeight: z.string(), // Decimalは文字列として受け取る
  netWeight: z.string(),
  vesselWeight: z.string(),
  inboundWeight: z.string(),
  materialId: z.number(),
  vesselId: z.number(),
  creatorId: z.number(),
  extraConfig: z.record(z.any()).optional(),
  parentStockId: z.number().optional(),
});

// 新規在庫登録リクエスト
export const createStockSchema = stockBaseSchema;
export type CreateStockInput = z.infer<typeof createStockSchema>;

// 在庫更新リクエスト
export const updateStockSchema = stockBaseSchema.partial();
export type UpdateStockInput = z.infer<typeof updateStockSchema>;

// レスポンススキーマ
export const stockSchema = stockBaseSchema.extend({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Stock = z.infer<typeof stockSchema>;

// 一覧取得レスポンススキーマ
export const stocksSchema = z.array(stockSchema);
export type Stocks = z.infer<typeof stocksSchema>; 