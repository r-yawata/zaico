import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pkg from 'pg';
const { Pool } = pkg;
import { createMaterialSchema, updateMaterialSchema } from '../../app/sharedSchema/materialSchema';
import { 
  generateInsertQuery,
  generateHistoryInsertQuery, 
  generateUpdateQuery, 
  generateDeleteQuery, 
  generateSelectByIdQuery,
  generateSelectAllQuery,
  executeQuery,
  transformToCamelCase, 
  transformToSnakeCase
} from '../utils/sqlUtils';

// PostgreSQLの接続設定
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
const pool = new Pool({
  user: 'postgres',
  password: 'btechnexcell',
  host: 'localhost',
  port: 5432,
  database: 'zaicobox'
});

// リクエスト型の定義
interface IdParam {
  id: string;
}


// 資材データのみを取得するクエリ
const materialsQuery = `
  SELECT 
    m.id, m.name, m.specification, m.custom_attributes, m.package_count, m.unit_weight, 
    m.note, m.supplier_id, m.manufacturer_id, m.category_id, m.vessel_id, m.created_at, m.updated_at,
    m.enable_lot_control, m.enable_weight_control,
    s.name AS supplier_name, mf.name AS manufacturer_name, c.name AS category_name, v.name AS vessel_name
  FROM 
    "Material" m
  LEFT JOIN
    "Supplier" s ON m.supplier_id = s.id
  LEFT JOIN
    "Manufacturer" mf ON m.manufacturer_id = mf.id
  LEFT JOIN
    "Category" c ON m.category_id = c.id
  LEFT JOIN
    "Vessel" v ON m.vessel_id = v.id`;

export default function materialRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  // 全資材取得 API
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching materials...');
  
      
      // 関連データを取得するクエリ
      const relatedDataQuery = `
        SELECT 
          s.id AS id,
          s.name AS name,
          NULL AS location,
          NULL AS description,
          'supplier' AS data_type
        FROM "Supplier" s WHERE s.enabled = true

        UNION ALL

        SELECT 
          m.id AS id,
          m.name AS name,
          m.location AS location,
          NULL AS description,
          'manufacturer' AS data_type
        FROM "Manufacturer" m WHERE m.enabled = true

        UNION ALL

        SELECT 
          c.id AS id,
          c.name AS name,
          NULL AS location,
          c.description AS description,
          'category' AS data_type
        FROM "Category" c WHERE c.enabled = true
        
        UNION ALL
        
        SELECT 
          v.id AS id,
          v.name AS name,
          NULL AS location,
          NULL AS description,
          'vessel' AS data_type
        FROM "Vessel" v WHERE v.enabled = true;
      `;
      
      // クエリを並行して実行
      const [materialsResult, relatedDataResult] = await Promise.all([
        pool.query(materialsQuery),
        pool.query(relatedDataQuery)
      ]);
      
      // 資材データを整形
      const materials = materialsResult.rows;
      
      // 関連データを分類
      const suppliers: any[] = [];
      const manufacturers: any[] = [];
      const categories: any[] = [];
      const vessels: any[] = [];
      
      // 関連データを直接配列に格納
      relatedDataResult.rows.forEach(row => {
        if (row.data_type === 'supplier') {
          suppliers.push({
            id: row.id,
            name: row.name,
            contact: row.contact,
            address: row.address
          });
        } else if (row.data_type === 'manufacturer') {
          manufacturers.push({
            id: row.id,
            name: row.name,
            location: row.location,
            contact: row.contact
          });
        } else if (row.data_type === 'category') {
          categories.push({
            id: row.id,
            name: row.name,
            description: row.description
          });
        } else if (row.data_type === 'vessel') {
          vessels.push({
            id: row.id,
            name: row.name
          });
        }
      });

      // 整形したデータをレスポンスとして送信
      reply.code(200).send({
        materials,
        suppliers,
        manufacturers,
        categories,
        vessels
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '資材一覧の取得に失敗しました' });
    }
  });

  // 資材作成 API
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // リクエストボディのデバッグ出力
      console.log('Request body:', request.body);
      
      // バリデーション
      const validation = createMaterialSchema.safeParse(request.body);
      
      if (!validation.success) {
        console.log('Validation error:', validation.error.format()); // バリデーションエラーの詳細を出力
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validation.error.format() 
        });
      }
      
      const materialData = validation.data;
      console.log('Validated data:', materialData);
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(materialData);
      
      // SQLユーティリティを使用してクエリを生成（スネークケースのデータを使用）
      const { query, values } = generateInsertQuery('Material', snakeCaseData);
      
      // クエリを実行（トランザクション内で）
      const result = await client.query(query, values);
      const newMaterial = result.rows[0];
      
      // 操作履歴を記録
      const operationLogData = {
        operation_type: 'CREATE',
        table_name: 'Material',
        record_id: newMaterial.id,
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify(materialData)
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
         
      const materialResult = await client.query(materialsQuery.slice(0, -1) + ` WHERE m.id = ${newMaterial.id}`);
      const newMaterialWithRelated = materialResult.rows[0];

      reply.code(201).send(newMaterialWithRelated);
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: '資材の作成に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 資材更新 API
  fastify.put('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // リクエストボディのバリデーション
      const validation = updateMaterialSchema.safeParse(request.body);
      
      if (!validation.success) {
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validation.error.format() 
        });
      }
      
      const materialData = validation.data;
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(materialData);
      
      // 既存の資材を確認
      const checkQuery = generateSelectByIdQuery('Material', 'id', id).query;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '更新対象の資材が見つかりません' });
      }
      
      const existingMaterial = checkResult.rows[0];
      
      // 更新するフィールドがない場合
      if (Object.keys(materialData).length === 0) {
        await client.query('ROLLBACK');
        reply.code(200).send(existingMaterial);
        return;
      }
      
      // SQLユーティリティを使用して更新クエリを生成
      const { query, values } = generateUpdateQuery('Material', snakeCaseData, 'id', id);
      
      // クエリを実行（トランザクション内で）
      const result = await client.query(query, values);
      const updatedMaterial = result.rows[0];
      
      // 操作履歴を記録
      const operationLogData = {
        operation_type: 'UPDATE',
        table_name: 'Material',
        record_id: parseInt(id),
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify({
          before: existingMaterial,
          after: updatedMaterial
        })
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      // JOINされた最新データを取得
      const materialResult = await client.query(materialsQuery.slice(0, -1) + ` WHERE m.id = ${id}`);
      const updatedMaterialWithRelated = materialResult.rows[0];
      
      reply.code(200).send(updatedMaterialWithRelated);
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: '資材の更新に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 資材削除 API
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存の資材を確認
      const checkQuery = generateSelectByIdQuery('Material', 'id', id).query;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '削除対象の資材が見つかりません' });
      }
      
      const existingMaterial = checkResult.rows[0];
      
      // 関連するデータがないか確認（例：在庫データなど）
      const stockCheckQuery = `SELECT COUNT(*) FROM "Stock" WHERE material_id = $1`;
      const stockCheckResult = await client.query(stockCheckQuery, [id]);
      
      if (parseInt(stockCheckResult.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: '削除できません', 
          message: 'この資材に関連する在庫データが存在します。' 
        });
      }
      
      // 操作履歴を記録（削除前に記録）
      const operationLogData = {
        operation_type: 'DELETE',
        table_name: 'Material',
        record_id: parseInt(id),
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify(existingMaterial)
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // SQLユーティリティを使用して削除クエリを生成
      const { query, values } = generateDeleteQuery('Material', 'id', id);
      
      // 削除クエリを実行
      await client.query(query, values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(204).send();
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: '資材の削除に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  done();
}
