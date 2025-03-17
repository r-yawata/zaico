// import {
//   createMaterialSchema,
//   updateMaterialSchema,
//   type CreateMaterialInput,
//   type UpdateMaterialInput,
//   type Material
// } from '../sharedSchema/materialSchema';

// const API_BASE_URL = 'http://localhost:3001/api';

// export const materialApi = {
//   // 資材一覧取得
//   async getMaterials(): Promise<Material[]> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/materials`);
//       if (!response.ok) {
//         throw new Error('資材データの取得に失敗しました');
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   // 資材詳細取得
//   async getMaterial(id: number): Promise<Material> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/materials/${id}`);
//       if (!response.ok) {
//         throw new Error('資材データの取得に失敗しました');
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   // 資材作成
//   async createMaterial(material: CreateMaterialInput): Promise<Material> {
//     try {
//       // バリデーション
//       const validatedData = createMaterialSchema.parse(material);
      
//       const response = await fetch(`${API_BASE_URL}/materials`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(validatedData),
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || '資材の作成に失敗しました');
//       }
      
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   // 資材更新
//   async updateMaterial(id: number, material: UpdateMaterialInput): Promise<Material> {
//     try {
//       // バリデーション
//       const validatedData = updateMaterialSchema.parse(material);
      
//       const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(validatedData),
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || '資材の更新に失敗しました');
//       }
      
//       return await response.json();
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },

//   // 資材削除
//   async deleteMaterial(id: number): Promise<void> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
//         method: 'DELETE',
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || '資材の削除に失敗しました');
//       }
//     } catch (error) {
//       console.error('API Error:', error);
//       throw error;
//     }
//   },
// };
