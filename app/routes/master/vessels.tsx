import { useEffect, useState, useRef } from 'react';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { type Vessel } from '../../sharedSchema/vesselSchema';
import { Button } from '../../components/ui/button';
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Table, type TableColumn } from '../../components/ui/table';

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

export default function Vessels() {
  const { vessels, fetchVessels, addVessel, updateVessel, deleteVessel } = useMasterStore();
  // ナビゲーションストアを取得
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // 編集中の容器
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // ページ表示状態管理（'list', 'create', 'edit'）
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit'>('list');
  
  // 新規容器用のフォーム状態
  const [formData, setFormData] = useState({
    name: '',
    weight: '',
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
    setPageTitle('容器');
    
    return () => {
      // コンポーネントのアンマウント時にリセット
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [setPageTitle, setBackButton]);
  
  // ページ状態が変わったときにタイトルと戻るボタンを更新
  useEffect(() => {
    if (currentPage === 'list') {
      setPageTitle('容器');
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
      await fetchVessels();
      
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchVessels]);
  
  const createBtnHandler = () => {
    setCurrentPage('create');
  };

  // FormGeneratorのフィールド定義
  const getFormFields = (): FormFieldConfig[] => [
    {
      id: 'name',
      label: '容器名',
      elementType: 'input',
      required: true,
    },
    {
      id: 'weight',
      label: '重量 (g)',
      elementType: 'input',
      inputType: 'number',
      required: true,
    },
  ];
  
  // フォームのバリデーション関数
  const validateForm = (data: FormData): boolean => {
    if (!data.name || data.name.trim() === '') {
      setFormError({ key: 'error', msg: '容器名を入力してください。' });
      return false;
    }
    
    if (!data.weight || data.weight.trim() === '') {
      setFormError({ key: 'error', msg: '重量を入力してください。' });
      return false;
    }
    
    // 重量が数値であることを確認
    if (isNaN(parseFloat(data.weight))) {
      setFormError({ key: 'error', msg: '重量は数値で入力してください。' });
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
      const vesselData = {
        name: data.name,
        weight: data.weight,
      };
      
      await addVessel(vesselData as any);
      
      resetForm();
    } catch (error) {
      console.error('容器保存エラー:', error);
      setFormError({ key: 'error', msg: '容器の保存中にエラーが発生しました。' });
      scrollToError();
    }
  };
  
  const handleRowClick = (vessel: Vessel, rowIndex: number) => {
    console.log('Row clicked:', vessel, rowIndex);
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      weight: vessel.weight,
    });
    setIsEditing(true);
    setCurrentPage('edit');
  };

  const updateFormSubmit = async (vessel: Vessel) => {
    if (!vessel.id) {
      return; // IDがない場合は更新しない
    }
    
    try {
      // material_idを正しく設定
      const vesselData = {
        ...vessel,
      };
      await updateVessel(vessel.id, vesselData);
      resetForm();
    } catch (error) {
      console.error('容器更新エラー:', error);
      setFormError({ key: 'error', msg: '容器の更新中にエラーが発生しました。' });
      scrollToError();
    }
  };

  const resetForm = () => {
    setEditingVessel(null);
    setFormData({
      name: '',
      weight: '',
    });
    setIsEditing(false);
    setCurrentPage('list');
    setFormError({ key: '', msg: '' }); // エラー状態もリセット
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('この容器を削除してもよろしいですか？')) {
      try {
        await deleteVessel(id);
        setCurrentPage('list');
      } catch (error) {
        console.error('容器削除エラー:', error);
        setFormError({ key: 'error', msg: '容器の削除中にエラーが発生しました。' });
        scrollToError();
      }
    }
  };

  // テーブルのカラム定義
  const columns: TableColumn<Vessel>[] = [
    { header: 'ID', accessor: 'id' },
    { header: '容器名', accessor: 'name' },
    { header: '重量 (g)', accessor: 'weight' },
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
          {/* 容器一覧 - 常に表示するか、リスト表示時のみ表示 */}
          {currentPage === 'list' && (<>
                <div className="flex justify-end items-center">
                    <Button
                    onClick={createBtnHandler}
                    className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    data-testid="create-vessel-button"
                    >
                    新規登録
                    </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <Table
                    columns={columns}
                    data={vessels}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    keyExtractor={(vessel) => vessel.id}
                    emptyMessage="データがありません"
                    rowProps={(vessel) => ({
                      'data-testid': `vessel-row-${vessel.id}`
                    })}
                  />
                </div>
            </>
          )}

          {/* 容器登録/編集フォーム - ページ状態によって表示/非表示を制御 */}
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
                    data-testid="submit-vessel-button"
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
                        <TabsTrigger value="basic" data-testid="basic-info-tab">基本情報</TabsTrigger>
                        <TabsTrigger value="history" data-testid="history-tab">履歴</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="basic" className="mt-0 p-3">
                    <div className="flex justify-end gap-2 -mt-14 mb-6">
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white" 
                            onClick={() => {
                              if (validateForm(formData)) {
                                updateFormSubmit({...editingVessel, ...formData} as Vessel);
                              } else {
                                scrollToError();
                              }
                            }}
                            data-testid="update-vessel-button"
                        >更新</Button>
                        
                        <Button
                            variant="outline"
                            className="bg-red-600 hover:bg-red-200 text-white border-red-600 flex items-center gap-1"
                            onClick={() => handleDelete(editingVessel?.id as number)}
                            data-testid="delete-vessel-button"
                        >
                            <Trash2 className="h-4 w-4" />
                            削除
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/2">
                            <FormGenerator
                                fields={getFormFields()}
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