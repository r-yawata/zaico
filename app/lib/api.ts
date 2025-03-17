// APIのベースURL
const API_BASE_URL = 'http://localhost:3001/api';

// APIリクエスト用のユーティリティ関数
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type SetStateFunction = (state: any) => void;

export interface ApiRequestOptions<T> {
  endpoint: string;
  method?: HttpMethod;
  data?: any;
  errorMessage: string;
  logPrefix: string;
  transformResponse?: (data: any) => T;
  onSuccess?: (data: T, set: SetStateFunction) => void;
}

/**
 * 共通APIリクエスト処理
 * @param options APIリクエストのオプション
 * @param set 状態を更新する関数
 * @returns レスポンスデータまたはnull
 */
export async function apiRequest<T>({
  endpoint,
  method = 'GET',
  data,
  errorMessage,
  logPrefix,
  transformResponse,
  onSuccess
}: ApiRequestOptions<T>, set: SetStateFunction): Promise<T | null> {
  set({ loading: true, error: null });
  
  try {
    const options: RequestInit = {
      method,
      headers: method !== 'GET' && data ? { //これで、PUTの場合など、リクエストボディが空でも送れるようにした
        'Content-Type': 'application/json',
      } : undefined,
      body: data && method !== 'GET' ? JSON.stringify(data) : undefined,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      if (method === 'DELETE') {
        const errorData = await response.json();
        throw new Error(errorData.message || errorMessage);
      }
      throw new Error(errorMessage);
    }
    
    if (method === 'DELETE') {
      if (onSuccess) {
        onSuccess(null as any, set);
      }
      set({ loading: false });
      return null;
    }
    
    const responseData = await response.json();
    const transformedData = transformResponse ? transformResponse(responseData) : responseData;
    
    if (onSuccess) {
      onSuccess(transformedData, set);
    } else {
      set({ loading: false });
    }
    
    return transformedData;
  } catch (error) {
    console.error(`${logPrefix}エラー:`, error);
    set({ error: (error as Error).message, loading: false });
    return null;
  }
}

/**
 * 日付文字列をDateオブジェクトに変換する共通関数
 * @param item 変換対象のオブジェクト
 * @returns 日付フィールドがDateオブジェクトに変換されたオブジェクト
 */
export function convertDatesToObjects<T extends { created_at: string; updated_at: string }>(item: T): Omit<T, 'created_at' | 'updated_at'> & { created_at: Date; updated_at: Date } {
  return {
    ...item,
    created_at: new Date(item.created_at),
    updated_at: new Date(item.updated_at)
  };
}

/**
 * 型アサーションを使用して日付変換を行う関数
 * 特定のエンティティ型に対応するために使用
 */
export function convertAndAssertType<T>(data: any): T {
  const converted = convertDatesToObjects(data);
  return converted as unknown as T;
}

/**
 * 配列データの日付変換を行う関数
 */
export function convertArrayDatesToObjects<T>(data: any[]): T[] {
  return data.map(item => convertAndAssertType<T>(item));
} 