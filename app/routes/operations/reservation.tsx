import { useEffect, useState } from 'react';
import { useReservationStore } from '../../stores/reservationStore';
import { useMasterStore } from '../../stores/masterStore';
import { Decimal } from 'decimal.js';

export default function Reservation() {
  const { reservations, fetchReservations, addReservation, deleteReservation } = useReservationStore();
  const { materials, fetchMaterials } = useMasterStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // フォーム用の状態
  const [materialId, setMaterialId] = useState<number | ''>('');
  const [lot, setLot] = useState('');
  const [usage, setUsage] = useState('');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [testName, setTestName] = useState('');
  const [remarks, setRemarks] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReservations(), fetchMaterials()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchReservations, fetchMaterials]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!materialId || !lot || !requiredAmount || !outboundDate || !returnDate) {
      return; // 必須項目がない場合は処理しない
    }
    
    try {
      const material = materials.find(m => m.id === materialId);
      if (!material) return;
      
      const newReservation = {
        materialId: Number(materialId),
        material,
        lot,
        usage,
        requiredAmount: new Decimal(requiredAmount),
        outboundDate: new Date(outboundDate),
        returnDate: new Date(returnDate),
        testName,
        remarks,
        creatorId: 1, // ダミーのユーザーID
        creator: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      };
      
      await addReservation(newReservation);
      resetForm();
    } catch (error) {
      console.error('予約登録エラー:', error);
    }
  };
  
  const resetForm = () => {
    setMaterialId('');
    setLot('');
    setUsage('');
    setRequiredAmount('');
    setOutboundDate('');
    setReturnDate('');
    setTestName('');
    setRemarks('');
  };
  
  // 日付のフォーマット
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">出庫予約</h1>
      
      {/* 予約フォーム */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">新規予約登録</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  資材 <span className="text-red-500">*</span>
                </label>
                <select
                  id="material"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">選択してください</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="lot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ロット番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lot"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="usage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  使用目的
                </label>
                <input
                  type="text"
                  id="usage"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="requiredAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  必要量 (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="requiredAmount"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  step="0.01"
                  value={requiredAmount}
                  onChange={(e) => setRequiredAmount(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="outboundDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  出庫予定日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="outboundDate"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={outboundDate}
                  onChange={(e) => setOutboundDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  返却予定日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="returnDate"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="testName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  試験名
                </label>
                <input
                  type="text"
                  id="testName"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  備考
                </label>
                <textarea
                  id="remarks"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors mr-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={resetForm}
              >
                リセット
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                予約登録
              </button>
            </div>
          </form>
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