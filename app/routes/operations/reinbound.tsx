import { useState, useEffect, useRef } from 'react';
import { Decimal } from 'decimal.js';
import { useStockStore } from '../../stores/stockStore';
import { useNavigationStore } from '../../stores/navigationStore';
import type { Stock } from '../../types';
import { SampleStatus } from '../../types';
import { Button } from '../../components/ui/button';
import { Table, type TableColumn } from '../../components/ui/table';

export default function Reinbound() {
  const { setPageTitle, setBackButton } = useNavigationStore();
  const { fetchStocks, updateStock, loading: stockLoading, error: stockError } = useStockStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'scanning' | 'weighing' | 'confirm' | 'complete'>('select');
  
  // データ一覧
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [remarks, setRemarks] = useState('');
  
  // 重量情報
  const [actualWeight, setActualWeight] = useState<Decimal>(new Decimal(0));
  const [returnedWeight, setReturnedWeight] = useState<Decimal>(new Decimal(0));
  const [consumedWeight, setConsumedWeight] = useState<Decimal>(new Decimal(0));
  
  // 重量許容差異の警告状態
  const [weightError, setWeightError] = useState<string | null>(null);
  
  // 模擬的な秤の読み取り
  const [simulatedWeight, setSimulatedWeight] = useState<Decimal>(new Decimal(0));
  
  // エラー表示用の参照
  const errorRef = useRef<HTMLDivElement>(null);

  // ページ表示時にタイトルを設定
  useEffect(() => {
    setPageTitle('再入庫');
    
    return () => {
      setPageTitle('StockBox');
      setBackButton(false);
    };
  }, [setPageTitle, setBackButton]);
  
  // 戻るボタンの設定
  useEffect(() => {
    if (step !== 'select') {
      setBackButton(true, () => handleBack());
    } else {
      setBackButton(false);
    }
  }, [step, setBackButton]);
  
  // 初期データの読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchStocks();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchStocks]);
  
  // 在庫データの更新
  useEffect(() => {
    const loadStocks = async () => {
      try {
        await fetchStocks();
        // グローバルステートから在庫データを取得し、出庫中の在庫のみフィルタリング
        const stocks = useStockStore.getState().stocks || [];
        const outboundStocks = stocks.filter(stock => 
          stock.status === SampleStatus.OUTBOUND
        );
        setStocks(outboundStocks);
        setFilteredStocks(outboundStocks);
      } catch (error) {
        console.error('在庫データ取得エラー:', error);
      }
    };
    
    loadStocks();
  }, [fetchStocks]);
  
  // 模擬的な秤の読み取り（実際の実装では秤からのデータを取得）
  const readScale = () => {
    // 模擬的な重量データ（実際の実装では秤からのデータを取得）
    const randomWeight = Math.random() * 100 + 30; // 30g〜130gの範囲でランダム
    return new Decimal(randomWeight.toFixed(3)); // 小数点第3位まで（0.001g精度）
  };
  
  const handleWeigh = () => {
    const weight = readScale();
    setSimulatedWeight(weight);
    return weight;
  };
  
  const handleActualWeighing = () => {
    const weight = handleWeigh();
    setActualWeight(weight);
    
    if (selectedStock) {
      // 出庫時の重量との差分を計算（消費量）
      // 株式拡張で型付けを追加（実際のプロジェクトでは型定義を更新するべき）
      const lastOutboundAmount = (selectedStock as any).lastOutboundAmount || new Decimal(0);
      
      // 返却量 = 計量された重量 - 容器重量
      const returnedAmount = weight.minus(selectedStock.vesselWeight);
      setReturnedWeight(returnedAmount);
      
      // 消費量 = 出庫時の重量 - 返却量
      const consumedAmount = lastOutboundAmount.minus(returnedAmount);
      setConsumedWeight(consumedAmount.greaterThan(0) ? consumedAmount : new Decimal(0));
      
      // 許容誤差のチェック
      const tolerance = 0.05; // 5%の許容範囲（実際には資材マスタから取得）
      
      // 返却率が予想より大幅に異なる場合は警告
      // 出庫量に対して返却量が何%かをチェック
      if (!lastOutboundAmount.isZero() && returnedAmount.div(lastOutboundAmount).times(100).lessThan(80)) {
        // 返却量が80%未満の場合は警告
        setWeightError(`注意: 出庫量 ${lastOutboundAmount.toString()}g に対して返却量が ${returnedAmount.toString()}g (${returnedAmount.div(lastOutboundAmount).times(100).toFixed(1)}%) と少なくなっています。`);
      } else {
        setWeightError(null);
      }
    }
    
    setStep('confirm');
  };
  
  // 在庫選択
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setStep('scanning');
  };
  
  // バーコードスキャン処理（模擬的な実装）
  const handleScan = () => {
    // 実際の実装ではバーコードスキャナーからの入力を処理
    if (selectedStock) {
      alert(`バーコード: ${selectedStock.id}-${selectedStock.lot} をスキャンしました`);
      setStep('weighing');
    }
  };
  
  // 再入庫の確定処理
  const handleReinbound = async () => {
    if (!selectedStock) return;
    
    try {
      // 在庫データの更新（拡張プロパティを含む）
      const updatedStock = {
        ...selectedStock,
        status: SampleStatus.REINBOUND,
        currentWeight: selectedStock.currentWeight.plus(returnedWeight),
        updateDate: new Date(),
        remarks: remarks || selectedStock.remarks,
        // 型拡張プロパティ（別途型定義の更新が推奨）
        lastReinboundDate: new Date(),
        lastReinboundAmount: returnedWeight,
        lastConsumedAmount: consumedWeight
      };
      
      await updateStock(selectedStock.id, updatedStock as Stock);
      setStep('complete');
    } catch (error) {
      console.error('再入庫処理エラー:', error);
    }
  };
  
  // 前のステップに戻る
  const handleBack = () => {
    if (step === 'scanning') {
      setStep('select');
      setSelectedStock(null);
    } else if (step === 'weighing') {
      setStep('scanning');
    } else if (step === 'confirm') {
      setStep('weighing');
    } else if (step === 'complete') {
      resetForm();
    }
  };
  
  // フォームリセット
  const resetForm = () => {
    setSelectedStock(null);
    setActualWeight(new Decimal(0));
    setReturnedWeight(new Decimal(0));
    setConsumedWeight(new Decimal(0));
    setRemarks('');
    setWeightError(null);
    setStep('select');
  };
  
  // 在庫一覧のカラム定義
  const stockColumns: TableColumn<Stock>[] = [
    { header: 'ID', accessor: 'id' },
    { header: '資材', accessor: (stock) => stock.material?.name || '不明' },
    { header: 'ロット', accessor: 'lot' },
    { header: '出庫量', accessor: (stock) => `${(stock as any).lastOutboundAmount?.toString() || '0'} g` },
    { header: '残量', accessor: (stock) => `${stock.currentWeight?.toString() || '0'} g` },
    { header: '出庫日', accessor: (stock) => (stock as any).lastOutboundDate?.toLocaleDateString('ja-JP') || '不明' }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">再入庫処理</h1>
      
      {(stockError || weightError) && (
        <div ref={errorRef} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{stockError || weightError}</span>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {step === 'select' && '再入庫対象選択'}
              {step === 'scanning' && 'バーコードスキャン'}
              {step === 'weighing' && '計量処理'}
              {step === 'confirm' && '再入庫確認'}
              {step === 'complete' && '再入庫完了'}
            </h2>
            
            {/* ステップインジケーター */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${step === 'select' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'scanning' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'weighing' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${step === 'complete' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            </div>
          </div>
          
          {isLoading || stockLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 選択ステップ */}
              {step === 'select' && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                    出庫中の在庫一覧
                  </h3>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Table
                      columns={stockColumns}
                      data={filteredStocks}
                      isLoading={stockLoading}
                      onRowClick={handleStockSelect}
                      keyExtractor={(stock) => stock.id}
                      emptyMessage="出庫中の在庫データがありません"
                    />
                  </div>
                </div>
              )}
              
              {/* バーコードスキャン */}
              {step === 'scanning' && selectedStock && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      バーコードスキャン
                    </h3>
                    
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">資材:</span>
                          <div className="text-lg font-semibold">{selectedStock.material?.name}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ロット:</span>
                          <div className="text-lg font-semibold">{selectedStock.lot}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">在庫ID:</span>
                          <div className="text-lg font-semibold">{selectedStock.id}</div>
                        </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">出庫量:</span>
                            <div className="text-lg font-semibold">{(selectedStock as any).lastOutboundAmount?.toString() || '0'} g</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">出庫日:</span>
                            <div className="text-lg font-semibold">{(selectedStock as any).lastOutboundDate?.toLocaleDateString('ja-JP') || '不明'}</div>
                          </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">容器重量:</span>
                          <div className="text-lg font-semibold">{selectedStock.vesselWeight.toString()} g</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={handleScan}
                      >
                        バーコードスキャン
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 計量ステップ */}
              {step === 'weighing' && selectedStock && (
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
                        onClick={handleActualWeighing}
                      >
                        計量する
                      </button>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        <p>出庫量: {(selectedStock as any).lastOutboundAmount?.toString() || '0'} g</p>
                        <p>容器重量: {selectedStock.vesselWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 確認ステップ */}
              {step === 'confirm' && selectedStock && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">再入庫確認</h3>
                    
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">資材:</span>
                          <div className="text-lg font-semibold">{selectedStock.material?.name}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ロット:</span>
                          <div className="text-lg font-semibold">{selectedStock.lot}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">計量値:</span>
                          <div className="text-lg font-semibold">{actualWeight.toString()} g</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">容器重量:</span>
                          <div className="text-lg font-semibold">{selectedStock.vesselWeight.toString()} g</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">返却量:</span>
                          <div className="text-lg font-semibold">{returnedWeight.toString()} g</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">消費量:</span>
                          <div className="text-lg font-semibold">{consumedWeight.toString()} g</div>
                        </div>
                      </div>
                    </div>
                    
                    {weightError && (
                      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{weightError}</span>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        備考
                      </label>
                      <textarea
                        id="remarks"
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="消費量の差異理由や特記事項があれば入力してください"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={handleReinbound}
                      >
                        再入庫する
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 完了ステップ */}
              {step === 'complete' && selectedStock && (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                    <div className="flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">再入庫処理が完了しました</h3>
                    
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">資材:</span>
                          <span className="text-sm">{selectedStock.material?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">ロット:</span>
                          <span className="text-sm">{selectedStock.lot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">返却量:</span>
                          <span className="text-sm">{returnedWeight.toString()} g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">消費量:</span>
                          <span className="text-sm">{consumedWeight.toString()} g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">現在の在庫量:</span>
                          <span className="text-sm">{selectedStock.currentWeight.plus(returnedWeight).toString()} g</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={resetForm}
                      >
                        新規再入庫
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
