import { create } from 'zustand';
import { Decimal } from 'decimal.js';
// import type { Supplier, Manufacturer, Category, Material, Vessel, StockInfoRule } from '../types';
import { 
  type Material, 
  materialsSchema, 
} from '../sharedSchema/materialSchema';
import { 
  type Supplier, 
  suppliersSchema, 
} from '../sharedSchema/supplierSchema';
import { 
  type Manufacturer, 
  manufacturersSchema, 
} from '../sharedSchema/manufacturerSchema';
import { 
  type Category, 
  categoriesSchema, 
} from '../sharedSchema/categorySchema';
import { 
  type Vessel, 
  vesselsSchema, 
} from '../sharedSchema/vesselSchema';
import { 
  apiRequest, 
  convertDatesToObjects, 
  convertAndAssertType, 
  convertArrayDatesToObjects,
  type SetStateFunction 
} from '../lib/api';

// APIのベースURL
const API_BASE_URL = 'http://localhost:3001/api';

// StockInfoRuleの型定義 - 後ほど適切なスキーマファイルに移動する予定
export interface StockInfoRule {
  id: number;
  material_id: number;
  material?: Material;
  allowed_error_percentage: Decimal;
}

// モックデータ（一部だけ残しておきます）
const mockVessels: Vessel[] = [
  {
    id: 1,
    name: 'ガラス容器A',
    weight: '5.3',
    material_id: 1,
    material: null as any, // 後で実際のデータで上書き
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    name: 'プラスチック容器A',
    weight: '4.2',
    material_id: 2,
    material: null as any, // 後で実際のデータで上書き
    created_at: new Date(),
    updated_at: new Date()
  }
];

const mockStockInfoRules: StockInfoRule[] = [
  {
    id: 1,
    material_id: 1,
    material: null as any, // 後で実際のデータで上書き
    allowed_error_percentage: new Decimal(0.5)
  },
  {
    id: 2,
    material_id: 2,
    material: null as any, // 後で実際のデータで上書き
    allowed_error_percentage: new Decimal(1.0)
  }
];

interface MasterState {
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  categories: Category[];
  materials: Material[];
  vessels: Vessel[];
  stock_info_rules: StockInfoRule[];
  loading: boolean;
  error: string | null;
  
  // 仕入先
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: number, supplierData: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
  
  // メーカー
  fetchManufacturers: () => Promise<void>;
  addManufacturer: (manufacturer: Omit<Manufacturer, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateManufacturer: (id: number, manufacturerData: Partial<Manufacturer>) => Promise<void>;
  deleteManufacturer: (id: number) => Promise<void>;
  
  // カテゴリー
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (id: number, categoryData: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // 資材
  fetchMaterials: () => Promise<void>;
  addMaterial: (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMaterial: (id: number, materialData: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: number) => Promise<void>;
  
  // 容器
  fetchVessels: () => Promise<void>;
  addVessel: (vessel: Omit<Vessel, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateVessel: (id: number, vesselData: Partial<Vessel>) => Promise<void>;
  deleteVessel: (id: number) => Promise<void>;
  
  // 在庫情報ルール
  fetchStockInfoRules: () => Promise<void>;
  addStockInfoRule: (rule: Omit<StockInfoRule, 'id'>) => Promise<void>;
  updateStockInfoRule: (id: number, ruleData: Partial<StockInfoRule>) => Promise<void>;
  deleteStockInfoRule: (id: number) => Promise<void>;
}

export const useMasterStore = create<MasterState>((set, get) => ({
  suppliers: [],
  manufacturers: [],
  categories: [],
  materials: [],
  vessels: mockVessels,
  stock_info_rules: mockStockInfoRules,
  loading: false,
  error: null,
  
  // 仕入先
  fetchSuppliers: async () => {
    await apiRequest({
      endpoint: '/suppliers',
      errorMessage: '仕入先データの取得に失敗しました',
      logPrefix: '仕入先データ取得',
      transformResponse: (data) => convertArrayDatesToObjects<Supplier>(data),
      onSuccess: (suppliers: Supplier[], set: SetStateFunction) => set({ suppliers, loading: false })
    }, set);
  },
  
  addSupplier: async (supplier) => {
    await apiRequest({
      endpoint: '/suppliers',
      method: 'POST',
      data: supplier,
      errorMessage: '仕入先の追加に失敗しました',
      logPrefix: '仕入先追加',
      transformResponse: (data) => convertAndAssertType<Supplier>(data),
      onSuccess: (newSupplier: Supplier, set: SetStateFunction) => set((state: MasterState) => ({ 
        suppliers: [...state.suppliers, newSupplier], 
        loading: false 
      }))
    }, set);
  },
  
  updateSupplier: async (id, supplierData) => {
    await apiRequest({
      endpoint: `/suppliers/${id}`,
      method: 'PUT',
      data: supplierData,
      errorMessage: '仕入先の更新に失敗しました',
      logPrefix: '仕入先更新',
      transformResponse: (data) => convertAndAssertType<Supplier>(data),
      onSuccess: (updatedSupplier: Supplier, set: SetStateFunction) => set((state: MasterState) => ({
        suppliers: state.suppliers.map(supplier => 
          supplier.id === id ? updatedSupplier : supplier
        ),
        loading: false
      }))
    }, set);
  },
  
  deleteSupplier: async (id) => {
    await apiRequest({
      endpoint: `/suppliers/${id}`,
      method: 'DELETE',
      errorMessage: '仕入先の削除に失敗しました',
      logPrefix: '仕入先削除',
      onSuccess: (_: null, set: SetStateFunction) => set((state: MasterState) => ({
        suppliers: state.suppliers.filter(supplier => supplier.id !== id),
        loading: false
      }))
    }, set);
  },
  
  // メーカー
  fetchManufacturers: async () => {
    await apiRequest({
      endpoint: '/manufacturers',
      errorMessage: 'メーカーデータの取得に失敗しました',
      logPrefix: 'メーカーデータ取得',
      transformResponse: (data) => convertArrayDatesToObjects<Manufacturer>(data),
      onSuccess: (manufacturers: Manufacturer[], set: SetStateFunction) => set({ manufacturers, loading: false })
    }, set);
  },
  
  addManufacturer: async (manufacturer) => {
    await apiRequest({
      endpoint: '/manufacturers',
      method: 'POST',
      data: manufacturer,
      errorMessage: 'メーカーの追加に失敗しました',
      logPrefix: 'メーカー追加',
      transformResponse: (data) => convertAndAssertType<Manufacturer>(data),
      onSuccess: (newManufacturer: Manufacturer, set: SetStateFunction) => set((state: MasterState) => ({ 
        manufacturers: [...state.manufacturers, newManufacturer], 
        loading: false 
      }))
    }, set);
  },
  
  updateManufacturer: async (id, manufacturerData) => {
    await apiRequest({
      endpoint: `/manufacturers/${id}`,
      method: 'PUT',
      data: manufacturerData,
      errorMessage: 'メーカーの更新に失敗しました',
      logPrefix: 'メーカー更新',
      transformResponse: (data) => convertAndAssertType<Manufacturer>(data),
      onSuccess: (updatedManufacturer: Manufacturer, set: SetStateFunction) => set((state: MasterState) => ({
        manufacturers: state.manufacturers.map(manufacturer => 
          manufacturer.id === id ? updatedManufacturer : manufacturer
        ),
        loading: false
      }))
    }, set);
  },
  
  deleteManufacturer: async (id) => {
    await apiRequest({
      endpoint: `/manufacturers/${id}`,
      method: 'DELETE',
      errorMessage: 'メーカーの削除に失敗しました',
      logPrefix: 'メーカー削除',
      onSuccess: (_: null, set: SetStateFunction) => set((state: MasterState) => ({
        manufacturers: state.manufacturers.filter(manufacturer => manufacturer.id !== id),
        loading: false
      }))
    }, set);
  },
  
  // カテゴリー
  fetchCategories: async () => {
    await apiRequest({
      endpoint: '/categories',
      errorMessage: 'カテゴリデータの取得に失敗しました',
      logPrefix: 'カテゴリデータ取得',
      transformResponse: (data) => convertArrayDatesToObjects<Category>(data),
      onSuccess: (categories: Category[], set: SetStateFunction) => set({ categories, loading: false })
    }, set);
  },
  
  addCategory: async (category) => {
    await apiRequest({
      endpoint: '/categories',
      method: 'POST',
      data: category,
      errorMessage: 'カテゴリの追加に失敗しました',
      logPrefix: 'カテゴリ追加',
      transformResponse: (data) => convertAndAssertType<Category>(data),
      onSuccess: (newCategory: Category, set: SetStateFunction) => set((state: MasterState) => ({ 
        categories: [...state.categories, newCategory], 
        loading: false 
      }))
    }, set);
  },
  
  updateCategory: async (id, categoryData) => {
    await apiRequest({
      endpoint: `/categories/${id}`,
      method: 'PUT',
      data: categoryData,
      errorMessage: 'カテゴリの更新に失敗しました',
      logPrefix: 'カテゴリ更新',
      transformResponse: (data) => convertAndAssertType<Category>(data),
      onSuccess: (updatedCategory: Category, set: SetStateFunction) => set((state: MasterState) => ({
        categories: state.categories.map(category => 
          category.id === id ? updatedCategory : category
        ),
        loading: false
      }))
    }, set);
  },
  
  deleteCategory: async (id) => {
    await apiRequest({
      endpoint: `/categories/${id}`,
      method: 'DELETE',
      errorMessage: 'カテゴリの削除に失敗しました',
      logPrefix: 'カテゴリ削除',
      onSuccess: (_: null, set: SetStateFunction) => set((state: MasterState) => ({
        categories: state.categories.filter(category => category.id !== id),
        loading: false
      }))
    }, set);
  },
  
  // 資材
  fetchMaterials: async () => {
    await apiRequest({
      endpoint: '/materials',
      errorMessage: '資材データの取得に失敗しました',
      logPrefix: '資材データ取得',
      transformResponse: (data:any) => {
        // その後で変換
        const materials = data.materials.map((material: Material) => ({
          ...material,
          created_at: new Date(material.created_at),
          updated_at: new Date(material.updated_at)
        }));
        return {
          materials,
          categories: data.categories,
          suppliers: data.suppliers,
          manufacturers: data.manufacturers
        };
      },
      onSuccess: (data, set) => set({ 
        materials: data.materials, 
        categories: data.categories, 
        suppliers: data.suppliers, 
        manufacturers: data.manufacturers, 
        loading: false 
      })
    }, set);
  },
  
  // 容器
  fetchVessels: async () => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  addVessel: async (vessel) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      const newVessel: Vessel = {
        ...vessel,
        id: Math.max(0, ...get().vessels.map(v => v.id)) + 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      set(state => ({
        vessels: [...state.vessels, newVessel],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  updateVessel: async (id, vesselData) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set(state => ({
        vessels: state.vessels.map(vessel =>
          vessel.id === id
            ? { ...vessel, ...vesselData, updated_at: new Date() }
            : vessel
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  deleteVessel: async (id) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set(state => ({
        vessels: state.vessels.filter(vessel => vessel.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  // 在庫情報ルール
  fetchStockInfoRules: async () => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  addStockInfoRule: async (rule) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      const newRule: StockInfoRule = {
        ...rule,
        id: Math.max(0, ...get().stock_info_rules.map(r => r.id)) + 1
      };
      set(state => ({
        stock_info_rules: [...state.stock_info_rules, newRule],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  updateStockInfoRule: async (id, ruleData) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set(state => ({
        stock_info_rules: state.stock_info_rules.map(rule =>
          rule.id === id
            ? { ...rule, ...ruleData }
            : rule
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  deleteStockInfoRule: async (id) => {
    set({ loading: true, error: null });
    try {
      // ここで実際のAPI実装ができたら修正
      set(state => ({
        stock_info_rules: state.stock_info_rules.filter(rule => rule.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  addMaterial: async (material) => {
    const materialToSend = {
      ...material,
      unit_weight: material.unit_weight ? material.unit_weight.toString() : undefined,
    };
    
    await apiRequest({
      endpoint: '/materials',
      method: 'POST',
      data: materialToSend,
      errorMessage: '資材の追加に失敗しました',
      logPrefix: '資材追加',
      transformResponse: (data) => ({
        ...data,
        unit_weight: data.unit_weight, // ? new Decimal(data.unit_weight) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      }),
      onSuccess: (newMaterial, set) => set((state: MasterState) => ({ 
        materials: [...state.materials, newMaterial], 
        loading: false 
      }))
    }, set);
  },
  
  updateMaterial: async (id, materialData) => {
    // Decimalをstringに変換
    const materialToSend = {
      ...materialData,
      unit_weight: materialData.unit_weight ? materialData.unit_weight.toString() : undefined,
    };
    
    await apiRequest({
      endpoint: `/materials/${id}`,
      method: 'PUT',
      data: materialToSend,
      errorMessage: '資材の更新に失敗しました',
      logPrefix: '資材更新',
      transformResponse: (data) => ({
        ...data,
        unit_weight: data.unit_weight, // ? new Decimal(data.unit_weight) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      }),
      onSuccess: (updatedMaterial, set) => set((state: MasterState) => ({
        materials: state.materials.map(material => 
          material.id === id ? updatedMaterial : material
        ),
        loading: false
      }))
    }, set);
  },
  
  deleteMaterial: async (id) => {
    await apiRequest({
      endpoint: `/materials/${id}`,
      method: 'DELETE',
      errorMessage: '資材の削除に失敗しました',
      logPrefix: '資材削除',
      onSuccess: (_, set) => set((state: MasterState) => ({
        materials: state.materials.filter(material => material.id !== id),
        loading: false
      }))
    }, set);
  },
}));
