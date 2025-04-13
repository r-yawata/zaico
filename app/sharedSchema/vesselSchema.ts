import { z } from 'zod';
import { materialSchema } from './materialSchema';

// 基本的な容器スキーマ
export const vesselBaseSchema = z.object({
  name: z.string().min(1, "容器名は必須です"),
  weight: z.string(), // Decimalとして扱うため文字列で受け取る
});

// 新規容器作成リクエスト
export const createVesselSchema = vesselBaseSchema;
export type CreateVesselInput = z.infer<typeof createVesselSchema>;

// 容器更新リクエスト
export const updateVesselSchema = vesselBaseSchema.partial();
export type UpdateVesselInput = z.infer<typeof updateVesselSchema>;

// レスポンススキーマ
export const vesselSchema = vesselBaseSchema.extend({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // materialはオプショナルリレーション
  material: z.any().optional(), // 循環参照を避けるためany型を使用
});
export type Vessel = z.infer<typeof vesselSchema>;
// 後方互換性のために残します
export type VesselResponse = Vessel;

// 一覧取得レスポンススキーマ
export const vesselsSchema = z.array(vesselSchema);
export type Vessels = z.infer<typeof vesselsSchema>;
// 後方互換性のために残します
export const vesselsResponseSchema = vesselsSchema; 