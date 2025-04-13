import { create } from 'zustand';
import { Decimal } from 'decimal.js';
import type { Stock } from '../types';
import { SampleStatus } from '../types';
import { apiRequest } from '../lib/api';

// モックデータ用の日付を作成
const today = new Date();
const expirationDate = new Date();
expirationDate.setFullYear(today.getFullYear() + 1);
const storageDate = new Date();
storageDate.setMonth(today.getMonth() + 6);

// モックデータ
// const mockStocks: Stock[] = [
//   {
//     id: 1,
//     productName: 'テスト製品A',
//     lot: 'LOT20240301',
//     status: SampleStatus.STORED,
//     registrationDate: new Date('2024-03-01'),
//     updateDate: new Date('2024-03-01'),
//     remarks: 'テスト用サンプル',
//     expirationDate: expirationDate,
//     storageDate: storageDate,
//     currentWeight: new Decimal(100.5),
//     netWeight: new Decimal(95.2),
//     vesselWeight: new Decimal(5.3),
//     inboundWeight: new Decimal(100.5),
//     materialId: 1,
//     material: {
//       id: 1,
//       name: 'テスト資材A',
//       specification: '規格A',
//       categoryId: 1,
//       supplierId: 1,
//       manufacturerId: 1,
//       category: {
//         id: 1,
//         name: '原料',
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     vesselId: 1,
//     vessel: {
//       id: 1,
//       name: 'ガラス容器A',
//       weight: new Decimal(5.3),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     creatorId: 1,
//     creator: {
//       id: 1,
//       username: 'testuser',
//       email: 'test@example.com',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     createdAt: new Date(),
//     updatedAt: new Date()
//   },
//   {
//     id: 2,
//     productName: 'テスト製品B',
//     lot: 'LOT20240302',
//     status: SampleStatus.OUTBOUND,
//     registrationDate: new Date('2024-03-02'),
//     updateDate: new Date('2024-03-03'),
//     remarks: 'テスト用サンプル2',
//     expirationDate: expirationDate,
//     storageDate: storageDate,
//     currentWeight: new Decimal(0),
//     netWeight: new Decimal(75.8),
//     vesselWeight: new Decimal(4.2),
//     inboundWeight: new Decimal(80.0),
//     materialId: 2,
//     material: {
//       id: 2,
//       name: 'テスト資材B',
//       specification: '規格B',
//       categoryId: 2,
//       supplierId: 2,
//       manufacturerId: 2,
//       category: {
//         id: 2,
//         name: '中間品',
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     vesselId: 2,
//     vessel: {
//       id: 2,
//       name: 'プラスチック容器A',
//       weight: new Decimal(4.2),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     creatorId: 1,
//     creator: {
//       id: 1,
//       username: 'testuser',
//       email: 'test@example.com',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     },
//     createdAt: new Date(),
//     updatedAt: new Date()
//   }
// ];

interface StockState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  selectedStock: Stock | null;
  fetchStocks: () => Promise<void>;
  addStock: (stock: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  updateStock: (id: number, stockData: Partial<Stock>) => Promise<void>;
  deleteStock: (id: number) => Promise<void>;
  selectStock: (stock: Stock | null) => void;
  issueStock: (id: number, issuedWeight: Decimal) => Promise<void>;
  reInboundStock: (id: number, returnedWeight: Decimal) => Promise<void>;
}

// スネークケースからキャメルケースへの変換ヘルパー関数
const snakeToCamel = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
};

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  loading: false,
  error: null,
  selectedStock: null,

  fetchStocks: async () => {
    await apiRequest({
      endpoint: '/stocks',
      errorMessage: '在庫データの取得に失敗しました',
      logPrefix: '在庫データ取得',
      transformResponse: (data: any) => {
        console.log('APIレスポンス:', data); // 実際のデータ構造を確認
        
        // 在庫データの変換処理
        const stocks = data.stocks.map((stock: any) => {
          // フラット構造のデータに変換
          return {
            id: stock.id,
            productName: stock.productName,
            lot: stock.lot,
            status: stock.status,
            categoryName: stock.categoryName,
            vesselName: stock.vesselName,
            registrationDate: new Date(stock.registrationDate),
            updateDate: new Date(stock.updateDate),
            remarks: stock.remarks,
            expirationDate: new Date(stock.expirationDate),
            storageDate: new Date(stock.storageDate),
            currentWeight: new Decimal(stock.currentWeight),
            netWeight: new Decimal(stock.netWeight),
            vesselWeight: new Decimal(stock.vesselWeight),
            inboundWeight: new Decimal(stock.inboundWeight),
            // ネストされたオブジェクトのプロパティをフラット化
            materialId: stock.materialId,
            materialName: stock.material?.name,
            materialSpecification: stock.material?.specification,
            materialCategoryId: stock.material?.categoryId,
            materialCategoryName: stock.material?.category?.name,
            vesselId: stock.vesselId,
            // ここで重複していたvesselWeightを削除
            // creatorId: stock.creatorId,
            // creatorUsername: stock.creator?.username,
            // creatorEmail: stock.creator?.email,
            extraConfig: stock.extraConfig,
            parentStockId: stock.parentStockId,
            // 日付型への変換
            createdAt: new Date(stock.createdAt),
            updatedAt: new Date(stock.updatedAt)
          };
        });
        return { stocks };
      },
      onSuccess: (data, set) => set({
        stocks: data.stocks,
        loading: false
      })
    }, set);
  },

  addStock: async (stock) => {
    set({ loading: true, error: null });
    return await apiRequest({
      endpoint: '/stocks',
      method: 'POST',
      data: stock,
      errorMessage: '在庫の登録に失敗しました',
      logPrefix: '在庫登録',
      transformResponse: (data: any) => {
        // APIレスポンスの変換処理
        const stock = {
          id: data.id,
          productName: data.productName,
          lot: data.lot,
          status: data.status,
          registrationDate: new Date(data.registrationDate),
          updateDate: new Date(data.updateDate),
          remarks: data.remarks,
          expirationDate: new Date(data.expirationDate),
          storageDate: new Date(data.storageDate),
          currentWeight: new Decimal(data.currentWeight),
          netWeight: new Decimal(data.netWeight),
          vesselWeight: new Decimal(data.vesselWeight),
          inboundWeight: new Decimal(data.inboundWeight),
          materialId: data.materialId,
          materialName: data.materialName,
          materialSpecification: data.materialSpecification,
          materialCategoryId: data.materialCategoryId,
          materialCategoryName: data.materialCategoryName,
          vesselId: data.vesselId,
          vesselName: data.vesselName,
          creatorId: data.creatorId,
          creatorUsername: data.creatorUsername,
          extraConfig: data.extraConfig,
          parentStockId: data.parentStockId,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        };
        return stock;
      },
      onSuccess: (newStock, set) => set((state: StockState) => ({
        stocks: [...state.stocks, newStock],
        loading: false
      }))
    }, set);
  },

  updateStock: async (id, stockData) => {
    set({ loading: true, error: null });
    try {
      // 実際のAPIコールはここに実装
      set(state => ({
        stocks: state.stocks.map(stock => 
          stock.id === id 
            ? { ...stock, ...stockData, updatedAt: new Date() } 
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
    set({ selectedStock: stock });
  },

  issueStock: async (id, issuedWeight) => {
    set({ loading: true, error: null });
    try {
      const stock = get().stocks.find(s => s.id === id);
      if (!stock) {
        throw new Error('在庫が見つかりません');
      }

      if (stock.currentWeight.lessThan(issuedWeight)) {
        throw new Error('出庫量が現在の重量を超えています');
      }

      const updatedStock = {
        ...stock,
        status: SampleStatus.OUTBOUND,
        currentWeight: new Decimal(0), // 出庫中は0に
        updateDate: new Date(),
        updatedAt: new Date()
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
        currentWeight: returnedWeight,
        updateDate: new Date(),
        updatedAt: new Date()
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