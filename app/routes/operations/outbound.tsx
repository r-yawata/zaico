import { useState, useEffect, useRef } from 'react';
import { Decimal } from 'decimal.js';
import { useMasterStore } from '../../stores/masterStore';
import { useStockStore } from '../../stores/stockStore';
import { useReservationStore } from '../../stores/reservationStore';
import { useNavigationStore } from '../../stores/navigationStore';
import type { Stock, StockReservation } from '../../types';
import { SampleStatus } from '../../types';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, type TableColumn } from '../../components/ui/table';

export default function Outbound() {
  const { setPageTitle, setBackButton } = useNavigationStore();
  const { fetchStocks, updateStock, loading: stockLoading, error: stockError } = useStockStore();
  const { reservations, fetchReservations, updateReservation, loading: reservationLoading } = useReservationStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservation' | 'direct'>('reservation');
  const [step, setStep] = useState<'select' | 'scanning' | 'weighing' | 'confirm' | 'complete'>('select');
  
  // データ一覧
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<StockReservation | null>(null);
  
  // 出庫情報
  const [outboundWeight, setOutboundWeight] = useState<Decimal>(new Decimal(0));
  const [actualWeight, setActualWeight] = useState<Decimal>(new Decimal(0));
  const [purpose, setPurpose] = useState('');
  const [testName, setTestName] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // 重量許容差異の警告状態
  const [weightError, setWeightError] = useState<string | null>(null);
  
  // 模擬的な秤の読み取り
  const [simulatedWeight, setSimulatedWeight] = useState<Decimal>(new Decimal(0));
  
  // エラー表示用の参照
  const errorRef = useRef<HTMLDivElement>(null);

  // ページ表示時にタイトルを設定
  useEffect(() => {
    setPageTitle('出庫');
    
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
      await Promise.all([
        fetchStocks(),
        fetchReservations()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchStocks, fetchReservations]);
  
  // 在庫データの更新
  useEffect(() => {
    const loadStocks = async () => {
      try {
        await fetchStocks();
        // グローバルステートから在庫データを取得し、入庫中の在庫のみフィルタリング
        const stocks = useStockStore.getState().stocks || [];
        const storedStocks = stocks.filter(stock => 
          stock.status === SampleStatus.STORED
        );
        setStocks(storedStocks);
        setFilteredStocks(storedStocks);
      } catch (error) {
        console.error('在庫データ取得エラー:', error);
      }
    };
    
    loadStocks();
  }, [fetchStocks]);
  
  // 日付のデフォルト値を設定
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 返却予定日のデフォルト（当日）
    setReturnDate(today.toISOString().split('T')[0]);
  }, []);
  
  // 予約タブが選択された時に予約情報をリセット
  useEffect(() => {
    if (activeTab === 'reservation') {
      setSelectedStock(null);
      setOutboundWeight(new Decimal(0));
    } else if (activeTab === 'direct') {
      setSelectedReservation(null);
    }
  }, [activeTab]);
  
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
  
  const handleActualWeighing = () => {
    const weight = handleWeigh();
    setActualWeight(weight);
    
    // 重量差のチェック
    if (selectedStock) {
      const tolerance = 0.05; // 5%の許容範囲（実際には資材マスタから取得）
      const expectedWeight = selectedStock.currentWeight;
      const diff = weight.minus(expectedWeight).abs();
      const diffPercentage = diff.div(expectedWeight).times(100);
      
      if (diffPercentage.greaterThan(tolerance)) {
        setWeightError(`警告: 計量値が予定重量と${diffPercentage.toFixed(2)}%異なります`);
      } else {
        setWeightError(null);
      }
    }
    
    setStep('confirm');
  };
  
  // 予約データからの在庫選択
  const handleReservationSelect = (reservation: StockReservation) => {
    setSelectedReservation(reservation);
    // 予約に紐づく在庫を検索
    const relatedStock = stocks.find(stock => stock.id === reservation.materialId);
    if (relatedStock) {
      setSelectedStock(relatedStock);
      // 予約情報を設定
      setOutboundWeight(reservation.requiredAmount);
      setPurpose(reservation.usage || '');
      setTestName(reservation.testName || '');
      setReturnDate(reservation.returnDate.toISOString().split('T')[0]);
      setRemarks(reservation.remarks || '');
      
      setStep('scanning');
    } else {
      console.error('予約に関連する在庫が見つかりません');
    }
  };
  
  // 直接出庫時の在庫選択
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    // デフォルトで全量出庫に設定
    setOutboundWeight(stock.currentWeight);
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
  
  // 出庫の確定処理
  const handleOutbound = async () => {
    if (!selectedStock) return;
    
    try {
      // 在庫データの更新
      const updatedStock = {
        ...selectedStock,
        status: SampleStatus.OUTBOUND,
        currentWeight: selectedStock.currentWeight.minus(outboundWeight),
        lastOutboundDate: new Date(),
        lastOutboundAmount: outboundWeight,
        updateDate: new Date()
      };
      
      await updateStock(selectedStock.id, updatedStock);
      
      // 予約からの出庫の場合、予約状態も更新
      if (selectedReservation) {
        const updatedReservation = {
          ...selectedReservation,
          status: 'completed',
          completedAt: new Date()
        };
        await updateReservation(selectedReservation.id, updatedReservation);
      }
      
      setStep('complete');
    } catch (error) {
      console.error('出庫処理エラー:', error);
    }
  };
  
  // 前のステップに戻る
  const handleBack = () => {
    if (step === 'scanning') {
      setStep('select');
      setSelectedStock(null);
      setSelectedReservation(null);
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
    setSelectedReservation(null);
    setOutboundWeight(new Decimal(0));
    setActualWeight(new Decimal(0));
    setPurpose('');
    setTestName('');
    const today = new Date();
    setReturnDate(today.toISOString().split('T')[0]);
    setRemarks('');
    setWeightError(null);
    setStep('select');
  };
  
  // 予約一覧のカラム定義
  const reservationColumns: TableColumn<StockReservation>[] = [
    { header: '予約ID', accessor: 'id' },
    { header: '資材', accessor: (res) => res.material?.name || '不明' },
    { header: 'ロット', accessor: 'lot' },
    { header: '申請日', accessor: (res) => res.createdAt.toLocaleDateString('ja-JP') },
    { header: '出庫予定日', accessor: (res) => res.outboundDate.toLocaleDateString('ja-JP') },
    { header: '返却予定日', accessor: (res) => res.returnDate.toLocaleDateString('ja-JP') },
    { header: '用途', accessor: (res) => res.usage || '未指定' },
    { header: '状態', accessor: () => '予約中' } // 予約中のもののみ表示するため、固定値
  ];
  
  // 在庫一覧のカラム定義
  const stockColumns: TableColumn<Stock>[] = [
    { header: 'ID', accessor: 'id' },
    { header: '資材', accessor: (stock) => stock.material?.name || '不明' },
    { header: 'ロット', accessor: 'lot' },
    { header: '現在重量', accessor: (stock) => `${stock.currentWeight?.toString() || '0'} g` },
    { header: '入庫日', accessor: (stock) => stock.registrationDate.toLocaleDateString('ja-JP') },
    { header: '有効期限', accessor: (stock) => stock.expirationDate?.toLocaleDateString('ja-JP') || '無期限' }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">出庫処理</h1>
      
      {(stockError || weightError) && (
        <div ref={errorRef} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-700" role="alert">
          <span className="block sm:inline">{stockError || weightError}</span>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {step === 'select' && '出庫対象選択'}
              {step === 'scanning' && 'バーコードスキャン'}
              {step === 'weighing' && '計量処理'}
              {step === 'confirm' && '出庫確認'}
              {step === 'complete' && '出庫完了'}
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
          
          {isLoading || stockLoading || reservationLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* 選択ステップ */}
              {step === 'select' && (
                <div className="space-y-4">
                  <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'reservation' | 'direct')}>
                    <TabsList>
                      <TabsTrigger value="reservation">予約出庫</TabsTrigger>
                      <TabsTrigger value="direct">直接出庫</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="reservation" className="pt-4">
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                          出庫予約一覧
                        </h3>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Table
                            columns={reservationColumns}
                            data={reservations ? reservations.filter((r: any) => r.status === 'pending' || r.status === undefined) : []}
                            isLoading={reservationLoading}
                            onRowClick={handleReservationSelect}
                            keyExtractor={(res) => res.id}
                            emptyMessage="出庫予約データがありません"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="direct" className="pt-4">
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                          在庫一覧
                        </h3>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Table
                            columns={stockColumns}
                            data={filteredStocks}
                            isLoading={stockLoading}
                            onRowClick={handleStockSelect}
                            keyExtractor={(stock) => stock.id}
                            emptyMessage="在庫データがありません"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              
              {/* バーコードスキャン */}
              {step === 'scanning' && selectedStock && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      バーコードスキャン
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
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
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">現在重量:</span>
                            <div className="text-lg font-semibold">{selectedStock.currentWeight.toString()} g</div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">出庫予定量:</span>
                            <div className="text-lg font-semibold">{outboundWeight.toString()} g</div>
                          </div>
                        </div>
                      </div>
                      
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            返却予定日
                          </label>
                          <input
                            type="date"
                            id="returnDate"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
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
                      </form>
                      
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
                        <p>予定出庫量: {outboundWeight.toString()} g</p>
                        <p>現在の重量: {selectedStock.currentWeight.toString()} g</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 確認ステップ */}
              {step === 'confirm' && selectedStock && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">出庫確認</h3>
                    
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
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">出庫量:</span>
                          <div className="text-lg font-semibold">{outboundWeight.toString()} g</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">返却予定日:</span>
                          <div className="text-lg font-semibold">{new Date(returnDate).toLocaleDateString('ja-JP')}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">用途:</span>
                          <div className="text-lg font-semibold">{purpose || '未指定'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {weightError && (
                      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{weightError}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={handleOutbound}
                      >
                        出庫する
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
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">出庫処理が完了しました</h3>
                    
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
                          <span className="text-sm font-medium">出庫量:</span>
                          <span className="text-sm">{outboundWeight.toString()} g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">残量:</span>
                          <span className="text-sm">{selectedStock.currentWeight.minus(outboundWeight).toString()} g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">返却予定日:</span>
                          <span className="text-sm">{new Date(returnDate).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        onClick={resetForm}
                      >
                        新規出庫
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
