import { useEffect, useState, useRef } from 'react';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
// import type { Material, Category, Manufacturer } from '../../types';
import { 
  type Material
} from '../../sharedSchema/materialSchema';
import { Button, type ButtonProps } from '../../components/ui/button';
// import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import FormGenerator, { type FormFieldConfig } from '../../components/ui/FormGenerator';
// import { Table, type TableColumn, type TableProps } from '../../components/ui/table';
import { VirtualizedGridTable } from "../../components/ui/boxgrid/virtualized-grid-table"
import { createColumnHelper } from "@tanstack/react-table"

// // Define the data type
// interface LocationData {
//   officialName: string
//   name: string
//   postalCode?: string
//   prefecture: string
//   status: string
//   rawStatus: string
//   __status__: string
// }

// const data: LocationData[] = [
//   { officialName: "拠点D", name: "拠点D", postalCode: "", prefecture: "北海道", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "test2", name: "test3", postalCode: "", prefecture: "愛知県", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "新規拠点", name: "新規拠点", postalCode: "", prefecture: "北海道", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "企画推進部", name: "企画推進部", postalCode: "562-0035", prefecture: "大阪府", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "西日本営業部", name: "西日本", postalCode: "", prefecture: "滋賀県", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "220307 動作確認", name: "220703", postalCode: "", prefecture: "大阪府", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "220306 動作確認", name: "220306 動作確認", postalCode: "", prefecture: "大阪府", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "西日本営業部", name: "西日本営業部", postalCode: "525-0058", prefecture: "滋賀県", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },
//   { officialName: "Tラボラトリー", name: "Tラボ", postalCode: "", prefecture: "滋賀県", status: "有効", rawStatus: "active", __status__: `<div class="tableCellButton" style="background: #28a745">有効</div>` },

//   { officialName: "拠点D", name: "拠点D", postalCode: "", prefecture: "北海道", status: "無効", rawStatus: "inactive", __status__: `<div class="tableCellButton" style="background: #dc3545">無効</div>` },
//   { officialName: "test2", name: "test3", postalCode: "", prefecture: "愛知県", status: "無効", rawStatus: "inactive", __status__: `<div class="tableCellButton" style="background: #dc3545">無効</div>` },
//   { officialName: "新規拠点", name: "新規拠点", postalCode: "", prefecture: "北海道", status: "無効", rawStatus: "inactive", __status__: `<div class="tableCellButton" style="background: #dc3545">無効</div>` },
// ]

const columnHelper = createColumnHelper()
const materialColumns = [
  columnHelper.accessor("name", {
    header: "資材名",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("specification", {
    header: "規格",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("categoryName", {
    header: "カテゴリ",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("manufacturerName", {
    header: "メーカー",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("supplierName", {
    header: "仕入先",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("vesselName", {
    header: "容器",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("unitWeight", {
    header: "単位重量(g)",
    cell: (info) => info.getValue() || "",
  }),
  columnHelper.accessor("enableLotControl", {
    header: "ロット管理",
    cell: (info) => info.getValue() ? "有効" : "無効",
  }),
  columnHelper.accessor("enableWeightControl", {
    header: "重量管理",
    cell: (info) => info.getValue() ? "有効" : "無効",
  }),
  columnHelper.accessor("note", {
    header: "備考",
    cell: (info) => info.getValue() || "",
  }),
]

// ユーティリティ関数
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ");

// MaterialsページのFormData型を独自に定義
interface MaterialFormData extends Record<string, string> {
  name: string;
  specification: string;
  categoryId: string;
  manufacturerId: string;
  supplierId: string;
  vesselId: string;
  unitWeight: string;
  note: string;
  enableLotControl: string;
  enableWeightControl: string;
}

export default function Materials() {
  const { materials, categories, manufacturers, suppliers, vessels, fetchMaterials, addMaterial, updateMaterial, deleteMaterial } = useMasterStore();
  // ナビゲーションストアを取得
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // 編集中の資材
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // ページ表示状態管理（'list', 'create', 'edit'）
  const [currentPage, setCurrentPage] = useState<'list' | 'create' | 'edit'>('list');
  
  // 新規資材用のフォーム状態
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    specification: '',
    categoryId: '',
    manufacturerId: '',
    supplierId: '',
    vesselId: '',
    unitWeight: '',
    note: '',
    enableLotControl: 'false',
    enableWeightControl: 'false',
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
      id: 'categoryId',
      label: 'カテゴリ',
      elementType: 'select',
      required: true,
      options: categories.map(category => ({
        label: category.name,
        value: String(category.id)
      })),
    },
    {
      id: 'manufacturerId',
      label: 'メーカー',
      elementType: 'select',
      required: true,
      options: manufacturers.map(manufacturer => ({
        label: manufacturer.name,
        value: String(manufacturer.id)
      })),
    },
    {
      id: 'supplierId',
      label: '仕入先',
      elementType: 'select',
      required: true,
      options: suppliers.map(supplier => ({
        label: supplier.name,
        value: String(supplier.id)
      })),
    },
    {
      id: 'vesselId',
      label: '容器タイプ',
      elementType: 'select',
      required: true,
      options: vessels.map(vessel => ({
          label: vessel.name,
          value: String(vessel.id)
        })),
    },
    {
      id: 'unitWeight',
      label: '単位量 (g)',
      elementType: 'input',
    },
    {
      id: 'note',
      label: '備考',
      elementType: 'textarea',
    },
    {
      id: 'enableLotControl',
      label: 'ロット管理',
      elementType: 'select',
      options: [
        { label: '有効', value: 'true' },
        { label: '無効', value: 'false' }
      ],
    },
    {
      id: 'enableWeightControl',
      label: '重量管理',
      elementType: 'select',
      options: [
        { label: '有効', value: 'true' },
        { label: '無効', value: 'false' }
      ],
    },
  ];

  // フォームバリデーション
  const validateForm = (data: MaterialFormData): boolean => {
    // 必須項目のチェック
    if (!data.name || data.name.trim() === '') {
      setFormError({
        key: 'error',
        msg: '資材名は必須です'
      });
      return false;
    }

    if (!data.vesselId) {
      setFormError({
        key: 'error',
        msg: '容器は必須です'
      });
      return false;
    }

    if (!data.manufacturerId) {
      setFormError({
        key: 'error',
        msg: 'メーカーは必須です'
      });
      return false;
    }

    if (!data.supplierId) {
      setFormError({
        key: 'error',
        msg: '仕入先は必須です'
      });
      return false;
    }

    // エラーをクリア
    setFormError({ key: '', msg: '' });
    return true;
  };

  // エラー表示位置までスクロール
  const scrollToError = () => {
    if (errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // フォームデータをMaterialオブジェクトに変換
  const convertFormToMaterial = (formData: MaterialFormData): Omit<Material, "id" | "createdAt" | "updatedAt"> => {
    return {
      name: formData.name,
      specification: formData.specification || '',
      customAttributes: {},
      packageCount: undefined,
      unitWeight: formData.unitWeight || '',
      supplierId: parseInt(formData.supplierId),
      manufacturerId: parseInt(formData.manufacturerId),
      categoryId: parseInt(formData.categoryId),
      vesselId: formData.vesselId ? parseInt(formData.vesselId) : undefined,
      note: formData.note || '',
      enableLotControl: formData.enableLotControl === 'true',
      enableWeightControl: formData.enableWeightControl === 'true',
    };
  };

  // 新規資材登録
  const handleFormSubmit = async (data: Record<string, string>) => {
    // 型アサーションでMaterialFormDataに変換
    const typedData = data as MaterialFormData;
    if (!validateForm(typedData)) {
      scrollToError();
      return;
    }
        
    try {
      const materialData = convertFormToMaterial(typedData);
      try {
        await addMaterial(materialData);
        setCurrentPage('list');
        resetForm();
      } catch (error: any) {
        console.error('資材登録中にエラーが発生しました:', error);
        // レスポンスからエラーメッセージを取得
        const errorMessage = error.response?.data?.error || '資材の登録に失敗しました';
        const errorDetails = error.response?.data?.details;
        
        let detailMessage = '';
        if (errorDetails) {
          // バリデーションエラーの詳細を表示
          Object.keys(errorDetails).forEach(key => {
            if (key !== '_errors' && errorDetails[key]._errors.length > 0) {
              detailMessage += `${key}: ${errorDetails[key]._errors.join(', ')} `;
            }
          });
        }
        
        setFormError({
          key: 'error',
          msg: `${errorMessage}${detailMessage ? ` (${detailMessage})` : ''}`
        });
        scrollToError();
      }
    } catch (error) {
      console.error('資材登録中にエラーが発生しました:', error);
      setFormError({
        key: 'error',
        msg: 'フォームデータの処理に失敗しました'
      });
      scrollToError();
    }
  };

  // 資材詳細表示
  const handleRowClick = (material: ExtendedMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      specification: material.specification || '',
      categoryId: material.categoryId.toString(),
      manufacturerId: material.manufacturerId.toString(),
      supplierId: material.supplierId.toString(),
      vesselId: material.vesselId ? material.vesselId.toString() : '',
      unitWeight: material.unitWeight || '',
      note: material.note || '',
      enableLotControl: material.enableLotControl ? 'true' : 'false',
      enableWeightControl: material.enableWeightControl ? 'true' : 'false',
    });
    setCurrentPage('edit');
  };

  // 資材更新
  const updateFormSubmit = async (data: Record<string, string>) => {
    // 型アサーションでMaterialFormDataに変換
    const typedData = data as MaterialFormData;
    if (!validateForm(typedData)) {
      scrollToError();
      return;
    }
    
    if (!editingMaterial) return;
    
    try {
      const materialData = convertFormToMaterial(typedData);
      
      // 資材IDと更新データを分けて渡す
      await updateMaterial(editingMaterial.id, materialData);
      
      setCurrentPage('list');
      setEditingMaterial(null);
      resetForm();
    } catch (error) {
      console.error('資材更新中にエラーが発生しました:', error);
      setFormError({
        key: 'error',
        msg: '資材の更新に失敗しました'
      });
      scrollToError();
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      name: '',
      specification: '',
      categoryId: '',
      manufacturerId: '',
      supplierId: '',
      vesselId: '',
      unitWeight: '',
      note: '',
      enableLotControl: 'false',
      enableWeightControl: 'false',
    });
    setCurrentPage('list');
    setEditingMaterial(null);
    setFormError({ key: '', msg: '' });
  };

  // 資材削除
  const handleDelete = async (id: number) => {
    if (window.confirm('この資材を削除しますか？\n削除すると元に戻せません。')) {
      try {
        await deleteMaterial(id);
      } catch (error) {
        console.error('資材削除中にエラーが発生しました:', error);
        alert('資材の削除に失敗しました');
      }
    }
  };

  // ページコンテンツ
  return (
    <div>
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
    
      {/* 各ページ状態に応じた表示 */}
      {currentPage === 'list' ? (
        // 一覧ページ
        <>
          <div className="flex justify-between items-center">
            {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-white">資材マスター</h1> */}
            
            {/*　左寄せに修正  */}
            <Button className="ml-auto" onClick={createBtnHandler}>
              新規登録
            </Button>
          </div>
          
          {/* 資材一覧テーブル */}
          <Tabs defaultValue="list">
            {/* <TabsList>
              <TabsTrigger value="list">リスト表示</TabsTrigger>
              <TabsTrigger value="grid">グリッド表示</TabsTrigger>
            </TabsList> */}
            
            <TabsContent value="list" className="mt-4">
              <VirtualizedGridTable
                data={materials as ExtendedMaterial[]}
                columns={materialColumns}
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
            </TabsContent>
            
            {/* <TabsContent value="grid" className="mt-4">
              <div style={{ height: '500px' }}>
                <VirtualizedGridTable<LocationData>
                  isLoading={false}
                  data={data}
                  columns={columns}
                  onRowClick={(row) => console.log(row)}
                  filterText={''}
                  headerRenderer={(column) => {
                    return (
                      <div style={{ textAlign: "left" }}>
                        {column.header}
                      </div>
                    );
                  }}
                  cellRenderer={(args) => {
                    const isHTML = args.column.meta?.isHTML;
                    const value = args.info.getValue();
                    
                    return (
                      <div style={{ padding: "4px", textAlign: "left" }}>
                        {isHTML ? <div dangerouslySetInnerHTML={{ __html: value }} /> : value}
                      </div>
                    );
                  }}
                />
              </div>
            </TabsContent> */}
          </Tabs>
        </>
      ) : (
        // 作成/編集フォーム
        <>
          {/* <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentPage === 'create' ? '新規資材登録' : '資材編集'}
            </h1>
          </div> */}
          
          <div className="bg-white dark:bg-gray-800 p-6 w-2/3 mx-auto rounded-lg shadow">
            <FormGenerator
              fields={getFormFields()}
              initialData={formData}
              onChange={handleChange}
              onSubmit={currentPage === 'create' ? handleFormSubmit : updateFormSubmit}
            >
              <div className="flex justify-center mt-4">
                <Button type="submit" className="bg-blue-600 text-white">
                  {currentPage === 'create' ? '新規登録' : '更新'}
                </Button>
              </div>
            </FormGenerator>
          </div>
        </>
      )}
    </div>
  );
}
