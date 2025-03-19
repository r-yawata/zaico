import { Pool } from 'pg';



/**
 * SQLクエリを動的に生成するユーティリティ関数
 * @param tableName テーブル名
 * @param data 挿入するデータオブジェクト
 * @param specialColumns 特別な処理が必要なカラム（例：created_at, updated_at
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateHistoryInsertQuery(
  tableName: string,
  data: Record<string, any>,
  specialColumns: Record<string, string> = { created_at: 'NOW()' }
): { query: string; values: any[] } {
  // データオブジェクトからカラム名を取得
  const dataColumns = Object.keys(data);
  
  // 特別なカラムを追加
  const specialColumnsKeys = Object.keys(specialColumns);
  const allColumns = [...dataColumns, ...specialColumnsKeys];
  
  // 値の配列を作成
  const values = dataColumns.map(col => data[col]);
  
  // プレースホルダーを生成
  const placeholders = allColumns.map((col, index) => {
    if (specialColumnsKeys.includes(col)) {
      return specialColumns[col]; // 特別なカラムの場合は対応する値（例：NOW()）を使用
    }
    return `$${index + 1}`; // 通常のカラムの場合はプレースホルダーを使用
  });
  
  // SQLクエリを構築
  const query = `
    INSERT INTO "${tableName}" (
      ${allColumns.map(col => `"${col}"`).join(', ')}
    ) VALUES (
      ${placeholders.join(', ')}
    ) RETURNING *
  `;
  
  return { query, values };
}

/**
 * SQLクエリを動的に生成するユーティリティ関数
 * @param tableName テーブル名
 * @param data 挿入するデータオブジェクト
 * @param specialColumns 特別な処理が必要なカラム（例：created_at, updated_at
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateInsertQuery(
  tableName: string,
  data: Record<string, any>,
  specialColumns: Record<string, string> = { created_at: 'NOW()', updated_at: 'NOW()' }
): { query: string; values: any[] } {
  // データオブジェクトからカラム名を取得
  const dataColumns = Object.keys(data);
  
  // 特別なカラムを追加
  const specialColumnsKeys = Object.keys(specialColumns);
  const allColumns = [...dataColumns, ...specialColumnsKeys];
  
  // 値の配列を作成
  const values = dataColumns.map(col => data[col]);
  
  // プレースホルダーを生成
  const placeholders = allColumns.map((col, index) => {
    if (specialColumnsKeys.includes(col)) {
      return specialColumns[col]; // 特別なカラムの場合は対応する値（例：NOW()）を使用
    }
    return `$${index + 1}`; // 通常のカラムの場合はプレースホルダーを使用
  });
  
  // SQLクエリを構築
  const query = `
    INSERT INTO "${tableName}" (
      ${allColumns.map(col => `"${col}"`).join(', ')}
    ) VALUES (
      ${placeholders.join(', ')}
    ) RETURNING *
  `;
  
  return { query, values };
}

/**
 * 更新用のSQLクエリを動的に生成するユーティリティ関数
 * @param tableName テーブル名
 * @param data 更新するデータオブジェクト
 * @param idField ID列の名前
 * @param id 更新対象のID
 * @param specialColumns 特別な処理が必要なカラム（例：updatedAt）
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateUpdateQuery(
  tableName: string,
  data: Record<string, any>,
  idField: string = 'id',
  id: string | number,
  specialColumns: Record<string, string> = { updated_at: 'NOW()' }
): { query: string; values: any[] } {
  // データオブジェクトからカラム名を取得
  const dataColumns = Object.keys(data);
  
  // 特別なカラムを追加
  const specialColumnsKeys = Object.keys(specialColumns);
  const allColumns = [...dataColumns, ...specialColumnsKeys];
  
  // 値の配列を作成
  const values = dataColumns.map(col => data[col]);
  
  // SET句を生成
  let paramIndex = 1;
  const setClauses = allColumns.map(col => {
    if (specialColumnsKeys.includes(col)) {
      return `"${col}" = ${specialColumns[col]}`; // 特別なカラムの場合
    }
    return `"${col}" = $${paramIndex++}`; // 通常のカラムの場合
  });
  
  // IDを値の配列に追加
  values.push(id);
  
  // SQLクエリを構築
  const query = `
    UPDATE "${tableName}"
    SET ${setClauses.join(', ')}
    WHERE "${idField}" = $${paramIndex}
    RETURNING *
  `;
  
  return { query, values };
}

/**
 * 論理削除用のSQLクエリを生成するユーティリティ関数
 * enabledフラグをfalseに設定することで論理削除を実現
 * @param tableName テーブル名
 * @param idField ID列の名前
 * @param id 削除対象のID
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateSoftDeleteQuery(
  tableName: string,
  idField: string = 'id',
  id: string | number
): { query: string; values: any[] } {
  const query = `
    UPDATE "${tableName}"
    SET "enabled" = false, "updated_at" = NOW()
    WHERE "${idField}" = $1
    RETURNING *
  `;
  const values = [id];
  
  return { query, values };
}

/**
 * 物理削除用のSQLクエリを生成するユーティリティ関数
 * @param tableName テーブル名
 * @param idField ID列の名前
 * @param id 削除対象のID
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateHardDeleteQuery(
  tableName: string,
  idField: string = 'id',
  id: string | number
): { query: string; values: any[] } {
  const query = `DELETE FROM "${tableName}" WHERE "${idField}" = $1`;
  const values = [id];
  
  return { query, values };
}

/**
 * 論理削除を考慮した削除用のSQLクエリを生成するユーティリティ関数
 * 既存の関数名を維持しつつ、内部的には論理削除を実行
 * @param tableName テーブル名
 * @param idField ID列の名前
 * @param id 削除対象のID
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateDeleteQuery(
  tableName: string,
  idField: string = 'id',
  id: string | number
): { query: string; values: any[] } {
  // 論理削除を実行
  return generateSoftDeleteQuery(tableName, idField, id);
}

/**
 * 検索用のSQLクエリを生成するユーティリティ関数
 * @param tableName テーブル名
 * @param idField ID列の名前
 * @param id 検索対象のID
 * @returns 生成されたSQLクエリと値の配列
 */
export function generateSelectByIdQuery(
  tableName: string,
  idField: string = 'id',
  id: string | number
): { query: string; values: any[] } {
  const query = `SELECT * FROM "${tableName}" WHERE "${idField}" = $1 AND "enabled" = true`;
  const values = [id];
  
  return { query, values };
}

/**
 * 全件取得用のSQLクエリを生成するユーティリティ関数
 * @param tableName テーブル名
 * @param orderBy ソート列
 * @param orderDirection ソート方向
 * @returns 生成されたSQLクエリ
 */
export function generateSelectAllQuery(
  tableName: string,
  orderBy: string = 'id',
  orderDirection: 'ASC' | 'DESC' = 'ASC'
): { query: string; values: any[] } {
  const query = `SELECT * FROM "${tableName}" WHERE "enabled" = true ORDER BY "${orderBy}" ${orderDirection}`;
  return { query, values: [] };
}

/**
 * SQLクエリを実行するユーティリティ関数
 * @param pool PostgreSQLのコネクションプール
 * @param query 実行するSQLクエリ
 * @param values クエリのパラメータ
 * @returns クエリの実行結果
 */
export async function executeQuery(
  pool: Pool,
  query: string,
  values: any[] = []
): Promise<any> {
  try {
    const result = await pool.query(query, values);
    return result;
  } catch (error) {
    console.error('SQL実行エラー:', error);
    throw error;
  }
} 