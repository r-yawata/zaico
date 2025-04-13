import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pkg from 'pg';
const { Pool } = pkg;
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
import { createCategorySchema, updateCategorySchema } from '../../app/sharedSchema/categorySchema';

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

export default function categoryRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  // 全カテゴリ取得 API
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching categories...');
      
      // SQLユーティリティを使用して全件取得クエリを生成
      const { query, values } = generateSelectAllQuery('Category');
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      reply.code(200).send(result.rows);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリ一覧の取得に失敗しました' });
    }
  });

  // カテゴリ取得 API (ID指定)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      // SQLユーティリティを使用してID指定取得クエリを生成
      const { query, values } = generateSelectByIdQuery('Category', 'id', id);
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: '指定されたカテゴリが見つかりません' });
      }
      
      reply.code(200).send(result.rows[0]);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの取得に失敗しました' });
    }
  });

  // カテゴリ作成 API
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // リクエストボディのデバッグ出力
      console.log('Request body:', request.body); // デバッグ用にリクエストボディを出力
      
      // バリデーション
      const validation = createCategorySchema.safeParse(request.body);
      
      if (!validation.success) {
        console.log('Validation error:', validation.error.format()); // バリデーションエラーの詳細を出力
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validation.error.format() 
        });
      }
      
      const categoryData = validation.data;
      console.log('Validated data:', categoryData); // バリデーション後のデータを出力
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(categoryData);
      
      // SQLユーティリティを使用して挿入クエリを生成
      const { query, values } = generateInsertQuery('Category', snakeCaseData);
      
      // クエリを実行（トランザクション内で）
      const result = await client.query(query, values);
      const newCategory = result.rows[0];
      
      // 操作履歴を記録
      const operationLogData = {
        operation_type: 'CREATE',
        table_name: 'Category',
        record_id: newCategory.id,
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify(categoryData)
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(201).send(newCategory);
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの作成に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // カテゴリ更新 API
  fastify.put('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // リクエストボディのデバッグ出力
      console.log('Request body:', request.body);
      
      // リクエストボディのバリデーション
      const validation = updateCategorySchema.safeParse(request.body);
      
      if (!validation.success) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validation.error.format() 
        });
      }
      
      const categoryData = validation.data;
      
      // バリデーション済みデータをスネークケースに変換（DB操作のため）
      const snakeCaseData = transformToSnakeCase(categoryData);
      
      // 既存のカテゴリを確認
      const checkQuery = generateSelectByIdQuery('Category', 'id', id).query;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '更新対象のカテゴリが見つかりません' });
      }
      
      const existingCategory = checkResult.rows[0];
      
      // 更新するフィールドがない場合
      if (Object.keys(categoryData).length === 0) {
        await client.query('ROLLBACK');
        return reply.code(200).send(existingCategory);
      }
      
      // SQLユーティリティを使用して更新クエリを生成
      const { query, values } = generateUpdateQuery('Category', snakeCaseData, 'id', id);
      
      // クエリを実行（トランザクション内で）
      const result = await client.query(query, values);
      const updatedCategory = result.rows[0];
      
      // 操作履歴を記録
      const operationLogData = {
        operation_type: 'UPDATE',
        table_name: 'Category',
        record_id: parseInt(id),
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify({
          before: existingCategory,
          after: updatedCategory
        })
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(200).send(updatedCategory);
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの更新に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // カテゴリ削除 API
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    // トランザクション用のクライアントを取得
    const client = await pool.connect();
    
    try {
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存のカテゴリを確認
      const checkQuery = generateSelectByIdQuery('Category', 'id', id).query;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '削除対象のカテゴリが見つかりません' });
      }
      
      const existingCategory = checkResult.rows[0];
      
      // 関連するデータがないか確認
      const materialCheckQuery = `SELECT COUNT(*) FROM "Material" WHERE category_id = $1`;
      const materialCheckResult = await client.query(materialCheckQuery, [id]);
      
      if (parseInt(materialCheckResult.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: '削除できません', 
          message: 'このカテゴリに関連する資材データが存在します。' 
        });
      }
      
      // 操作履歴を記録（削除前に記録）
      const operationLogData = {
        operation_type: 'DELETE',
        table_name: 'Category',
        record_id: parseInt(id),
        user_id: (request as any).user?.id,
        operation_details: JSON.stringify(existingCategory)
      };
      
      // SQLユーティリティを使用して操作履歴用のクエリを生成
      const operationLogQueryInfo = generateHistoryInsertQuery('OperationLog', operationLogData);
      
      // 操作履歴クエリを実行
      await client.query(operationLogQueryInfo.query, operationLogQueryInfo.values);
      
      // SQLユーティリティを使用して削除クエリを生成
      const { query, values } = generateDeleteQuery('Category', 'id', id);
      
      // 削除クエリを実行
      await client.query(query, values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(204).send();
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの削除に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  done();
} 