import { create } from 'zustand';
import { Decimal } from 'decimal.js';
import type { Stock } from '../types';
import { SampleStatus } from '../types';

// モックデータ用の日付を作成
const today = new Date();
const expirationDate = new Date();
expirationDate.setFullYear(today.getFullYear() + 1);
const storageDate = new Date();
storageDate.setMonth(today.getMonth() + 6);

// モックデータ
const mockStocks: Stock[] = [
  {
    id: 1,
    product_name: 'テスト製品A',
    lot: 'LOT20240301',
    status: SampleStatus.STORED,
    registration_date: new Date('2024-03-01'),
    update_date: new Date('2024-03-01'),
    remarks: 'テスト用サンプル',
    expiration_date: expirationDate,
    storage_date: storageDate,
    current_weight: new Decimal(100.5),
    net_weight: new Decimal(95.2),
    vessel_weight: new Decimal(5.3),
    inbound_weight: new Decimal(100.5),
    material_id: 1,
    material: {
      id: 1,
      name: 'テスト資材A',
      specification: '規格A',
      category_id: 1,
      category: {
        id: 1,
        name: '原料',
        created_at: new Date(),
        updated_at: new Date()
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    vessel_id: 1,
    vessel: {
      id: 1,
      name: 'ガラス容器A',
      weight: new Decimal(5.3),
      created_at: new Date(),
      updated_at: new Date()
    },
    creator_id: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date()
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    product_name: 'テスト製品B',
    lot: 'LOT20240302',
    status: SampleStatus.OUTBOUND,
    registration_date: new Date('2024-03-02'),
    update_date: new Date('2024-03-03'),
    remarks: 'テスト用サンプル2',
    expiration_date: expirationDate,
    storage_date: storageDate,
    current_weight: new Decimal(0),
    net_weight: new Decimal(75.8),
    vessel_weight: new Decimal(4.2),
    inbound_weight: new Decimal(80.0),
    material_id: 2,
    material: {
      id: 2,
      name: 'テスト資材B',
      specification: '規格B',
      category_id: 2,
      category: {
        id: 2,
        name: '中間品',
        created_at: new Date(),
        updated_at: new Date()
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    vessel_id: 2,
    vessel: {
      id: 2,
      name: 'プラスチック容器A',
      weight: new Decimal(4.2),
      created_at: new Date(),
      updated_at: new Date()
    },
    creator_id: 1,
    creator: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: new Date()
    },
    created_at: new Date(),
    updated_at: new Date()
  }
];

interface StockState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  selected_stock: Stock | null;
  fetchStocks: () => Promise<void>;
  addStock: (stock: Omit<Stock, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateStock: (id: number, stockData: Partial<Stock>) => Promise<void>;
  deleteStock: (id: number) => Promise<void>;
  selectStock: (stock: Stock | null) => void;
  issueStock: (id: number, issuedWeight: Decimal) => Promise<void>;
  reInboundStock: (id: number, returnedWeight: Decimal) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  stocks: mockStocks,
  loading: false,
  error: null,
  selected_stock: null,

  fetchStocks: async () => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      // 現在はモックデータを使用
      set({ stocks: mockStocks, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addStock: async (stock) => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      const newStock: Stock = {
        ...stock,
        id: Math.max(0, ...get().stocks.map(s => s.id)) + 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      set(state => ({ 
        stocks: [...state.stocks, newStock], 
        loading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateStock: async (id, stockData) => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      set(state => ({
        stocks: state.stocks.map(stock => 
          stock.id === id 
            ? { ...stock, ...stockData, updated_at: new Date() } 
            : stock
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteStock: async (id) => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      set(state => ({
        stocks: state.stocks.filter(stock => stock.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  selectStock: (stock) => {
    set({ selected_stock: stock });
  },

  issueStock: async (id, issuedWeight) => {
    set({ loading: true, error: null });
    try {
      const stock = get().stocks.find(s => s.id === id);
      if (!stock) {
        throw new Error('在庫が見つかりません');
      }

      if (stock.current_weight.lessThan(issuedWeight)) {
        throw new Error('出庫量が現在の重量を超えています');
      }

      const updatedStock = {
        ...stock,
        status: SampleStatus.OUTBOUND,
        current_weight: new Decimal(0), // 出庫中は0に
        update_date: new Date(),
        updated_at: new Date()
      };

      set(state => ({
        stocks: state.stocks.map(s => s.id === id ? updatedStock : s),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  reInboundStock: async (id, returnedWeight) => {
    set({ loading: true, error: null });
    try {
      const stock = get().stocks.find(s => s.id === id);
      if (!stock) {
        throw new Error('在庫が見つかりません');
      }

      if (stock.status !== SampleStatus.OUTBOUND) {
        throw new Error('出庫中の在庫のみ再入庫できます');
      }

      // 返却された重量を設定
      const updatedStock = {
        ...stock,
        status: SampleStatus.REINBOUND,
        current_weight: returnedWeight,
        update_date: new Date(),
        updated_at: new Date()
      };

      set(state => ({
        stocks: state.stocks.map(s => s.id === id ? updatedStock : s),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  }
})); 