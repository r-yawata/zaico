import { useEffect, useState, useRef } from 'react';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { type Supplier } from '../../sharedSchema/supplierSchema';
import { Button } from '../../components/ui/button';
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Table, type TableColumn } from '../../components/ui/table';

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

export default function Suppliers() {
  const { suppliers, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } = useMasterStore();
  // ナビゲーションストアを取得
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // 編集中の仕入先
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // ページ表示状態管理（'list', 'create', 'edit'）
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit'>('list');
  
  // 新規仕入先用のフォーム状態
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
  });
  
  // フォームエラー状態管理を追加
  const [formError, setFormError] = useState<{ key: 'error' | 'warning' | ''; msg: string }>({
    key: '',
    msg: ''
  });
  
  // エラー表示用の参照を追加
  const errorRef = useRef<HTMLDivElement>(null);
  
  // フォームフィールドの変更ハンドラ
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  // ページ表示時にタイトルを設定
  useEffect(() => {
    setPageTitle('仕入先');
    
    return () => {
      // コンポーネントのアンマウント時にリセット
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [setPageTitle, setBackButton]);
  
  // ページ状態が変わったときにタイトルと戻るボタンを更新
  useEffect(() => {
    if (currentPage === 'list') {
      setPageTitle('仕入先');
      setBackButton(false);
    } else if (currentPage === 'create') {
      setPageTitle('新規登録');
      setBackButton(true, resetForm);
    } else if (currentPage === 'edit') {
      setPageTitle('編集');
      setBackButton(true, resetForm);
    }
  }, [currentPage, setPageTitle, setBackButton]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchSuppliers();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchSuppliers]);
  
  const createBtnHandler = () => {
    setCurrentPage('create');
  };

  // FormGeneratorのフィールド定義
  const getFormFields = (): FormFieldConfig[] => [
    {
      id: 'name',
      label: '仕入先名',
      elementType: 'input',
      required: true,
    },
    {
      id: 'contact',
      label: '連絡先',
      elementType: 'input',
    },
    {
      id: 'address',
      label: '住所',
      elementType: 'textarea',
      rows: 3,
    }
  ];
  
  // フォームのバリデーション関数
  const validateForm = (data: FormData): boolean => {
    if (!data.name || data.name.trim() === '') {
      setFormError({ key: 'error', msg: '仕入先名を入力してください。' });
      return false;
    }
    
    setFormError({ key: '', msg: '' });
    return true;
  };
  
  // エラー発生時に画面上部にスクロールする関数
  const scrollToError = () => {
    if (errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleFormSubmit = async (data: FormData) => {
    // バリデーションチェック
    if (!validateForm(data)) {
      scrollToError();
      return;
    }
    
    try {
      const supplierData = {
        name: data.name,
        contact: data.contact,
        address: data.address,
      };
      
      await addSupplier(supplierData as any);
      
      resetForm();
    } catch (error) {
      console.error('仕入先保存エラー:', error);
      setFormError({ key: 'error', msg: '仕入先の保存中にエラーが発生しました。' });
      scrollToError();
    }
  };
  
  const handleRowClick = (supplier: Supplier, rowIndex: number) => {
    console.log('Row clicked:', supplier, rowIndex);
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      address: supplier.address || '',
    });
    setIsEditing(true);
    setCurrentPage('edit');
  };

  const updateFormSubmit = async (supplier: Supplier) => {
    if (!supplier.id) {
      return; // IDがない場合は更新しない
    }
    
    try {
      await updateSupplier(supplier.id, supplier);
      resetForm();
    } catch (error) {
      console.error('仕入先更新エラー:', error);
      setFormError({ key: 'error', msg: '仕入先の更新中にエラーが発生しました。' });
      scrollToError();
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact: '',
      address: '',
    });
    setIsEditing(false);
    setCurrentPage('list');
    setFormError({ key: '', msg: '' }); // エラー状態もリセット
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('この仕入先を削除してもよろしいですか？')) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error('仕入先削除エラー:', error);
      }
    }
  };

  // テーブルのカラム定義
  const columns: TableColumn<Supplier>[] = [
    { header: 'ID', accessor: 'id' },
    { header: '仕入先名', accessor: 'name' },
    { header: '連絡先', accessor: 'contact' },
    { header: '住所', accessor: 'address' },
  ];

  return (
    <div className="space-y-4">
      {/* 仕入先一覧 - 常に表示するか、リスト表示時のみ表示 */}
      {currentPage === 'list' && (<>
            <div className="flex justify-end items-center">
                <Button
                onClick={createBtnHandler}
                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                >
                新規登録
                </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <Table
                columns={columns}
                data={suppliers}
                isLoading={isLoading}
                keyExtractor={(supplier: Supplier) => supplier.id}
                emptyMessage="データがありません"
                onRowClick={handleRowClick}
              />
            </div>
        </>
      )}

        {/* 仕入先登録/編集フォーム - ページ状態によって表示/非表示を制御 */}
        {(currentPage === 'create') && (
        <div className="">
          {/* エラー表示部分 */}
          <div ref={errorRef}>
            {formError.msg && (
              <div 
                className="p-4 mb-4 rounded-md" 
                style={{
                  background: formError.key === "warning" ? "#F4D03F" : "#FF6666",
                  color: "#FFFFFF",
                  fontWeight: "bold"
                }}
              >
                {formError.msg}
              </div>
            )}
          </div>
          
          <div className="p-6">
            <FormGenerator
              fields={getFormFields()}
              initialData={formData}
              onChange={handleChange}
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
      
      {currentPage === 'edit' && (
        <div className="w-full">
          {/* エラー表示部分 */}
          <div ref={errorRef}>
            {formError.msg && (
              <div 
                className="p-4 mb-4 rounded-md" 
                style={{
                  background: formError.key === "warning" ? "#F4D03F" : "#FF6666",
                  color: "#FFFFFF",
                  fontWeight: "bold"
                }}
              >
                {formError.msg}
              </div>
            )}
          </div>
          
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
                        onClick={() => {
                          if (validateForm(formData)) {
                            updateFormSubmit({...editingSupplier, ...formData} as Supplier);
                          } else {
                            scrollToError();
                          }
                        }}
                    >更新</Button>
                    
                    <Button
                        variant="outline"
                        className="bg-red-600 hover:bg-red-200 text-white border-red-600 flex items-center gap-1"
                        onClick={() => handleDelete(editingSupplier?.id as number)}
                    >
                        <Trash2 className="h-4 w-4" />
                        削除
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full">
                        <FormGenerator
                            fields={getFormFields()}
                            initialData={formData}
                            onChange={handleChange}
                            className="max-w-2xl mx-auto"
                        />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 p-3">
                <div className="flex flex-col md:flex-row gap-4">
                    準備中
                </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
