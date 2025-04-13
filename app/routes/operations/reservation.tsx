import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useReservationStore } from '../../stores/reservationStore';
import { useMasterStore } from '../../stores/masterStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { Decimal } from 'decimal.js';
import FormGenerator, { type FormFieldConfig as BaseFormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Button } from '../../components/ui/button';

// 拡張したFormFieldConfigインターフェース
interface ExtendedFormFieldConfig extends BaseFormFieldConfig {
  showOnLabel?: boolean;
  displayFn?: (value: string) => string;
}

export default function Reservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const { reservations, fetchReservations, addReservation, deleteReservation } = useReservationStore();
  const { materials, fetchMaterials } = useMasterStore();
  const { setPageTitle, setBackButton } = useNavigationStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // フォーム用の状態
  const [formData, setFormData] = useState({
    materialId: '',
    lot: '',
    usage: '',
    requiredAmount: '',
    outboundDate: '',
    returnDate: '',
    testName: '',
    remarks: ''
  });
  
  // ページ表示時にタイトルとバックボタンを設定
  useEffect(() => {
    setPageTitle('出庫予約');
    
    // 在庫画面から来た場合は、戻るボタンで在庫画面に戻れるようにする
    if (returnTo === 'inventory') {
      setBackButton(true, () => navigate('/inventory'));
    } else {
      setBackButton(false);
    }
    
    return () => {
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [returnTo, navigate, setPageTitle, setBackButton]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReservations(), fetchMaterials()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchReservations, fetchMaterials]);
  
  // 日付のデフォルト値を設定
  useEffect(() => {
    const today = new Date();
    
    // 出庫予定日のデフォルト（当日）
    const outboundDate = new Date(today);
    
    // 返却予定日のデフォルト（7日後）
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 7);
    
    setFormData(prev => ({
      ...prev,
      outboundDate: outboundDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0]
    }));
  }, []);
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (data: FormData) => {
    if (!data.materialId || !data.lot || !data.requiredAmount || !data.outboundDate || !data.returnDate) {
      return; // 必須項目がない場合は処理しない
    }
    
    try {
      const materialId = Number(data.materialId);
      const material = materials.find(m => m.id === materialId);
      if (!material) return;
      
      // materialオブジェクトをコピーしてcreatedAtとupdatedAtをDate型に変換
      const materialWithDateTypes = {
        ...material,
        createdAt: typeof material.createdAt === 'string' ? new Date(material.createdAt) : material.createdAt,
        updatedAt: typeof material.updatedAt === 'string' ? new Date(material.updatedAt) : material.updatedAt
      };
      
      const newReservation = {
        materialId: Number(data.materialId),
        material: materialWithDateTypes,
        lot: data.lot as string,
        usage: data.usage as string,
        requiredAmount: new Decimal(data.requiredAmount as string),
        outboundDate: new Date(data.outboundDate as string),
        returnDate: new Date(data.returnDate as string),
        testName: data.testName as string,
        remarks: data.remarks as string,
        creatorId: 1, // ダミーのユーザーID
        creator: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      await addReservation(newReservation);
      
      // 在庫画面から来た場合は、処理完了後に在庫画面に戻る
      if (returnTo === 'inventory') {
        navigate('/inventory');
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('予約登録エラー:', error);
    }
  };
  
  const resetForm = () => {
    const today = new Date();
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 7);
    
    setFormData({
      materialId: '',
      lot: '',
      usage: '',
      requiredAmount: '',
      outboundDate: today.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      testName: '',
      remarks: ''
    });
  };
  
  // FormGeneratorのフィールド定義
  const getFormFields = (): ExtendedFormFieldConfig[] => [
    {
      id: 'materialId',
      label: '資材',
      elementType: 'select',
      required: true,
      showOnLabel: true,
      displayFn: (value: string) => materials.find(m => m.id === Number(value))?.name || '',
      options: materials.map(material => ({
        label: `${material.name} ${material.specification ? `(${material.specification})` : ''}`,
        value: String(material.id)
      }))
    },
    {
      id: 'lot',
      label: 'ロット番号',
      elementType: 'input',
      required: true,
      showOnLabel: true,
    },
    {
      id: 'usage',
      label: '使用目的',
      elementType: 'input',
      showOnLabel: true,
    },
    {
      id: 'requiredAmount',
      label: '必要量 (g)',
      elementType: 'number',
      required: true,
      min: 0,
      step: 0.01,
      showOnLabel: true,
    },
    {
      id: 'outboundDate',
      label: '出庫予定日',
      elementType: 'date',
      required: true,
      showOnLabel: true,
      displayFn: (value) => new Date(value).toLocaleDateString('ja-JP'),
    },
    {
      id: 'returnDate',
      label: '返却予定日',
      elementType: 'date',
      required: true,
      showOnLabel: true,
      displayFn: (value) => new Date(value).toLocaleDateString('ja-JP'),
    },
    {
      id: 'testName',
      label: '試験名',
      elementType: 'input',
      showOnLabel: true,
    },
    {
      id: 'remarks',
      label: '備考',
      elementType: 'textarea',
      showOnLabel: true,
    }
  ];
  
  // 日付のフォーマット
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="space-y-6">
      {/* 予約フォーム */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">出庫予約</h2>
        </div> */}
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <FormGenerator
              fields={getFormFields()}
              initialData={formData}
              onSubmit={handleSubmit}
              onChange={handleChange}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                リセット
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleSubmit(formData)}
              >
                予約登録
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 予約一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">予約一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">資材</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ロット</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">必要量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">出庫予定日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">返却予定日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{reservation.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{reservation.material.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{reservation.lot}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {reservation.requiredAmount.toString()}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(reservation.outboundDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(reservation.returnDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => {/* 詳細表示 */}}
                      >
                        詳細
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => deleteReservation(reservation.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    予約データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 