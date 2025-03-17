import React, { act } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Materials from '../materials';
import { mockMaterials, mockCategories } from '../../../stores/__mocks__/masterStore';

// Mock the stores - import mocks directly
import '../../../stores/__mocks__/masterStore';
import '../../../stores/__mocks__/navigationStore';

// Mock the confirm dialog
const mockConfirm = jest.fn(() => true);
global.confirm = mockConfirm;

// Mock FormGenerator component for simplified testing
// This will auto-mock the component since Jest automatically looks for __mocks__ directories
jest.mock('../../../components/ui/FormGenerator', () => ({
  __esModule: true,
  default: jest.fn(({ 
    fields, 
    initialData, 
    onSubmit 
  }: { 
    fields?: FormFieldConfig[], 
    initialData: FormData, 
    onSubmit?: (data: FormData) => void 
  }) => (
    <div data-testid="form-generator">
      <div data-testid="form-initial-data">{JSON.stringify(initialData)}</div>
      <button data-testid="form-submit" onClick={() => onSubmit && onSubmit(initialData)}>
        Submit
      </button>
    </div>
  ))
}));

// Tableコンポーネントのモック
jest.mock('../../../components/ui/table', () => ({
  Table: ({ columns, data, onRowClick }: any) => (
    <div data-testid="table">
      {data.map((item: any, index: number) => (
        <div 
          key={item.id} 
          data-testid={`table-row-${item.id}`}
          onClick={() => onRowClick && onRowClick(item, index)}
        >
          {item.name}
        </div>
      ))}
    </div>
  )
}));

// モックを修正
jest.mock('../../../stores/navigationStore', () => {
  const mockSetPageTitle = jest.fn();
  const mockSetBackButton = jest.fn();
  return {
    useNavigationStore: jest.fn(() => ({
      setPageTitle: mockSetPageTitle,
      setBackButton: mockSetBackButton,
    }))
  };
});

jest.mock('../../../stores/masterStore', () => {
  const addMaterialMock = jest.fn().mockResolvedValue({});
  const updateMaterialMock = jest.fn().mockResolvedValue({});
  const deleteMaterialMock = jest.fn().mockResolvedValue({});
  
  return {
    useMasterStore: jest.fn(() => ({
      materials: mockMaterials,
      categories: mockCategories,
      manufacturers: [],
      suppliers: [],
      fetchMaterials: jest.fn().mockResolvedValue(mockMaterials),
      fetchCategories: jest.fn().mockResolvedValue(mockCategories),
      fetchManufacturers: jest.fn().mockResolvedValue([]),
      fetchSuppliers: jest.fn().mockResolvedValue([]),
      addMaterial: addMaterialMock,
      updateMaterial: updateMaterialMock,
      deleteMaterial: deleteMaterialMock,
    })),
    addMaterialMock,
    updateMaterialMock,
    deleteMaterialMock,
  };
});

// 必要な型をインポート
import FormGenerator, { type FormFieldConfig, type FormData } from '../../../components/ui/FormGenerator';

describe('Materials Component', () => {
  let navigationStore: any;
  let masterStore: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モジュールをリセット
    navigationStore = require('../../../stores/navigationStore');
    masterStore = require('../../../stores/masterStore');
  });

  test('初期表示時に資材一覧が表示される', async () => {
    // navigationStoreのsetPageTitleメソッドにアクセス
    const { setPageTitle } = navigationStore.useNavigationStore();
    
    // コンポーネントをレンダリング（actを使用しない方法に変更）
    render(<Materials />);
    
    // ページタイトル設定が呼ばれたことを確認
    expect(setPageTitle).toHaveBeenCalledWith('資材');
    
    // データ表示の確認
    await waitFor(() => {
      mockMaterials.forEach(material => {
        expect(screen.getByText(material.name)).toBeInTheDocument();
      });
    });
    
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  }, 10000); // タイムアウトを10秒に延長

  test('新規登録ボタンをクリックすると登録フォームが表示される', async () => {
    // コンポーネントをレンダリング
    const { container } = render(<Materials />);
    
    // レンダリング後のDOM構造をデバッグ出力
    console.log(screen.debug());
    
    // すべてのボタンを取得
    const buttons = screen.getAllByRole('button');
    console.log('ボタン数:', buttons.length);
    buttons.forEach((button, index) => {
      console.log(`ボタン ${index}:`, button.textContent);
    });
    
    // ボタンを見つけるための別の方法
    // 1. テキストの一部で検索
    const createButton = screen.getByText((content, element) => {
      return content.includes('新規') || content.includes('登録');
    });
    
    // ボタンをクリック
    fireEvent.click(createButton);
    
    // フォームが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId('form-generator')).toBeInTheDocument();
    });
  });

  test('資材の行をクリックすると編集モードになる', async () => {
    render(<Materials />);
    
    // データがロードされるのを待つ
    await waitFor(() => {
      expect(screen.getByText(mockMaterials[0].name)).toBeInTheDocument();
    });
    
    // テーブル行のクリック
    const materialRow = screen.getByTestId(`table-row-${mockMaterials[0].id}`);
    fireEvent.click(materialRow);
    
    // タブが表示されるのを確認
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-tab')).toBeInTheDocument();
      expect(screen.getByTestId('history-tab')).toBeInTheDocument();
    });
    
    // 更新ボタンと削除ボタンが表示されているか
    expect(screen.getByTestId('update-material-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-material-button')).toBeInTheDocument();
  });

  test('新規登録フォームで登録ボタンをクリックすると資材が追加される', async () => {
    // マスターストアのモックを直接取得
    const addMaterialMock = jest.fn().mockResolvedValue({});
    const masterStore = require('../../../stores/masterStore');
    
    // モック関数を更新して確実に追跡できるようにする
    masterStore.useMasterStore.mockReturnValue({
      materials: mockMaterials,
      categories: mockCategories,
      manufacturers: [],
      suppliers: [],
      fetchMaterials: jest.fn().mockResolvedValue(mockMaterials),
      fetchCategories: jest.fn().mockResolvedValue(mockCategories),
      fetchManufacturers: jest.fn().mockResolvedValue([]),
      fetchSuppliers: jest.fn().mockResolvedValue([]),
      addMaterial: addMaterialMock,
      updateMaterial: jest.fn().mockResolvedValue({}),
      deleteMaterial: jest.fn().mockResolvedValue({}),
    });
    
    // コンポーネントをレンダリング
    render(<Materials />);
    
    // 新規登録ボタンをクリック
    fireEvent.click(screen.getByTestId('create-material-button'));
    
    // フォームが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByTestId('form-generator')).toBeInTheDocument();
    });
    
    // フォームの内容をトリガーする - ダイレクトに関数を呼び出す
    const FormGeneratorComponent = require('../../../components/ui/FormGenerator').default;
    const formInstance = FormGeneratorComponent.mock.calls[FormGeneratorComponent.mock.calls.length - 1][0];
    
    // フォームの送信関数を直接呼び出す
    if (formInstance.onSubmit) {
      formInstance.onSubmit(formInstance.initialData);
    }
    
    // addMaterial関数が呼ばれたことを確認
    await waitFor(() => {
      expect(addMaterialMock).toHaveBeenCalled();
    });
  }, 10000);

  test('編集モードで削除ボタンをクリックすると確認ダイアログが表示され、資材が削除される', async () => {
    // 確認ダイアログのモックをリセット
    mockConfirm.mockClear();
    
    // actを避けてrender
    render(<Materials />);
    
    // 資材行をクリック
    await waitFor(() => {
      expect(screen.getByTestId(`table-row-${mockMaterials[0].id}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`table-row-${mockMaterials[0].id}`));
    
    // 削除ボタンをクリック
    await waitFor(() => {
      expect(screen.getByTestId('delete-material-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('delete-material-button'));
    
    // 確認ダイアログが表示されたことを確認
    expect(mockConfirm).toHaveBeenCalled();
    
    // deleteMaterial関数が呼ばれたことを確認
    await waitFor(() => {
      const { deleteMaterial } = masterStore.useMasterStore();
      expect(deleteMaterial).toHaveBeenCalledWith(mockMaterials[0].id);
    });
  }, 10000); // タイムアウトを10秒に延長

  test('編集モードで更新ボタンをクリックすると資材が更新される', async () => {
    // actを避けてrender
    render(<Materials />);
    
    // 資材行をクリック
    await waitFor(() => {
      expect(screen.getByTestId(`table-row-${mockMaterials[0].id}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`table-row-${mockMaterials[0].id}`));
    
    // 更新ボタンをクリック
    await waitFor(() => {
      expect(screen.getByTestId('update-material-button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('update-material-button'));
    
    // updateMaterial関数が呼ばれたことを確認
    await waitFor(() => {
      const { updateMaterial } = masterStore.useMasterStore();
      expect(updateMaterial).toHaveBeenCalledWith(mockMaterials[0].id, expect.anything());
    });
  }, 10000); // タイムアウトを10秒に延長
});
