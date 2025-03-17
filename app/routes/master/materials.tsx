import { useEffect, useState, useRef } from 'react';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
// import type { Material, Category, Manufacturer } from '../../types';
import { 
  type Material
} from '../../sharedSchema/materialSchema';
// import { Decimal } from 'decimal.js';
import { Button, type ButtonProps } from '../../components/ui/button';
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Table, type TableColumn, type TableProps } from '../../components/ui/table';

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

export default function Materials() {
  const { materials, categories, manufacturers, suppliers, fetchMaterials, addMaterial, updateMaterial, deleteMaterial } = useMasterStore();
  // ナビゲーションストアを取得
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // 編集中の資材
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // ページ表示状態管理（'list', 'create', 'edit'）
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit'>('list');
  
  // 新規資材用のフォーム状態
  const [formData, setFormData] = useState<FormData>({
    name: '',
    specification: '',
    category_id: '',
    manufacturer_id: '',
    supplier_id: '',
    unit_weight: '',
    note: '',
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
    setPageTitle('資材');
    
    return () => {
      // コンポーネントのアンマウント時にリセット
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [setPageTitle, setBackButton]);
  
  // ページ状態が変わったときにタイトルと戻るボタンを更新
  useEffect(() => {
    if (currentPage === 'list') {
      setPageTitle('資材');
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
      await fetchMaterials();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchMaterials]);
  
  const createBtnHandler = () => {
    setCurrentPage('create');
  };

  // FormGeneratorのフィールド定義
  const getFormFields = (): FormFieldConfig[] => [
    {
      id: 'name',
      label: '資材名',
      elementType: 'input',
      required: true,
    },
    {
      id: 'specification',
      label: '規格',
      elementType: 'input',
    },
    {
      id: 'category_id',
      label: 'カテゴリ',
      elementType: 'select',
      required: true,
      options: categories.map(category => ({
        label: category.name,
        value: String(category.id)
      })),
    },
    {
      id: 'manufacturer_id',
      label: 'メーカー',
      elementType: 'select',
      required: true,
      options: manufacturers.map(manufacturer => ({
        label: manufacturer.name,
        value: String(manufacturer.id)
      })),
    },
    {
      id: 'supplier_id',
      label: '仕入先',
      elementType: 'select',
      required: true,
      options: suppliers.map(supplier => ({
        label: supplier.name,
        value: String(supplier.id)
      })),
    },
    {
      id: 'unit_weight',
      label: '単位重量 (g)',
      elementType: 'number',
      min: 0,
      step: 0.01,
    },
    {
        id: 'note',
        label: '備考',
        elementType: 'textarea',
    }
  ];
  
  // フォームのバリデーション関数
  const validateForm = (data: FormData): boolean => {
    if (!data.name || data.name.trim() === '') {
      setFormError({ key: 'error', msg: '資材名を入力してください。' });
      return false;
    }
    
    if (!data.category_id) {
      setFormError({ key: 'error', msg: 'カテゴリを選択してください。' });
      return false;
    }
    
    if (!data.manufacturer_id) {
      setFormError({ key: 'error', msg: 'メーカーを選択してください。' });
      return false;
    }
    
    if (!data.supplier_id) {
      setFormError({ key: 'error', msg: '仕入先を選択してください。' });
      return false;
    }
    
    // 単位重量が入力されている場合は数値チェック
    if (data.unit_weight && isNaN(Number(data.unit_weight))) {
      setFormError({ key: 'error', msg: '単位重量は数値で入力してください。' });
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
  
  // 型変換関数
  const convertFormToMaterial = (formData: FormData): Omit<Material, "id" | "created_at" | "updated_at"> => {
    // カテゴリ、サプライヤー、メーカーの参照を解決
    // const category = categories.find(c => c.id === Number(formData.category_id));
    // const supplier = suppliers.find(s => s.id === Number(formData.supplier_id));
    // const manufacturer = manufacturers.find(m => m.id === Number(formData.manufacturer_id));
    
    // if (!category) {
    //   throw new Error("カテゴリが見つかりません");
    // }
    
    return {
      name: formData.name,
      specification: formData.specification || '',
      category_id: Number(formData.category_id),
      manufacturer_id: Number(formData.manufacturer_id),
      supplier_id: Number(formData.supplier_id),
      unit_weight: formData.unit_weight || undefined,
      note: formData.note || '',
      // custom_attributesはFormDataにない可能性があるため型アサーション
      custom_attributes: (formData as any).custom_attributes || {},
      package_count: formData.package_count ? Number(formData.package_count) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // カテゴリ、メーカー、サプライヤーの名前を追加
    //   categoryName: category.name,
    //   manufacturerName: manufacturer?.name,
    //   supplierName: supplier?.name,
    };
  };
  
  // フォーム送信ハンドラ
  const handleFormSubmit = async (data: FormData) => {
    // バリデーションチェック
    if (!validateForm(data)) {
      scrollToError();
      return;
    }
    
    try {
      const materialData = convertFormToMaterial(data);

      await addMaterial(materialData);
      resetForm();
    } catch (error) {
      console.error('資材保存エラー:', error);
      setFormError({ key: 'error', msg: '資材の保存中にエラーが発生しました。' });
      scrollToError();
    }
  };
  
  const handleRowClick = (material: Material, rowIndex: number) => {
    console.log('Row clicked:', material, rowIndex);
    setEditingMaterial(material);
    
    // FormDataに変換
    const newFormData: FormData = {
      name: material.name,
      specification: material.specification || '',  
      category_id: String(material.category_id),
      manufacturer_id: material.manufacturer_id ? String(material.manufacturer_id) : '',
      supplier_id: material.supplier_id ? String(material.supplier_id) : '',
      unit_weight: material.unit_weight || '',
      note: material.note || '',
    };
    
    // カスタム属性が存在する場合は追加
    if (material.package_count) {
      newFormData.package_count = String(material.package_count);
    }
    
    setFormData(newFormData);
    setIsEditing(true);
    setCurrentPage('edit');
  };

  // 更新フォーム送信
  const updateFormSubmit = async (data: FormData) => {
    if (!editingMaterial || !editingMaterial.id) {
      return;
    }
    
    // バリデーションチェック
    if (!validateForm(data)) {
      scrollToError();
      return;
    }
    
    try {
      const materialData = convertFormToMaterial(data);
      await updateMaterial(editingMaterial.id, materialData);
      resetForm();
    } catch (error) {
      console.error('資材更新エラー:', error);
      setFormError({ key: 'error', msg: '資材の更新中にエラーが発生しました。' });
      scrollToError();
    }
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      specification: '',
      category_id: '',
      manufacturer_id: '',
      supplier_id: '',
      unit_weight: '',
      note: '',
    });
    setIsEditing(false);
    setCurrentPage('list');
    setFormError({ key: '', msg: '' }); // エラー状態もリセット
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('この資材を削除してもよろしいですか？')) {
      try {
        await deleteMaterial(id);
        setCurrentPage('list');
      } catch (error) {
        console.error('資材削除エラー:', error);
        setFormError({ key: 'error', msg: '資材の削除中にエラーが発生しました。' });
        scrollToError();
      }
    }
  };

  // テーブルのカラム定義
  const columns: TableColumn<Material>[] = [
    { header: 'ID', accessor: 'id' },
    { header: '資材名', accessor: 'name' },
    { header: '規格', accessor: 'specification' },
    { header: 'カテゴリ', accessor: 'category_name' },
    { header: 'メーカー', accessor: 'manufacturer_name' },
    { header: '仕入先', accessor: 'supplier_name' },
];

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
          {/* 資材一覧 - 常に表示するか、リスト表示時のみ表示 */}
          {currentPage === 'list' && (<>
                {/* <div className="p-6 border-gray-200 dark:border-gray-700">
                    <span className="text-mg font-semibold text-gray-900 dark:text-white">
                    {0+' 件'}
                    </span>
                </div> */}

                <div className="flex justify-end items-center">
                    <Button
                    onClick={createBtnHandler}
                    className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    data-testid="create-material-button"
                    >
                    新規登録
                    </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <Table
                    columns={columns}
                    data={materials}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    keyExtractor={(material) => material.id}
                    emptyMessage="データがありません"
                    rowProps={(material) => ({
                      'data-testid': `material-row-${material.id}`
                    })}
                  />
                </div>
            </>
          )}

            {/* 資材登録/編集フォーム - ページ状態によって表示/非表示を制御 */}
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
                    onClick={() => handleFormSubmit(formData)}
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
                <Tabs defaultValue="basic" className="w-full">
                    <div className="mb-4">
                        <TabsList>
                            <TabsTrigger value="basic" data-testid="basic-info-tab">基本情報</TabsTrigger>
                            <TabsTrigger value="history" data-testid="history-tab">履歴</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="basic" className="mt-0 p-3">
                        <div className="flex justify-end gap-2 -mt-14 mb-6">
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white" 
                                onClick={() => updateFormSubmit(formData)}
                                data-testid="update-material-button">更新</Button>
                            
                            <Button
                                variant="outline"
                                className="bg-red-600 hover:bg-red-200 text-white border-red-600 flex items-center gap-1"
                                onClick={() => handleDelete(editingMaterial?.id as number)}
                                data-testid="delete-material-button"
                            >
                                <Trash2 className="h-4 w-4" />
                                削除
                            </Button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/2">
                                <FormGenerator
                                    fields={getFormFields().slice(0, 10)}
                                    initialData={formData}
                                    onChange={handleChange}
                                    className="w-full"
                                />
                            </div>
                            <div className="w-full md:w-1/2">
                                <FormGenerator
                                    fields={getFormFields().slice(10)}
                                    initialData={formData}
                                    onChange={handleChange}
                                    className="w-full"
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
        </>
      )}
    </div>
  );
}
