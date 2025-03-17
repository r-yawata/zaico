import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pkg from 'pg';
const { Pool } = pkg;
import { 
  generateInsertQuery, 
  generateUpdateQuery, 
  generateDeleteQuery, 
  generateSelectByIdQuery,
  generateSelectAllQuery,
  executeQuery
} from '../utils/sqlUtils';

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
    try {
      const { name, description } = request.body as any;
      
      // 簡易バリデーション
      if (!name || typeof name !== 'string') {
        return reply.code(400).send({ error: 'カテゴリ名は必須です' });
      }
      
      // 挿入データの準備
      const categoryData = {
        name,
        description: description || null
      };
      
      // SQLユーティリティを使用して挿入クエリを生成
      const { query, values } = generateInsertQuery('Category', categoryData);
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      const newCategory = result.rows[0];
      
      reply.code(201).send(newCategory);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの作成に失敗しました' });
    }
  });

  // カテゴリ更新 API
  fastify.put('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const { name, description } = request.body as any;
      
      // 既存のカテゴリを確認
      const checkResult = await executeQuery(
        pool, 
        generateSelectByIdQuery('Category', 'id', id).query, 
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        return reply.code(404).send({ error: '更新対象のカテゴリが見つかりません' });
      }
      
      // 更新データの準備
      const updateData: Record<string, any> = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      
      // 更新するフィールドがない場合
      if (Object.keys(updateData).length === 0) {
        return reply.code(200).send(checkResult.rows[0]);
      }
      
      // SQLユーティリティを使用して更新クエリを生成
      const { query, values } = generateUpdateQuery('Category', updateData, 'id', id);
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      const updatedCategory = result.rows[0];
      
      reply.code(200).send(updatedCategory);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの更新に失敗しました' });
    }
  });

  // カテゴリ削除 API
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      // 既存のカテゴリを確認
      const checkResult = await executeQuery(
        pool, 
        generateSelectByIdQuery('Category', 'id', id).query, 
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        return reply.code(404).send({ error: '削除対象のカテゴリが見つかりません' });
      }
      
      // 関連するデータがないか確認
      const materialCheckQuery = `SELECT COUNT(*) FROM "Material" WHERE category_id = $1`;
      const materialCheckResult = await pool.query(materialCheckQuery, [id]);
      
      if (parseInt(materialCheckResult.rows[0].count) > 0) {
        return reply.code(400).send({ 
          error: '削除できません', 
          message: 'このカテゴリに関連する資材データが存在します。' 
        });
      }
      
      // SQLユーティリティを使用して削除クエリを生成
      const { query, values } = generateDeleteQuery('Category', 'id', id);
      
      // クエリを実行
      await executeQuery(pool, query, values);
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'カテゴリの削除に失敗しました' });
    }
  });

  done();
} 