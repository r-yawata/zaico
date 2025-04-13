import { useEffect, useState, useRef } from 'react';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { type Supplier } from '../../sharedSchema/supplierSchema';
import { Button } from '../../components/ui/button';
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { VirtualizedGridTable } from "../../components/ui/boxgrid/virtualized-grid-table"
import { createColumnHelper } from "@tanstack/react-table"

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

// カラムヘルパーの作成
const columnHelper = createColumnHelper<Supplier>()
const supplierColumns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("name", {
    header: "仕入先名",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("contact", {
    header: "連絡先",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("address", {
    header: "住所",
    cell: (info) => info.getValue(),
  }),
];

// FormFieldConfigの型を拡張
interface ExtendedFormFieldConfig extends FormFieldConfig {
  inputType?: string;
}

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
  const getFormFields = (): ExtendedFormFieldConfig[] => [
    {
      id: 'name',
      label: '仕入先名',
      elementType: 'input',
      required: true,
    },
    // {
    //   id: 'contact',
    //   label: '連絡先',
    //   elementType: 'input',
    //   required: true,
    // },
    // {
    //   id: 'address',
    //   label: '住所',
    //   elementType: 'input',
    //   required: true,
    // },
  ];
  
  // フォームのバリデーション関数
  const validateForm = (data: FormData): boolean => {
    if (!data.name || data.name.trim() === '') {
      setFormError({ key: 'error', msg: '仕入先名を入力してください。' });
      return false;
    }
    
    // if (!data.contact || data.contact.trim() === '') {
    //   setFormError({ key: 'error', msg: '連絡先を入力してください。' });
    //   return false;
    // }
    
    // if (!data.address || data.address.trim() === '') {
    //   setFormError({ key: 'error', msg: '住所を入力してください。' });
    //   return false;
    // }
    
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
      
      // フォームをクリアするが、画面遷移はしない
      clearForm();
    } catch (error) {
      console.error('仕入先保存エラー:', error);
      setFormError({ key: 'error', msg: '仕入先の保存中にエラーが発生しました。' });
      scrollToError();
    }
  };
  
  const handleRowClick = (supplier: Supplier) => {
    console.log('Row clicked:', supplier);
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      address: supplier.address || '',
    });
    setIsEditing(true);
    setCurrentPage('edit');
  };

  const updateFormSubmit = async (data: FormData) => {
    if (!editingSupplier) {
      return; // 編集中の仕入先がない場合は更新しない
    }
    
    try {
      const supplierData = {
        ...editingSupplier,
        name: data.name,
        contact: data.contact,
        address: data.address,
      };
      await updateSupplier(editingSupplier.id, supplierData);
      resetForm();
    } catch (error) {
      console.error('仕入先更新エラー:', error);
      setFormError({ key: 'error', msg: '仕入先の更新中にエラーが発生しました。' });
      scrollToError();
    }
  };

  // 元のresetFormはそのまま残す（戻るボタンなどで使用）
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
  
  // フォームの内容だけをクリアする新しい関数を追加
  const clearForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact: '',
      address: '',
    });
    setIsEditing(false);
    setFormError({ key: '', msg: '' }); // エラー状態もリセット
    // 成功メッセージを表示
    setFormError({ key: 'warning', msg: '仕入先を登録しました。続けて登録できます。' });
    scrollToError();
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('この仕入先を削除してもよろしいですか？')) {
      try {
        await deleteSupplier(id);
        setCurrentPage('list');
      } catch (error) {
        console.error('仕入先削除エラー:', error);
        setFormError({ key: 'error', msg: '仕入先の削除中にエラーが発生しました。' });
        scrollToError();
      }
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">データを読み込み中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 仕入先一覧 - 常に表示するか、リスト表示時のみ表示 */}
          {currentPage === 'list' && (<>
                <div className="flex justify-end items-center">
                    <Button
                    onClick={createBtnHandler}
                    className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    data-testid="create-supplier-button"
                    >
                    新規登録
                    </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <VirtualizedGridTable
                    data={suppliers}
                    columns={supplierColumns}
                    enableSelection={false}
                    enableFiltering={true}
                    enableSorting={true}
                    height="calc(100vh - 300px)"
                    onRowSelectionChange={(rows) => {
                      if (rows.length === 1) {
                        handleRowClick(rows[0].original);
                      }
                    }}
                  />
                </div>
            </>
          )}

          {/* 仕入先登録/編集フォーム - ページ状態によって表示/非表示を制御 */}
          {(currentPage === 'create') && (
            <div className="">
              {/* エラー表示部分 */}
              <div ref={errorRef}>
                {formError.key && (
                  <div className={`p-4 mb-4 rounded-md ${
                    formError.key === 'error' 
                      ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {formError.msg}
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 w-2/3 mx-auto rounded-lg shadow">
                <FormGenerator
                  fields={getFormFields()}
                  initialData={formData}
                  onChange={handleChange}
                  onSubmit={currentPage === 'create' ? handleFormSubmit : updateFormSubmit}
                >
                  <div className="flex justify-center mt-4">
                    <Button type="submit" className="bg-blue-600 text-white">
                      {'新規登録'}
                    </Button>
                  </div>
                </FormGenerator>
              </div>
            </div>
          )}

          {/* 編集フォーム */}
          {(currentPage === 'edit') && (
            <div className="">
              {/* エラー表示部分 */}
              <div ref={errorRef}>
                {formError.key && (
                  <div className={`p-4 mb-4 rounded-md ${
                    formError.key === 'error' 
                      ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {formError.msg}
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <FormGenerator
                  fields={getFormFields()}
                  initialData={formData}
                  onChange={handleChange}
                  onSubmit={updateFormSubmit}
                >
                  <div className="flex justify-center mt-4">
                    <Button type="submit" className="bg-blue-600 text-white">
                      更新
                    </Button>
                  </div>
                </FormGenerator>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
