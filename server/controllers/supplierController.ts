import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pkg from 'pg';
const { Pool } = pkg;
import { 
  generateInsertQuery, 
  generateUpdateQuery, 
  generateDeleteQuery, 
  generateSelectByIdQuery,
  generateSelectAllQuery,
  executeQuery,
  generateHistoryInsertQuery,
  transformToCamelCase,
  transformToSnakeCase
} from '../utils/sqlUtils';
import { 
  createSupplierSchema, 
  updateSupplierSchema 
} from '../../app/sharedSchema/supplierSchema';

// PostgreSQLの接続設定
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

export default function supplierRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  // 全仕入先取得 API
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching suppliers...');
      
      // SQLユーティリティを使用して全件取得クエリを生成
      const { query, values } = generateSelectAllQuery('Supplier');
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      reply.code(200).send(result.rows);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '仕入先一覧の取得に失敗しました' });
    }
  });

  // 仕入先取得 API (ID指定)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      // SQLユーティリティを使用してID指定取得クエリを生成
      const { query, values } = generateSelectByIdQuery('Supplier', 'id', id);
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: '指定された仕入先が見つかりません' });
      }
      
      reply.code(200).send(result.rows[0]);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '仕入先の取得に失敗しました' });
    }
  });

  // 仕入先作成 API
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const client = await pool.connect();
    
    try {
      // リクエストボディのバリデーション
      const validationResult = createSupplierSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        fastify.log.error(`バリデーションエラー: ${JSON.stringify(validationResult.error)}`);
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validationResult.error.format() 
        });
      }
      
      const supplierData = validationResult.data;
      console.log(`仕入先作成リクエスト: ${JSON.stringify(supplierData)}`);
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(supplierData);
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // SQLユーティリティを使用して挿入クエリを生成
      const { query, values } = generateInsertQuery('Supplier', snakeCaseData);
      
      // クエリを実行
      const result = await client.query(query, values);
      const newSupplier = result.rows[0];
      
      // 履歴を記録
      const historyData = {
        operation_type: 'CREATE',
        table_name: 'Supplier',
        record_id: newSupplier.id,
        operation_details: {
          new_data: newSupplier
        }
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(201).send(newSupplier);
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`仕入先作成エラー: ${error}`);
      reply.code(500).send({ error: '仕入先の作成に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 仕入先更新 API
  fastify.put('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await pool.connect();
    
    try {
      // リクエストボディのバリデーション
      const validationResult = updateSupplierSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        fastify.log.error(`バリデーションエラー: ${JSON.stringify(validationResult.error)}`);
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validationResult.error.format() 
        });
      }
      
      const updateData = validationResult.data;
      console.log(`仕入先更新リクエスト: ID=${id}, データ=${JSON.stringify(updateData)}`);
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(updateData);
      
      // 更新するフィールドがない場合
      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({ error: '更新するデータがありません' });
      }
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存の仕入先を確認
      const { query: selectQuery, values: selectValues } = generateSelectByIdQuery('Supplier', 'id', id);
      const existingResult = await client.query(selectQuery, selectValues);
      
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '更新対象の仕入先が見つかりません' });
      }
      
      const existingSupplier = existingResult.rows[0];
      
      // SQLユーティリティを使用して更新クエリを生成
      const { query, values } = generateUpdateQuery('Supplier', snakeCaseData, 'id', id);
      
      // クエリを実行
      const result = await client.query(query, values);
      const updatedSupplier = result.rows[0];
      
      // 履歴を記録
      const historyData = {
        operation_type: 'UPDATE',
        table_name: 'Supplier',
        record_id: id,
        operation_details: {
          old_data: existingSupplier,
          new_data: updatedSupplier
        }
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(200).send(updatedSupplier);
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`仕入先更新エラー: ${error}`);
      reply.code(500).send({ error: '仕入先の更新に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 仕入先削除 API
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await pool.connect();
    
    try {
      console.log(`仕入先削除リクエスト: ID=${id}`);
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存の仕入先を確認
      const { query: selectQuery, values: selectValues } = generateSelectByIdQuery('Supplier', 'id', id);
      const existingResult = await client.query(selectQuery, selectValues);
      
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '削除対象の仕入先が見つかりません' });
      }
      
      const existingSupplier = existingResult.rows[0];
      
      // 関連するデータがないか確認
      const materialCheckQuery = `SELECT COUNT(*) FROM "Material" WHERE supplier_id = $1`;
      const materialCheckResult = await client.query(materialCheckQuery, [id]);
      
      if (parseInt(materialCheckResult.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: '削除できません', 
          message: 'この仕入先に関連する資材データが存在します。' 
        });
      }
      
      // SQLユーティリティを使用して削除クエリを生成
      const { query, values } = generateDeleteQuery('Supplier', 'id', id);
      
      // クエリを実行
      await client.query(query, values);
      
      // 履歴を記録
      const historyData = {
        operation_type: 'DELETE',
        table_name: 'Supplier',
        record_id: id,
        operation_details: {
          old_data: existingSupplier
        }
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(204).send();
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`仕入先削除エラー: ${error}`);
      reply.code(500).send({ error: '仕入先の削除に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  done();
} 