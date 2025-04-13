import React from "react";
import { ExpandableGridTable, type ExpandableGridItem } from "./expandable-grid-table";
import type { ColumnDef } from "@tanstack/react-table";

// サンプルデータ型の定義
interface Product extends ExpandableGridItem {
  id: string;
  parentId?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  // 子アイテム用の追加フィールド
  sku?: string;
  weight?: number;
  dimensions?: string;
}

// サンプルデータ
const demoProducts: Product[] = [
  // 親製品
  {
    id: "P001",
    name: "ノートPC",
    category: "電子機器",
    price: 120000,
    stock: 10
  },
  {
    id: "P002",
    name: "スマートフォン",
    category: "電子機器",
    price: 80000,
    stock: 15
  },
  {
    id: "P003",
    name: "デスクトップPC",
    category: "電子機器",
    price: 150000,
    stock: 8
  },
  
  // 子製品 (ノートPC関連)
  {
    id: "P001-1",
    parentId: "P001",
    name: "ACアダプター",
    category: "アクセサリー",
    price: 5000,
    stock: 20,
    sku: "AC-001",
    weight: 0.3,
    dimensions: "5x5x2cm"
  },
  {
    id: "P001-2",
    parentId: "P001",
    name: "キャリングケース",
    category: "アクセサリー",
    price: 3000,
    stock: 12,
    sku: "CC-002",
    weight: 0.5,
    dimensions: "35x25x5cm"
  },
  {
    id: "P001-3",
    parentId: "P001",
    name: "プライバシーフィルター",
    category: "アクセサリー",
    price: 2500,
    stock: 5,
    sku: "PF-003",
    weight: 0.1,
    dimensions: "30x20x0.1cm"
  },
  
  // 子製品 (スマートフォン関連)
  {
    id: "P002-1",
    parentId: "P002",
    name: "充電ケーブル",
    category: "アクセサリー",
    price: 1500,
    stock: 30,
    sku: "CC-004",
    weight: 0.1,
    dimensions: "100x0.5x0.5cm"
  },
  {
    id: "P002-2",
    parentId: "P002",
    name: "保護ケース",
    category: "アクセサリー",
    price: 2000,
    stock: 25,
    sku: "PC-005",
    weight: 0.05,
    dimensions: "15x7x1cm"
  },
  {
    id: "P002-3",
    parentId: "P002",
    name: "画面保護フィルム",
    category: "アクセサリー",
    price: 1000,
    stock: 40,
    sku: "SP-006",
    weight: 0.01,
    dimensions: "15x7x0.05cm"
  },
  
  // 子製品 (デスクトップPC関連)
  {
    id: "P003-1",
    parentId: "P003",
    name: "キーボード",
    category: "アクセサリー",
    price: 8000,
    stock: 15,
    sku: "KB-007",
    weight: 0.8,
    dimensions: "45x15x2cm"
  },
  {
    id: "P003-2",
    parentId: "P003",
    name: "マウス",
    category: "アクセサリー",
    price: 5000,
    stock: 20,
    sku: "MS-008",
    weight: 0.15,
    dimensions: "10x6x4cm"
  },
  {
    id: "P003-3",
    parentId: "P003",
    name: "ディスプレイ",
    category: "アクセサリー",
    price: 30000,
    stock: 7,
    sku: "DP-009",
    weight: 5.0,
    dimensions: "60x40x10cm"
  }
];

// 親行の列定義
const parentColumns: ColumnDef<Product, any>[] = [
  {
    accessorKey: "id",
    header: "製品ID",
    size: 100,
  },
  {
    accessorKey: "name",
    header: "製品名",
    size: 200,
  },
  {
    accessorKey: "category",
    header: "カテゴリー",
    size: 150,
  },
  {
    accessorKey: "price",
    header: "価格",
    size: 100,
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return `${value?.toLocaleString()} 円`;
    },
  },
  {
    accessorKey: "stock",
    header: "在庫数",
    size: 100,
  }
];

// 子行の列定義
const childColumns: ColumnDef<Product, any>[] = [
  {
    accessorKey: "id",
    header: "アクセサリーID",
    size: 120,
  },
  {
    accessorKey: "name",
    header: "アクセサリー名",
    size: 180,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    size: 100,
  },
  {
    accessorKey: "price",
    header: "価格",
    size: 100,
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return `${value?.toLocaleString()} 円`;
    },
  },
  {
    accessorKey: "weight",
    header: "重量",
    size: 80,
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return value ? `${value} kg` : '';
    },
  },
  {
    accessorKey: "dimensions",
    header: "サイズ",
    size: 120,
  }
];

export default function ExpandableGridTableExample() {
  // 行選択時の処理
  const handleRowClick = (row: Product) => {
    console.log("選択された行:", row);
  };

  // 親行展開時の処理
  const handleParentRowToggle = (parentId: string | number, isExpanded: boolean) => {
    console.log(`親行 ${parentId} が ${isExpanded ? '展開' : '折りたたみ'} されました`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">拡張可能グリッドテーブル サンプル</h1>
      <p className="mb-4">このサンプルでは、親行の展開/折りたたみ機能を持つ階層構造グリッドテーブルを表示しています。親行と子行で異なる列定義を使用しています。</p>
      
      <ExpandableGridTable
        data={demoProducts}
        columns={parentColumns}
        childColumns={childColumns}
        enableSorting={true}
        onRowClick={handleRowClick}
        onParentRowToggle={handleParentRowToggle}
        rowHeight={40}
        height={500}
        expandColumnIndex={1} // 製品名の列にエクスパンダーを表示
        initialExpandedIds={["P001"]} // 初期状態でノートPCの行を展開
        expandIconProps={{
          size: 14,
          color: "#666",
          expandedColor: "#0066cc"
        }}
        childTableTitle="関連アクセサリー"
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p>使用方法:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>製品名をクリックすると、関連アクセサリーが表示されます</li>
          <li>列ヘッダーをクリックすると、その列でソートされます</li>
          <li>行をクリックすると、その行が選択されます</li>
          <li>「すべて折りたたむ」ボタンで、すべての行を折りたたみます</li>
          <li>親行と子行で異なる列定義を使用しています</li>
        </ul>
      </div>
    </div>
  );
} 