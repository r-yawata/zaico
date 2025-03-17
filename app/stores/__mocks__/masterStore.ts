import type { Material, Category, Manufacturer, Supplier } from '../../types';
import { Decimal } from 'decimal.js';

// Mock data
export const mockCategories: Category[] = [
  {
    id: 1,
    name: 'テストカテゴリ1',
    description: 'テスト用カテゴリ1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'テストカテゴリ2',
    description: 'テスト用カテゴリ2',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02')
  }
];

export const mockManufacturers: Manufacturer[] = [
  {
    id: 1,
    name: 'テストメーカー1',
    location: 'テスト工場1',
    contact: '03-1234-5678',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'テストメーカー2',
    location: 'テスト工場2',
    contact: '03-9876-5432',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02')
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'テスト仕入先1',
    contact: '03-1111-2222',
    address: '東京都千代田区1-1-1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'テスト仕入先2',
    contact: '03-3333-4444',
    address: '東京都新宿区1-1-1',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02')
  }
];

export const mockMaterials: Material[] = [
  {
    id: 1,
    name: 'テスト資材1',
    specification: 'テスト規格1',
    category_id: 1,
    category: mockCategories[0],
    manufacturer_id: 1,
    manufacturer: mockManufacturers[0],
    supplier_id: 1,
    supplier: mockSuppliers[0],
    unit_weight: '1.25',
    note: 'テスト備考1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'テスト資材2',
    specification: 'テスト規格2',
    category_id: 2,
    category: mockCategories[1],
    manufacturer_id: 2,
    manufacturer: mockManufacturers[1],
    supplier_id: 2,
    supplier: mockSuppliers[1],
    unit_weight: '2.50',
    note: 'テスト備考2',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02')
  }
];

// Simple mock functions
const fetchMaterials = async () => Promise.resolve();
const fetchCategories = async () => Promise.resolve();
const fetchManufacturers = async () => Promise.resolve();
const fetchSuppliers = async () => Promise.resolve();

const addMaterial = async (material: Partial<Material>) => {
  return {
    ...material,
    id: 3,
    created_at: new Date(),
    updated_at: new Date()
  };
};

const updateMaterial = async (id: number, data: Partial<Material>) => {
  const material = mockMaterials.find(m => m.id === id);
  if (!material) {
    throw new Error(`Material with id ${id} not found`);
  }
  return {
    ...material,
    ...data,
    updated_at: new Date()
  };
};

const deleteMaterial = async (id: number) => Promise.resolve();

// Mock Zustand store
export const mockMasterStoreFunctions = {
  addMaterial: jest.fn(),
  updateMaterial: jest.fn(),
  deleteMaterial: jest.fn(),
  fetchMaterials: jest.fn(),
  fetchCategories: jest.fn(),
  fetchManufacturers: jest.fn(),
  fetchSuppliers: jest.fn(),
};

export const useMasterStore = jest.fn(() => ({
  materials: mockMaterials,
  categories: mockCategories,
  manufacturers: mockManufacturers,
  suppliers: mockSuppliers,
  ...mockMasterStoreFunctions
}));
