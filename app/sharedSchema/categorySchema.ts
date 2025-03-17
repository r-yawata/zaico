import { z } from 'zod';

// 基本的なカテゴリスキーマ
export const categoryBaseSchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  description: z.string().optional(),
});

// 新規カテゴリ作成リクエスト
export const createCategorySchema = categoryBaseSchema;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// カテゴリ更新リクエスト
export const updateCategorySchema = categoryBaseSchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// レスポンススキーマ
export const categorySchema = categoryBaseSchema.extend({
  id: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Category = z.infer<typeof categorySchema>;
// 後方互換性のために残します
export type CategoryResponse = Category;

// 一覧取得レスポンススキーマ
export const categoriesSchema = z.array(categorySchema);
export type Categories = z.infer<typeof categoriesSchema>;
// 後方互換性のために残します
// export const categoriesResponseSchema = categoriesSchema; 