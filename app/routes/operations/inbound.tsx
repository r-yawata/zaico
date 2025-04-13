import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Decimal } from 'decimal.js';
import { useMasterStore } from '../../stores/masterStore';
import { useStockStore } from '../../stores/stockStore';
import { SampleStatus } from '../../types';
import { useNavigationStore } from '../../stores/navigationStore';
import FormGenerator, { type FormFieldConfig as BaseFormFieldConfig, type FormData } from '../../components/ui/FormGenerator';
import { Button } from '../../components/ui/button';
import Stepper from '../../components/ui/stepIndicator';

// 拡張したFormFieldConfigインターフェース
interface ExtendedFormFieldConfig extends BaseFormFieldConfig {
  showOnLabel?: boolean;
  displayFn?: (value: string) => string;
}

export default function Inbound() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const stockId = searchParams.get('stockId');
  const mode = searchParams.get('mode');
  
  const { materials, vessels, fetchMaterials, fetchVessels } = useMasterStore();
  const { addStock, loading, error } = useStockStore();
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'input' | 'weighing' | 'label' | 'reweighing' | 'complete'>('input');
  
  // フォーム状態
  const [formData, setFormData] = useState({
    materialId: '',
    lot: '',
    purpose: '',
    expirationDate: '',
    storageDate: '',
    remarks: '',
    quantity: '1' // 数量フィールドの追加（デフォルトは1）
  });
  
  // 重量関連
  const [vesselWeight, setVesselWeight] = useState<Decimal>(new Decimal(0));
  const [initialWeight, setInitialWeight] = useState<Decimal>(new Decimal(0));
  const [finalWeight, setFinalWeight] = useState<Decimal>(new Decimal(0));
  
  // 模擬的な秤の読み取り
  const [simulatedWeight, setSimulatedWeight] = useState<Decimal>(new Decimal(0));
  
  // 登録中フラグ
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { setPageTitle, setBackButton } = useNavigationStore();

  // URLパラメータから初期データを設定（再入庫モードの場合）
  useEffect(() => {
    if (stockId && mode === 'reinbound') {
      const loadSpecificStock = async () => {
        try {
          const response = await fetch(`/api/stocks/${stockId}`);
          if (response.ok) {
            const stock = await response.json();
            if (stock && stock.status === SampleStatus.OUTBOUND) {
              // 再入庫モードの場合の処理
              setFormData(prev => ({
                ...prev,
                materialId: String(stock.materialId),
                lot: stock.lot,
                purpose: stock.extraConfig?.purpose || '',
                // その他必要なデータをセット
              }));
              
              // 再入庫モードではweighingステップから始める
              setStep('weighing');
            }
          }
        } catch (error) {
          console.error('在庫データ取得エラー:', error);
        }
      };
      
      loadSpecificStock();
    }
  }, [stockId, mode]);

  useEffect(() => {
    setPageTitle('入庫処理');
    
    // 在庫画面から来た場合は、戻るボタンで在庫画面に戻れるようにする
    if (returnTo === 'inventory') {
      setBackButton(true, () => navigate('/inventory'));
    } else {
      setBackButton(true, resetForm);
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMaterials(), fetchVessels()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchMaterials, fetchVessels, returnTo, navigate, setBackButton, setPageTitle]);
  
  // 日付のデフォルト値を設定
  useEffect(() => {
    const today = new Date();
    
    // 有効期限のデフォルト（1年後）
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    // 保管期限のデフォルト（6ヶ月後）
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);
    
    setFormData(prev => ({
      ...prev,
      expirationDate: nextYear.toISOString().split('T')[0],
      storageDate: sixMonthsLater.toISOString().split('T')[0]
    }));
  }, []);
  
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
  
  const handleFinalWeighing = async () => {
    const weight = handleWeigh();
    setFinalWeight(weight);
    
    // 完了ステップをスキップして直接登録処理
    if (isRegistering) return;
    setIsRegistering(true);
    
    try {
      const materialId = Number(formData.materialId);
      const material = materials.find(m => m.id === materialId);
      if (!material) {
        setIsRegistering(false);
        return;
      }
      
      // 資材に紐づく容器を取得
      const vessel = material.vesselId ? vessels.find(v => v.id === material.vesselId) : null;
      
      // 正味重量の計算（最終重量 - 容器重量）
      const netWeight = weight.minus(vesselWeight);
      
      // 数量を取得
      const quantity = parseInt(formData.quantity || '1', 10);
      
      // 登録処理の配列
      const registrationPromises = [];
      
      // 指定された数量分、在庫データを作成して登録
      for (let i = 0; i < quantity; i++) {
        // 在庫データの作成 - フラット構造で作成
        const stockData = {
          productName: material.name,
          lot: formData.lot,
          status: SampleStatus.STORED,
          registrationDate: new Date(),
          updateDate: new Date(),
          remarks: formData.remarks,
          expirationDate: new Date(formData.expirationDate),
          storageDate: new Date(formData.storageDate),
          currentWeight: weight,
          netWeight,
          vesselWeight,
          inboundWeight: weight,
          materialId: material.id,
          materialName: material.name,
          materialSpecification: material.specification,
          materialCategoryId: material.categoryId,
          materialCategoryName: material.categoryName || '',
          vesselId: vessel?.id || 0, // nullableな場合に0をデフォルト値として設定
          vesselName: vessel?.name,
          creatorId: 2, // 仮のユーザーID
          creatorUsername: 'testuser',
          extraConfig: { purpose: formData.purpose }
        };
        
        // addStock関数を使用して登録
        registrationPromises.push(addStock(stockData));
      }
      
      // すべての在庫を登録
      await Promise.all(registrationPromises);
      
      // 成功メッセージ
      alert('入庫処理が完了しました');
      
      // 成功時の処理
      if (returnTo === 'inventory') {
        // 在庫画面から来た場合は、処理完了後に在庫画面に戻る
        navigate('/inventory');
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('在庫登録エラー:', error);
      alert('入庫処理中にエラーが発生しました');
    } finally {
      setIsRegistering(false);
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 資材選択時に対応する容器の重量を設定
    if (field === 'materialId') {
      const materialId = Number(value);
      const material = materials.find(m => m.id === materialId);
      if (material && material.vesselId) {
        const vessel = vessels.find(v => v.id === material.vesselId);
        if (vessel && vessel.weight !== undefined) {
          // vessel.weightが存在することを確認し、安全に変換
          try {
            setVesselWeight(new Decimal(String(vessel.weight)));
          } catch (e) {
            console.error('容器重量の変換エラー:', e);
            setVesselWeight(new Decimal(0));
          }
        } else {
          setVesselWeight(new Decimal(0));
        }
      } else {
        setVesselWeight(new Decimal(0));
      }
    }
  };
  
  const handleFormSubmit = (data: FormData) => {
    // 数量の値が無効な場合はエラー表示
    const quantity = parseInt(data.quantity as string || '0', 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert('数量は1以上の数値を入力してください');
      return;
    }
    
    if (!data.materialId || !data.lot || !data.expirationDate || !data.storageDate) {
      alert('必須項目を入力してください');
      return;
    }
    
    // weightingをスキップして直接labelへ
    setStep('label');
  };
  
  const handleComplete = async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    
    try {
      const materialId = Number(formData.materialId);
      const material = materials.find(m => m.id === materialId);
      if (!material) {
        setIsRegistering(false);
        return;
      }
      
      // 資材に紐づく容器を取得
      const vessel = material.vesselId ? vessels.find(v => v.id === material.vesselId) : null;
      
      // 正味重量の計算（最終重量 - 容器重量）
      const netWeight = finalWeight.minus(vesselWeight);
      
      // 数量を取得
      const quantity = parseInt(formData.quantity || '1', 10);
      
      // 登録処理の配列
      const registrationPromises = [];
      
      // 指定された数量分、在庫データを作成して登録
      for (let i = 0; i < quantity; i++) {
        // 在庫データの作成 - フラット構造で作成
        const stockData = {
          productName: material.name,
          lot: formData.lot,
          status: SampleStatus.STORED,
          registrationDate: new Date(),
          updateDate: new Date(),
          remarks: formData.remarks,
          expirationDate: new Date(formData.expirationDate),
          storageDate: new Date(formData.storageDate),
          currentWeight: finalWeight,
          netWeight,
          vesselWeight,
          inboundWeight: finalWeight,
          materialId: material.id,
          materialName: material.name,
          materialSpecification: material.specification,
          materialCategoryId: material.categoryId,
          materialCategoryName: material.categoryName || '',
          vesselId: vessel?.id || 0, // nullableな場合に0をデフォルト値として設定
          vesselName: vessel?.name,
          creatorId: 2, // 仮のユーザーID
          creatorUsername: 'testuser',
          extraConfig: { purpose: formData.purpose }
        };
        
        // addStock関数を使用して登録
        registrationPromises.push(addStock(stockData));
      }
      
      // すべての在庫を登録
      await Promise.all(registrationPromises);
      
      // 成功時の処理
      if (returnTo === 'inventory') {
        // 在庫画面から来た場合は、処理完了後に在庫画面に戻る
        navigate('/inventory');
      } else {
        resetForm();
      }
    } catch (error) {
      console.error('在庫登録エラー:', error);
    } finally {
      setIsRegistering(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      materialId: '',
      lot: '',
      purpose: '',
      expirationDate: '',
      storageDate: '',
      remarks: '',
      quantity: '1'
    });
    
    // 日付のデフォルト値を再設定
    const today = new Date();
    
    // 有効期限のデフォルト（1年後）
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    
    // 保管期限のデフォルト（6ヶ月後）
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(today.getMonth() + 6);
    
    setFormData(prev => ({
      ...prev,
      expirationDate: nextYear.toISOString().split('T')[0],
      storageDate: sixMonthsLater.toISOString().split('T')[0]
    }));
    
    // 重量関連の状態をリセット
    setVesselWeight(new Decimal(0));
    setInitialWeight(new Decimal(0));
    setFinalWeight(new Decimal(0));
    setSimulatedWeight(new Decimal(0));
    
    // ステップを初期状態に戻す
    if (returnTo === 'inventory') {
      // 在庫画面から来た場合は、処理完了後に在庫画面に戻る
      navigate('/inventory');
    } else {
      setStep('input');
    }
    
    // エラー状態もリセット
    if (error) {
      // エラー状態をリセットする方法がストアにあれば実行
      // 例: resetError() などの関数があれば呼び出す
    }
  };
  
  // FormGeneratorのフィールド定義（拡張インターフェースを使用）
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
      id: 'quantity',
      label: '数量',
      elementType: 'number',
      required: true,
      min: 1,
      step: 1,
      showOnLabel: true,
    },
    {
      id: 'purpose',
      label: '用途',
      elementType: 'input',
      showOnLabel: true,
    },
    {
      id: 'expirationDate',
      label: '有効期限',
      elementType: 'date',
      required: true,
      showOnLabel: true,
      displayFn: (value) => new Date(value).toLocaleDateString('ja-JP'),
    },
    {
      id: 'storageDate',
      label: '保管期限',
      elementType: 'date',
      required: true,
      showOnLabel: true,
    },
    {
      id: 'remarks',
      label: '備考',
      elementType: 'textarea',
      showOnLabel: true,
    }
  ];
  
  return (
    <div className="space-y-6"> 
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            {/* <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {step === 'input' && '基本情報入力'}
              {step === 'weighing' && '初回計量'}
              {step === 'label' && 'ラベル印刷'}
              {step === 'reweighing' && '再計量'}
              {step === 'complete' && '入庫完了'}
            </h2> */}
            
            {/* ステップインジケーター */}
            <Stepper
              steps={[
                { title: "入力" },
                { title: "ラベル印刷" },
                { title: "計量" }
              ]}
              currentStep={
                step === 'input' ? 0 :
                step === 'label' ? 1 :
                step === 'reweighing' ? 2 :
                step === 'complete' ? 3 : 0
              }
              className="mb-4"
              theme={{
                active: 'bg-blue-500',
                completed: 'bg-blue-500',
                pending: 'bg-gray-300 dark:bg-gray-600',
                textActive: 'text-white',
                textCompleted: 'text-white',
                textPending: 'text-gray-600 dark:text-gray-400',
                connector: 'bg-gray-300 dark:bg-gray-600',
                connectorCompleted: 'bg-blue-500',
              }}
            />
          </div>
          
          {isLoading || loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 基本情報入力フォーム */}
              {step === 'input' && (
                <div className="max-w-2xl mx-auto">
                  <FormGenerator
                    fields={getFormFields()}
                    initialData={formData}
                    onSubmit={handleFormSubmit}
                    onChange={handleChange}
                  />
                  
                  <div className="flex justify-center space-x-3 mt-6">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleFormSubmit(formData)}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
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
                          {simulatedWeight.toString() || '0'} g
                        </div>
                      </div>
                      
                      <Button
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleInitialWeighing}
                      >
                        計量する
                      </Button>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        <p>容器重量: {vesselWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      className="text-black"
                      variant="outline"
                      onClick={() => setStep('input')}
                    >
                      戻る
                    </Button>
                  </div>
                </div>
              )}
              
              {/* ラベル印刷 */}
              {step === 'label' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    {         
                        <div key={0} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6 w-1/2 mx-auto">
                          <div className="flex flex-col space-y-2">
                            {/* 自動フィールド表示 */}
                            {getFormFields().filter(field => field.showOnLabel).map(field => (
                              <div key={field.id} className="flex justify-between">
                                <span className="text-sm font-medium">{field.label}:</span>
                                <span className="text-sm">
                                  {field.displayFn 
                                    ? field.displayFn(formData[field.id as keyof typeof formData] as string)
                                    : formData[field.id as keyof typeof formData]?.toString() || '-'}
                                </span>
                              </div>
                            ))}
                            
                            {/* 特殊項目：初期重量 (フォームには含まれない) */}
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">初期重量:</span>
                              <span className="text-sm">{initialWeight.toString()} g</span>
                            </div>
                          </div>
                        </div>
                    }
                    
                    <div className="flex justify-center">
                      <Button
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => {
                          alert('ラベルを印刷しました。ラベルを貼り付けた後、再計量を行ってください。');
                          setStep('reweighing');
                        }}
                      >
                        ラベル印刷
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      className="text-black"
                      variant="outline"
                      onClick={() => setStep('weighing')}
                    >
                      戻る
                    </Button>
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
                          {simulatedWeight.toString() || '0'} g
                        </div>
                      </div>
                      
                      <Button
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleFinalWeighing}
                        disabled={isRegistering}
                      >
                        {isRegistering ? '登録中...' : '入庫完了'}
                      </Button>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        <p>初回計量: {initialWeight.toString()} g</p>
                        <p>容器重量: {vesselWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep('label')}
                    >
                      戻る
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 完了 */}
              {/* 完了画面（将来的に使用する可能性があるためコメントアウト）
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
                        {getFormFields().filter(field => field.showOnLabel || field.id === 'quantity').map(field => (
                          <div key={field.id} className="flex justify-between">
                            <span className="text-sm font-medium">{field.label}:</span>
                            <span className="text-sm">
                              {field.displayFn 
                                ? field.displayFn(formData[field.id as keyof typeof formData] as string)
                                : formData[field.id as keyof typeof formData]?.toString() || '-'}
                            </span>
                          </div>
                        ))}
                        
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
                      <Button
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleComplete}
                        disabled={isRegistering}
                      >
                        {isRegistering ? '登録中...' : '登録完了'}
                      </Button>
                    </div>
                  </div>
                </div>
              )} */}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 