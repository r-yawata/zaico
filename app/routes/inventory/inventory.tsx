import { useEffect, useState } from 'react';
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

export default function Inventory() {
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

  // 検索とフィルタリング
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      stock.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.material?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || stock.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const createBtnHandler = () => {
    setCurrentPage('create');
  };

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
      options: stocks.length > 0 ? Array.from(new Set(stocks.map(s => s.material?.id).filter(Boolean) as number[])).map(id => {
        const material = stocks.find(s => s.material?.id === id)?.material;
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
      const material = stocks.find(s => s.material?.id === Number(data.materialId))?.material;
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
        netWeight,
        vesselWeight,
        inboundWeight,
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
      vesselId: String(stock.vesselId),
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
      const material = stocks.find(s => s.material?.id === Number(formData.materialId))?.material;
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
        netWeight,
        vesselWeight,
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
  
  const handleIssueStock = async (id: number) => {
    try {
      const stock = stocks.find(s => s.id === id);
      if (!stock) return;
      
      await issueStock(id, stock.currentWeight);
      resetForm();
    } catch (error) {
      console.error('出庫処理エラー:', error);
    }
  };
  
  const handleReInboundStock = async (id: number) => {
    try {
      const stock = stocks.find(s => s.id === id);
      if (!stock) return;
      
      // 現在は全量再入庫とする
      await reInboundStock(id, stock.netWeight.plus(stock.vesselWeight));
      resetForm();
    } catch (error) {
      console.error('再入庫処理エラー:', error);
    }
  };

  // テーブルのカラム定義
  const columns: TableColumn<Stock>[] = [
    { header: 'ID', accessor: 'id' },
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
    { header: '現在重量', accessor: (stock) => `${stock.currentWeight.toString()}g` },
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

  return (
    <div className="space-y-4 p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* 在庫一覧 */}
      {currentPage === 'list' && (
        <>
          <div className="flex justify-end items-center">
            <Button
              onClick={createBtnHandler}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
            >
              新規登録
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    検索
                  </label>
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
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ステータス
                  </label>
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
            
            <Table
              columns={columns}
              data={filteredStocks}
              isLoading={isLoading}
              onRowClick={handleRowClick}
              keyExtractor={(stock) => stock.id}
              emptyMessage="該当する在庫がありません"
            />
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
{/* ここで出庫予約などができても便利なので、検討する
                <TabsContent value="operations" className="mt-0 p-3">
                    <div className="flex flex-col gap-4">
                        <h3 className="font-medium mb-2">在庫操作</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editingStock.status === SampleStatus.STORED && (
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleIssueStock(editingStock.id)}
                                >
                                    <PackageOpen className="h-5 w-5 mr-2" />
                                    出庫処理
                                </Button>
                            )}
                            {editingStock.status === SampleStatus.OUTBOUND && (
                                <Button 
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => handleReInboundStock(editingStock.id)}
                                >
                                    <PackageCheck className="h-5 w-5 mr-2" />
                                    再入庫処理
                                </Button>
                            )}
                        </div>
                    </div>
                </TabsContent> */}
            </Tabs>
        </div>
      )}
    </div>
  );
}
