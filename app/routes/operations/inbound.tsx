import { useState, useEffect } from 'react';
import { Decimal } from 'decimal.js';
import { useMasterStore } from '../../stores/masterStore';
import { useStockStore } from '../../stores/stockStore';
import type { Material, Vessel } from '../../types';
import { SampleStatus } from '../../types';

export default function Inbound() {
  const { materials, vessels, fetchMaterials, fetchVessels } = useMasterStore();
  const { addStock, loading, error } = useStockStore();
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'input' | 'weighing' | 'label' | 'reweighing' | 'complete'>('input');
  
  // フォーム状態
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [lot, setLot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageDate, setStorageDate] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // 重量関連
  const [vesselWeight, setVesselWeight] = useState<Decimal>(new Decimal(0));
  const [initialWeight, setInitialWeight] = useState<Decimal>(new Decimal(0));
  const [finalWeight, setFinalWeight] = useState<Decimal>(new Decimal(0));
  
  // 模擬的な秤の読み取り
  const [simulatedWeight, setSimulatedWeight] = useState<Decimal>(new Decimal(0));
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMaterials(), fetchVessels()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchMaterials, fetchVessels]);
  
  // 容器選択時に重量を設定
  useEffect(() => {
    if (selectedVessel) {
      setVesselWeight(selectedVessel.weight);
    } else {
      setVesselWeight(new Decimal(0));
    }
  }, [selectedVessel]);
  
  // 模擬的な秤の読み取り（実際の実装では秤からのデータを取得）
  const readScale = () => {
    // 模擬的な重量データ（実際の実装では秤からのデータを取得）
    const randomWeight = Math.random() * 100 + 50; // 50g〜150gの範囲でランダム
    return new Decimal(randomWeight.toFixed(3)); // 小数点第3位まで（0.001g精度）
  };
  
  const handleWeigh = () => {
    const weight = readScale();
    setSimulatedWeight(weight);
    return weight;
  };
  
  const handleInitialWeighing = () => {
    const weight = handleWeigh();
    setInitialWeight(weight);
    setStep('label');
  };
  
  const handleFinalWeighing = () => {
    const weight = handleWeigh();
    setFinalWeight(weight);
    setStep('complete');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMaterial || !lot || !expirationDate || !storageDate) {
      alert('必須項目を入力してください');
      return;
    }
    
    setStep('weighing');
  };
  
  const handleComplete = async () => {
    if (!selectedMaterial) return;
    
    // 正味重量の計算（最終重量 - 容器重量）
    const netWeight = finalWeight.minus(vesselWeight);
    
    // 在庫データの作成
    const stockData = {
      productName: selectedMaterial.name,
      lot,
      status: SampleStatus.STORED,
      registrationDate: new Date(),
      updateDate: new Date(),
      remarks,
      expirationDate: new Date(expirationDate),
      storageDate: new Date(storageDate),
      currentWeight: finalWeight,
      netWeight,
      vesselWeight,
      inboundWeight: finalWeight,
      materialId: selectedMaterial.id,
      material: selectedMaterial,
      vesselId: selectedVessel?.id,
      vessel: selectedVessel || undefined,
      creatorId: 1, // 仮のユーザーID
      creator: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date()
      },
      extraConfig: { purpose }
    };
    
    try {
      await addStock(stockData);
      // 成功時の処理（例：フォームのリセット）
      resetForm();
    } catch (error) {
      console.error('在庫登録エラー:', error);
    }
  };
  
  const resetForm = () => {
    setSelectedMaterial(null);
    setSelectedVessel(null);
    setLot('');
    setPurpose('');
    setExpirationDate('');
    setStorageDate('');
    setRemarks('');
    setVesselWeight(new Decimal(0));
    setInitialWeight(new Decimal(0));
    setFinalWeight(new Decimal(0));
    setSimulatedWeight(new Decimal(0));
    setStep('input');
  };
  
  // 日付のデフォルト値を設定
  useEffect(() => {
    const today = new Date();
    
    // 有効期限のデフォルト（1年後）
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    setExpirationDate(nextYear.toISOString().split('T')[0]);
    
    // 保管期限のデフォルト（6ヶ月後）
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);
    setStorageDate(sixMonthsLater.toISOString().split('T')[0]);
  }, []);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">入庫処理</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {step === 'input' && '基本情報入力'}
              {step === 'weighing' && '初回計量'}
              {step === 'label' && 'ラベル印刷'}
              {step === 'reweighing' && '再計量'}
              {step === 'complete' && '入庫完了'}
            </h2>
            
            {/* ステップインジケーター */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${step === 'input' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'weighing' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'label' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'reweighing' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'complete' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            </div>
          </div>
          
          {isLoading || loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 基本情報入力フォーム */}
              {step === 'input' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="material" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        資材 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="material"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedMaterial?.id || ''}
                        onChange={(e) => {
                          const materialId = Number(e.target.value);
                          const material = materials.find(m => m.id === materialId) || null;
                          setSelectedMaterial(material);
                        }}
                        required
                      >
                        <option value="">選択してください</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.specification || '規格なし'})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="vessel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        容器
                      </label>
                      <select
                        id="vessel"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedVessel?.id || ''}
                        onChange={(e) => {
                          const vesselId = Number(e.target.value);
                          const vessel = vessels.find(v => v.id === vesselId) || null;
                          setSelectedVessel(vessel);
                        }}
                      >
                        <option value="">選択してください</option>
                        {vessels.map((vessel) => (
                          <option key={vessel.id} value={vessel.id}>
                            {vessel.name} ({vessel.weight.toString()}g)
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
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        用途
                      </label>
                      <input
                        type="text"
                        id="purpose"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        有効期限 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="expirationDate"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="storageDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        保管期限 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="storageDate"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={storageDate}
                        onChange={(e) => setStorageDate(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        備考
                      </label>
                      <textarea
                        id="remarks"
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      onClick={resetForm}
                    >
                      リセット
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      次へ
                    </button>
                  </div>
                </form>
              )}
              
              {/* 初回計量 */}
              {step === 'weighing' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">計量</h3>
                    
                    <div className="flex flex-col items-center space-y-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">現在の読み取り値</p>
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {simulatedWeight.toString()} g
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleInitialWeighing}
                      >
                        計量する
                      </button>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        <p>容器重量: {vesselWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setStep('input')}
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}
              
              {/* ラベル印刷 */}
              {step === 'label' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ラベル印刷</h3>
                    
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">資材:</span>
                          <span className="text-sm">{selectedMaterial?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">ロット:</span>
                          <span className="text-sm">{lot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">有効期限:</span>
                          <span className="text-sm">{new Date(expirationDate).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">初期重量:</span>
                          <span className="text-sm">{initialWeight.toString()} g</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => {
                          // 実際の実装ではラベル印刷処理を行う
                          alert('ラベルを印刷しました。ラベルを貼り付けた後、再計量を行ってください。');
                          setStep('reweighing');
                        }}
                      >
                        ラベルを印刷
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setStep('weighing')}
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}
              
              {/* 再計量 */}
              {step === 'reweighing' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">再計量</h3>
                    
                    <div className="flex flex-col items-center space-y-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">現在の読み取り値</p>
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {simulatedWeight.toString()} g
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleFinalWeighing}
                      >
                        再計量する
                      </button>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        <p>初回計量: {initialWeight.toString()} g</p>
                        <p>容器重量: {vesselWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setStep('label')}
                    >
                      戻る
                    </button>
                  </div>
                </div>
              )}
              
              {/* 完了 */}
              {step === 'complete' && (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">入庫処理が完了しました</h3>
                    
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">資材:</span>
                          <span className="text-sm">{selectedMaterial?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">ロット:</span>
                          <span className="text-sm">{lot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">最終重量:</span>
                          <span className="text-sm">{finalWeight.toString()} g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">正味重量:</span>
                          <span className="text-sm">{finalWeight.minus(vesselWeight).toString()} g</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleComplete}
                      >
                        登録して完了
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 