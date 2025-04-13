import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from "react-router";
import { useStockStore } from '../../stores/stockStore';
import { useNavigationStore } from '../../stores/navigationStore';
import type { Stock } from '../../types';
import { SampleStatus } from '../../types';
import { Decimal } from 'decimal.js';
import { Button } from '../../components/ui/button';
import { Trash2, PackageOpen, PackageCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Table, type TableColumn } from '../../components/ui/table';
import GanttChart from '../../components/ui/ganttchart/ganttChart';
import { Task } from '~/components/ui/ganttchart/types';
import { createColumnHelper } from '@tanstack/react-table';
import ColorPicker from '~/components/ui/color-picker';
import { ExpandableGridTable, type ExpandableGridItem } from '../../components/ui/boxgrid/expandable-grid-table';
import { VirtualizedGridTable } from '../../components/ui/boxgrid/virtualized-grid-table';
import { ColumnDef } from '@tanstack/react-table';

// 追加: カラムヘルパーをエクスポート (外部からの使用を容易にするため)
export const columnHelper = createColumnHelper<any>()

// カラム定義
// const columns2= [
//   columnHelper.accessor("barcode", {
//     header: "バーコード",
//     cell: (info) => info.getValue(),
//     meta: {
//       width: 150
//     }
//   }),
//   columnHelper.accessor("modelNumber", {
//     header: "型番",
//     cell: (info) => info.getValue(),
//     meta: {
//       width: 150,
//       isHTML: true
//     }
//   }),
//   columnHelper.accessor("deviceName", {
//     header: "機器名",
//     cell: (info) => info.getValue(),
//     meta: {
//       width: 200
//     }
//   }),
// ];

// // Sample data
// const myTasks: Task[] = [
//   { id: "1", barcode: "WBS30165", modelNumber: "88882126", deviceName: "チューブホルダー、T..." },
//   { id: "2", barcode: "WBS30100", modelNumber: "4579", deviceName: "24チップ" },
//   { id: "3", barcode: "WBS30079", modelNumber: "ZC021", deviceName: "Aluminum canister..." },
//   { id: "4", barcode: "WBS14379", modelNumber: "BCS-117GR", deviceName: "アイスパケツ Midi(角..." },
//   { id: "5", barcode: "WBS30168", modelNumber: "88882127", deviceName: "チューブホルダー、4..." },
//   { id: "6", barcode: "WBS14146", modelNumber: "LatitudeE5530", deviceName: "ラップトップPC(検体..." },
//   { id: "7", barcode: "WBS30129", modelNumber: "WB-203M", deviceName: "MINIcell コンパクトCO2..." },
//   { id: "8", barcode: "WBS20135", modelNumber: "8-300-00-9", deviceName: "pipet4u oasis" },
//   {
//     id: "9",
//     barcode: "WBS30072",
//     modelNumber: "WKN-9606",
//     deviceName: "ブロックF (15mL×...",
//     startDate: new Date(2025, 0, 21),
//     endDate: new Date(2025, 1, 10),
//     status: "貸出(天野 飛)",
//   },
//   { id: "10", barcode: "WBS14406", modelNumber: "BCS-512", deviceName: "CoolBox XT/2XT用冷..." },
//   { id: "11", barcode: "WBS30043", modelNumber: "439J1", deviceName: "スタンド（Q700用)" },
//   { id: "12", barcode: "WBS30105", modelNumber: "WKN-ABC2", deviceName: "テストABC機器A" },
//   {
//     id: "13",
//     barcode: "WBS14427",
//     modelNumber: "AST-601",
//     deviceName: "ThawSTAR CFT2",
//     startDate: new Date(2025, 0, 25),
//     endDate: new Date(2025, 3, 14),
//     status: "貸出(天野 飛)",
//   },
//   { id: "14", barcode: "WBS14462", modelNumber: "WKN-2374", deviceName: "ブチ★SPIN" },
//   { id: "15", barcode: "WBS14350", modelNumber: "17014382", deviceName: "L-1000XLS+ ・手動..." },
// ]

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

// ステータスの日本語表示
const statusLabels: Record<SampleStatus, string> = {
  [SampleStatus.STORED]: '保管中',
  [SampleStatus.OUTBOUND]: '出庫中',
  [SampleStatus.USED]: '使用済',
  [SampleStatus.REINBOUND]: '再入庫済',
  [SampleStatus.WAITING_FOR_JUDGMENT]: '判定待',
  [SampleStatus.WAITING_FOR_DISPOSAL]: '廃棄待',
  [SampleStatus.DISPOSED]: '廃棄済'
};

// ステータスに応じたバッジのスタイル
const statusStyles: Record<SampleStatus, string> = {
  [SampleStatus.STORED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [SampleStatus.OUTBOUND]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [SampleStatus.USED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [SampleStatus.REINBOUND]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [SampleStatus.WAITING_FOR_JUDGMENT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [SampleStatus.WAITING_FOR_DISPOSAL]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [SampleStatus.DISPOSED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

// ExpandableGridItem型を拡張した在庫階層データ型
interface HierarchicalStock extends ExpandableGridItem {
  id: string;
  parentId?: string;
  materialName: string;
  productName: string;
  lot: string;
  stockCount: number;
  weight: string;
  status: string;
}

export default function Inventory() {
  const navigate = useNavigate();
  const { stocks, fetchStocks, addStock, updateStock, deleteStock, issueStock, reInboundStock, error } = useStockStore();
  // ナビゲーションストアを取得
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'ALL'>('ALL');
  
  // 編集中の在庫
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // ページ表示状態管理（'list', 'create', 'edit'）
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit'>('list');
  
  // 新規在庫用のフォーム状態
  const [formData, setFormData] = useState({
    productName: '',
    lot: '',
    materialId: '',
    vesselId: '',
    netWeight: '',
    vesselWeight: '',
    expirationDate: '',
    remarks: '',
  });

  // 表示モード（'list'または'hierarchical'）
  const [viewMode, setViewMode] = useState<'list' | 'hierarchical'>('hierarchical');
  // 展開された資材ID
  const [expandedMaterialIds, setExpandedMaterialIds] = useState<string[]>([]);
  
  // フォームフィールドの変更ハンドラ
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  // ページ表示時にタイトルを設定
  useEffect(() => {
    setPageTitle('在庫');
    
    return () => {
      // コンポーネントのアンマウント時にリセット
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [setPageTitle, setBackButton]);
  
  // ページ状態が変わったときにタイトルと戻るボタンを更新
  useEffect(() => {
    if (currentPage === 'list') {
      setPageTitle('在庫');
      setBackButton(false);
    } else if (currentPage === 'create') {
      setPageTitle('新規登録');
      setBackButton(true, resetForm);
    } else if (currentPage === 'edit') {
      setPageTitle('在庫詳細');
      setBackButton(true, resetForm);
    }
  }, [currentPage, setPageTitle, setBackButton]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchStocks();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchStocks]);

  // 検索とフィルタリング !!!
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      (stock.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.lot || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.material?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || stock.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // FormGeneratorのフィールド定義
  const getFormFields = (): FormFieldConfig[] => [
    {
      id: 'productName',
      label: '製品名',
      elementType: 'input',
      required: true,
    },
    {
      id: 'lot',
      label: 'ロット番号',
      elementType: 'input',
      required: true,
    },
    {
      id: 'materialId',
      label: '資材',
      elementType: 'select',
      required: true,
      options: stocks.length > 0 ? Array.from(new Set(stocks.map(s => s.materialId).filter(Boolean) as number[])).map(id => {
        const material = stocks.find(s => s.materialId === id)?.material;
        return {
          label: material?.name || '',
          value: String(id)
        };
      }) : [],
    },
    {
      id: 'vesselId',
      label: '容器',
      elementType: 'select',
      required: true,
      options: stocks.length > 0 ? Array.from(new Set(stocks.map(s => s.vessel?.id).filter(Boolean) as number[])).map(id => {
        const vessel = stocks.find(s => s.vessel?.id === id)?.vessel;
        return {
          label: vessel?.name || '',
          value: String(id)
        };
      }) : [],
    },
    {
      id: 'netWeight',
      label: '正味重量 (g)',
      elementType: 'number',
      min: 0,
      step: 0.001,
      required: true,
    },
    {
      id: 'vesselWeight',
      label: '容器重量 (g)',
      elementType: 'number',
      min: 0,
      step: 0.001,
      required: true,
    },
    {
      id: 'expirationDate',
      label: '有効期限',
      elementType: 'date',
      required: true,
    },
    {
      id: 'remarks',
      label: '備考',
      elementType: 'textarea',
    }
  ];
  
  const handleFormSubmit = async (data: FormData) => {
    if (!data.productName || !data.lot || !data.materialId || !data.vesselId || !data.netWeight || !data.vesselWeight || !data.expirationDate) {
      return; // 必須項目が入力されていない
    }
    
    try {
      const material = stocks.find(s => s.materialId === Number(data.materialId))?.material;
      const vessel = stocks.find(s => s.vessel?.id === Number(data.vesselId))?.vessel;
      
      if (!material || !vessel) {
        console.error('資材または容器が見つかりません');
        return;
      }
      
      const netWeight = new Decimal(data.netWeight);
      const vesselWeight = new Decimal(data.vesselWeight);
      const inboundWeight = netWeight.plus(vesselWeight);
      
      const stockData = {
        productName: data.productName,
        lot: data.lot,
        status: SampleStatus.STORED,
        registrationDate: new Date(),
        updateDate: new Date(),
        remarks: data.remarks || '',
        expirationDate: new Date(data.expirationDate),
        storageDate: new Date(),
        currentWeight: inboundWeight,
        netWeight: netWeight,
        vesselWeight: vesselWeight,
        inboundWeight: inboundWeight,
        materialId: Number(data.materialId),
        material,
        vesselId: Number(data.vesselId),
        vessel,
        creatorId: 1, // 仮のユーザーID
        creator: stocks[0]?.creator, // 仮のユーザー情報
      };
      
      await addStock(stockData as any);
      
      resetForm();
    } catch (error) {
      console.error('在庫保存エラー:', error);
    }
  };
  
  const handleRowClick = (stock: Stock, rowIndex: number) => {
    console.log('Row clicked:', stock, rowIndex);
    setEditingStock(stock);
    setFormData({
      productName: stock.productName,
      lot: stock.lot,
      materialId: String(stock.materialId),
      vesselId: String(stock.vesselId || ''),
      netWeight: stock.netWeight.toString(),
      vesselWeight: stock.vesselWeight.toString(),
      expirationDate: stock.expirationDate.toISOString().split('T')[0],
      remarks: stock.remarks || '',
    });
    setIsEditing(true);
    setCurrentPage('edit');
  };

  const updateFormSubmit = async () => {
    if (!editingStock?.id) {
      return; // IDがない場合は更新しない
    }
    
    try {
      const material = stocks.find(s => s.materialId === Number(formData.materialId))?.material;
      const vessel = stocks.find(s => s.vessel?.id === Number(formData.vesselId))?.vessel;
      
      if (!material || !vessel) {
        console.error('資材または容器が見つかりません');
        return;
      }
      
      const netWeight = new Decimal(formData.netWeight);
      const vesselWeight = new Decimal(formData.vesselWeight);
      
      const updatedData = {
        productName: formData.productName,
        lot: formData.lot,
        remarks: formData.remarks,
        expirationDate: new Date(formData.expirationDate),
        netWeight: netWeight,
        vesselWeight: vesselWeight,
        materialId: Number(formData.materialId),
        material,
        vesselId: Number(formData.vesselId),
        vessel,
        updateDate: new Date(),
      };
      
      await updateStock(editingStock.id, updatedData);
      resetForm();
    } catch (error) {
      console.error('在庫更新エラー:', error);
    }
  };

  const resetForm = () => {
    setEditingStock(null);
    setFormData({
      productName: '',
      lot: '',
      materialId: '',
      vesselId: '',
      netWeight: '',
      vesselWeight: '',
      expirationDate: '',
      remarks: '',
    });
    setIsEditing(false);
    setCurrentPage('list');
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('この在庫を削除してもよろしいですか？')) {
      try {
        await deleteStock(id);
      } catch (error) {
        console.error('在庫削除エラー:', error);
      }
    }
  };
  
  // 画面遷移関数
  const handleNavigateToInbound = () => {
    navigate("/operations/inbound?returnTo=inventory");
  };
  
  const handleNavigateToOutbound = () => {
    navigate("/operations/outbound?returnTo=inventory");
  };
  
  const handleNavigateToReservation = () => {
    navigate("/operations/reservation?returnTo=inventory");
  };
  
  // 出庫処理関数を修正
  const handleIssueStock = async (id: number) => {
    navigate(`/operations/outbound?stockId=${id}&returnTo=inventory`);
  };
  
  // 再入庫処理関数を修正
  const handleReInboundStock = async (id: number) => {
    navigate(`/operations/inbound?stockId=${id}&mode=reinbound&returnTo=inventory`);
  };

  // テーブルのカラム定義
  const columns: TableColumn<Stock>[] = [
    { header: '在庫ID', accessor: 'id' },
    { header: '製品名', accessor: 'productName' },
    { header: 'ロット', accessor: 'lot' },
    { header: '資材', accessor: (stock) => stock.material?.name || '-' },
    { 
      header: 'ステータス', 
      accessor: (stock) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[stock.status]}`}>
          {statusLabels[stock.status]}
        </span>
      )
    },
    { 
      header: '現在重量', 
      accessor: (stock) => stock.currentWeight ? `${stock.currentWeight.toString()}g` : '-'
    },
    { header: '有効期限', accessor: (stock) => new Date(stock.expirationDate).toLocaleDateString('ja-JP') },
    { 
      header: '操作', 
      accessor: (stock) => (
        <div className="flex space-x-2">
          {stock.status === SampleStatus.STORED && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                handleIssueStock(stock.id);
              }}
            >
              <PackageOpen className="h-4 w-4 mr-1" />
              出庫
            </Button>
          )}
          {stock.status === SampleStatus.OUTBOUND && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
              onClick={(e) => {
                e.stopPropagation();
                handleReInboundStock(stock.id);
              }}
            >
              <PackageCheck className="h-4 w-4 mr-1" />
              再入庫
            </Button>
          )}
        </div>
      ),
      className: 'w-24'
    }
  ];

  // VirtualizedGridTable用のカラム定義に変換
  const gridColumns = useMemo(() => {
    return columns.map(col => {
      return columnHelper.accessor(col.accessor as any, {
        header: col.header,
        cell: (info) => {
          const stock = info.row.original;
          // accessorが関数の場合は実行結果を返す
          if (typeof col.accessor === 'function') {
            return col.accessor(stock);
          }
          // それ以外の場合はaccessorをキーとして値を取得
          return info.getValue();
        },
        meta: {
          width: col.className === 'w-24' ? 150 : 120
        }
      });
    });
  }, [columns]) as ColumnDef<Stock, any>[];

  // 在庫データを階層構造に変換
  const hierarchicalData = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];
    
    // 資材単位でグループ化
    const materialGroups: Record<string, Stock[]> = {};
    filteredStocks.forEach(stock => {
      const materialId = stock.materialId.toString() || 'unknown'; //!!!
      console.log('stock');
      console.log(JSON.stringify(stock, undefined, 2));

      if (!materialGroups[materialId]) {
        materialGroups[materialId] = [];
      }
      materialGroups[materialId].push(stock);
    });
    
    // 階層構造に変換
    const hierarchical: HierarchicalStock[] = [];
    
    // 親行（資材）を追加
    Object.entries(materialGroups).forEach(([materialId, stocksGroup]) => {

      // 親行（資材）
      hierarchical.push({
        ...stocksGroup[0],
        id: `material-${materialId}`,
        materialName: stocksGroup[0].productName || '',
        stockCount: stocksGroup.length,
        weight: stocksGroup.reduce((total, stock) => 
          total.plus(stock.currentWeight || new Decimal(0)), new Decimal(0)).toString() + 'g',
        status: ''
      });
      
      // 子行（個別在庫）
      stocksGroup.forEach(stock => {
        hierarchical.push({
          id: `stock-${stock.id}`,
          parentId: `material-${materialId}`,
          materialName: stock.material?.name || '不明',
          productName: stock.productName,
          lot: stock.lot,
          stockCount: 1, //これは本来不要なはず!!!
          weight: stock.currentWeight?.toString() + 'g' || '-',
          status: statusLabels[stock.status]
        });
      });
    });
    
    return hierarchical;
  }, [filteredStocks]);
  
  // 階層表示用の列定義
  const hierarchicalColumns = [
    columnHelper.accessor("materialName", {
      header: "資材名",
      cell: (info) => info.getValue(),
      meta: { width: 200 }
    }),
    columnHelper.accessor("stockCount", {
      header: "在庫数",
      cell: (info) => info.getValue(),
      meta: { width: 100 }
    }),
    columnHelper.accessor("categoryName", {
      header: "カテゴリ",
      cell: (info) => info.getValue(),
      meta: { width: 200 }
    }),
    columnHelper.accessor("vesselName", {
      header: "容器名",
      cell: (info) => info.getValue(),
      meta: { width: 200 }
    }),
  ];
  
  const childColumns = [
    columnHelper.accessor("id", {
      header: "在庫ID",
      cell: (info) => info.getValue(),
      meta: { width: 100 }
    }),
    columnHelper.accessor("productName", {
      header: "資材名",
      cell: (info) => info.getValue(),
      meta: { width: 200 }
    }),
    columnHelper.accessor("lot", {
      header: "ロット",
      cell: (info) => info.getValue(),
      meta: { width: 150 }
    }),
    columnHelper.accessor("weight", {
      header: "重量",
      cell: (info) => info.getValue(),
      meta: { width: 120 }
    }),
    columnHelper.accessor("status", {
      header: "ステータス",
      cell: (info) => info.getValue(),
      meta: { width: 120 }
    }),
    columnHelper.accessor("actions", {
      header: "操作",
      cell: (info) => {
        const row = info.row.original;
        // stock-プレフィックスを削除してIDを取得
        const stockId = Number(row.id.toString().replace('stock-', ''));
        const stock = stocks.find(s => s.id === stockId);
        
        if (!stock) return null;
        
        return (
          <div className="flex space-x-2">
            {stock.status === SampleStatus.STORED && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIssueStock(stock.id);
                }}
              >
                <PackageOpen className="h-4 w-4 mr-1" />
                出庫
              </Button>
            )}
            {stock.status === SampleStatus.OUTBOUND && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReInboundStock(stock.id);
                }}
              >
                <PackageCheck className="h-4 w-4 mr-1" />
                再入庫
              </Button>
            )}
          </div>
        );
      },
      meta: { width: 150 }
    })
  ]

  // 親行展開時のハンドラ
  const handleParentRowToggle = (parentId: string | number, isExpanded: boolean) => {
    console.log(`親行 ${parentId} が ${isExpanded ? '展開' : '折りたたみ'} されました`);
    if (isExpanded) {
      setExpandedMaterialIds(prev => [...prev, parentId.toString()]);
    } else {
      setExpandedMaterialIds(prev => prev.filter(id => id !== parentId.toString()));
    }
  };
  
  // 階層表示での行クリック
  const handleHierarchicalRowClick = (row: HierarchicalStock) => {
    if (row.parentId) {
      // 子行（個別在庫）のIDからstock-プレフィックスを削除
      const stockId = Number(row.id.replace('stock-', ''));
      const stock = stocks.find(s => s.id === stockId);
      if (stock) {
        handleRowClick(stock, 0);
      }
    }
  };

  return (
    <div className="space-y-4 p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        {true && <ColorPicker onApply={() => {}} onCancel={() => {}} defaultColor={"#000000"} />}
      </div> */}

      {/* <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Gantt Chart</h1>
        <GanttChart 
          tasks={myTasks}
          tableColumns={columns2}
          enableColumnVisibility={true}
        />
      </div> */}

      {/* 操作ボタンを追加 */}
      {currentPage === 'list' && (
          <div className="bg-white overflow-hidden mb-1">
            <div className="p-1">
              <div className="flex justify-between">
                <div className="flex flex-wrap gap-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleNavigateToInbound}
                  >
                    入庫処理
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleNavigateToOutbound}
                  >
                    出庫処理
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleNavigateToReservation}
                  >
                    出庫予約
                  </Button>
                </div>

                {/* 表示切替タブ（画面右上に配置） */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <Tabs 
                      value={viewMode} 
                      onValueChange={(value) => setViewMode(value as 'list' | 'hierarchical')}
                      className="w-full"
                    >
                      <TabsList className="w-full bg-gray-100 p-1 rounded-lg">
                        <TabsTrigger 
                          value="list" 
                          className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black-600 transition-all duration-200"
                        >
                          リスト
                        </TabsTrigger>
                        <TabsTrigger 
                          value="hierarchical" 
                          className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black-600 transition-all duration-200"
                        >
                          資材別
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
      )}

      {/* 在庫一覧 */}
      {currentPage === 'list' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    id="search"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="製品名、ロット番号、資材名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <select
                    id="status"
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as SampleStatus | 'ALL')}
                  >
                    <option value="ALL">すべて</option>
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            
            </div>
            
            <div className="p-2">
              {viewMode === 'list' ? (
                <VirtualizedGridTable
                  data={filteredStocks}
                  columns={gridColumns}
                  height={500}
                  enableSorting={true}
                  enableFiltering={true}
                  onRowSelectionChange={(rows) => {
                    if (rows.length > 0) {
                      handleRowClick(rows[0].original, 0);
                    }
                  }}
                />
              ) : (
                <ExpandableGridTable
                  data={hierarchicalData}
                  columns={hierarchicalColumns as ColumnDef<HierarchicalStock, any>[]}
                  childColumns={childColumns as ColumnDef<HierarchicalStock, any>[]}
                  enableSorting={true}
                  onRowClick={handleHierarchicalRowClick}
                  onParentRowToggle={handleParentRowToggle}
                  rowHeight={40}
                  height={500}
                  expandColumnIndex={0}
                  initialExpandedIds={expandedMaterialIds}
                />
              )}
              
              {isLoading && (
                <div className="flex justify-center items-center p-4">
                  <p className="text-gray-500">読み込み中...</p>
                </div>
              )}
              {!isLoading && filteredStocks.length === 0 && (
                <div className="flex justify-center items-center p-4">
                  <p className="text-gray-500">該当する在庫がありません</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 在庫登録フォーム */}
      {(currentPage === 'create') && (
        <div className="">          
          <div className="p-6">
            <FormGenerator
              fields={getFormFields()}
              initialData={formData}
              onSubmit={handleFormSubmit}
              className="max-w-2xl mx-auto"
            />
            
            <div className="flex justify-center space-x-2 mt-4">
                <Button
                  type="submit"
                  onClick={() => handleFormSubmit(formData as any)}
                  className={cn("bg-blue-600 text-white hover:bg-blue-700")}
                >
                  登録
                </Button>
              </div>
          </div>
        </div>
      )}
      
      {/* 在庫編集フォーム */}
      {currentPage === 'edit' && editingStock && (
        <div className="w-full">
            <Tabs defaultValue="basic" className="w-full">
                <div className="mb-4">
                    <TabsList>
                        <TabsTrigger value="basic">基本情報</TabsTrigger>
                        <TabsTrigger value="history">履歴</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="basic" className="mt-0 p-3">
                    <div className="flex justify-end gap-2 -mt-14 mb-6">
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white" 
                            onClick={updateFormSubmit}>
                                更新
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="bg-red-600 hover:bg-red-200 text-white border-red-600 flex items-center gap-1"
                            onClick={() => handleDelete(editingStock.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            削除
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/2">
                            <FormGenerator
                                fields={getFormFields().slice(0, 4)}
                                initialData={formData}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full md:w-1/2">
                            <FormGenerator
                                fields={getFormFields().slice(4)}
                                initialData={formData}
                                onChange={handleChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 p-3">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            <h3 className="font-medium mb-2">在庫履歴</h3>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                                <p className="text-gray-500 dark:text-gray-400">
                                    登録日: {new Date(editingStock.registrationDate).toLocaleDateString('ja-JP')}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    更新日: {new Date(editingStock.updateDate).toLocaleDateString('ja-JP')}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    入庫時重量: {editingStock.inboundWeight.toString()}g
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    現在重量: {editingStock.currentWeight.toString()}g
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    登録者: {editingStock.creator?.username || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      )}
    </div>
  );
}
