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
  generateHistoryInsertQuery
} from '../utils/sqlUtils';
import { 
  createVesselSchema, 
  updateVesselSchema 
} from '../../app/sharedSchema/vesselSchema';

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

export default function vesselRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  // 全容器取得 API
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching vessels...');
      
      // SQLユーティリティを使用して全件取得クエリを生成
      const { query, values } = generateSelectAllQuery('Vessel');
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      console.log(result.rows);

      reply.code(200).send({
        vessels: result.rows,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '容器一覧の取得に失敗しました' });
    }
  });

  // 容器取得 API (ID指定)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      // SQLユーティリティを使用してID指定取得クエリを生成
      const { query, values } = generateSelectByIdQuery('Vessel', 'id', id);
      
      // クエリを実行
      const result = await executeQuery(pool, query, values);
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: '指定された容器が見つかりません' });
      }
      
      const vessel = result.rows[0];
      
      // 関連する資材データを取得（存在する場合）
      if (vessel.material_id) {
        const materialQuery = `SELECT * FROM "Material" WHERE id = $1`;
        const materialResult = await pool.query(materialQuery, [vessel.material_id]);
        
        if (materialResult.rows.length > 0) {
          vessel.material = materialResult.rows[0];
        }
      }
      
      reply.code(200).send(vessel);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '容器の取得に失敗しました' });
    }
  });

  // 容器作成 API
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const client = await pool.connect();
    
    try {
      // リクエストボディのバリデーション
      const validationResult = createVesselSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        fastify.log.error(`バリデーションエラー: ${JSON.stringify(validationResult.error)}`);
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validationResult.error.format() 
        });
      }
      
      const vesselData = validationResult.data;
      console.log(`容器作成リクエスト: ${JSON.stringify(vesselData)}`);
      
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // SQLユーティリティを使用して挿入クエリを生成
      const { query, values } = generateInsertQuery('Vessel', vesselData);
      
      // クエリを実行
      const result = await client.query(query, values);
      const newVessel = result.rows[0];
      
      // 履歴を記録
      const historyData = {
        operation_type: 'CREATE',
        table_name: 'Vessel',
        record_id: newVessel.id,
        operation_details: JSON.stringify({
          oldData: null,
          newData: newVessel
        }),
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(201).send(newVessel);
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`容器作成エラー: ${error}`);
      reply.code(500).send({ error: '容器の作成に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 容器更新 API
  fastify.put('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await pool.connect();
    
    try {
      // リクエストボディのバリデーション
      const validationResult = updateVesselSchema.safeParse(request.body);
      
      if (!validationResult.success) {
        fastify.log.error(`バリデーションエラー: ${JSON.stringify(validationResult.error)}`);
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validationResult.error.format() 
        });
      }
      
      const updateData = validationResult.data;
      console.log(`容器更新リクエスト: ID=${id}, データ=${JSON.stringify(updateData)}`);
      
      // 更新するフィールドがない場合
      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({ error: '更新するデータがありません' });
      }
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存の容器を確認
      const { query: selectQuery, values: selectValues } = generateSelectByIdQuery('Vessel', 'id', id);
      const existingResult = await client.query(selectQuery, selectValues);
      
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '更新対象の容器が見つかりません' });
      }
      
      const existingVessel = existingResult.rows[0];
      
      // SQLユーティリティを使用して更新クエリを生成
      const { query, values } = generateUpdateQuery('Vessel', updateData, 'id', id);
      
      // クエリを実行
      const result = await client.query(query, values);
      const updatedVessel = result.rows[0];
      
      // 履歴を記録
      const historyData = {
        operation_type: 'UPDATE',
        table_name: 'Vessel',
        record_id: id,
        operation_details: JSON.stringify({
          oldData: existingVessel,
          newData: updatedVessel
        }),
        created_at: new Date()
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(200).send(updatedVessel);
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`容器更新エラー: ${error}`);
      reply.code(500).send({ error: '容器の更新に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  // 容器削除 API
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    const client = await pool.connect();
    
    try {
      console.log(`容器削除リクエスト: ID=${id}`);
      
      // トランザクション開始
      await client.query('BEGIN');
      
      // 既存の容器を確認
      const { query: selectQuery, values: selectValues } = generateSelectByIdQuery('Vessel', 'id', id);
      const existingResult = await client.query(selectQuery, selectValues);
      
      if (existingResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: '削除対象の容器が見つかりません' });
      }
      
      const existingVessel = existingResult.rows[0];
      
      // 関連するデータがないか確認
      const stockCheckQuery = `SELECT COUNT(*) FROM "Stock" WHERE vessel_id = $1`;
      const stockCheckResult = await client.query(stockCheckQuery, [id]);
      
      if (parseInt(stockCheckResult.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ 
          error: '削除できません', 
          message: 'この容器に関連する在庫データが存在します。' 
        });
      }
      
      // SQLユーティリティを使用して削除クエリを生成
      const { query, values } = generateDeleteQuery('Vessel', 'id', id);
      
      // クエリを実行
      await client.query(query, values);
      
      // 履歴を記録
      const historyData = {
        operation_type: 'DELETE',
        table_name: 'Vessel',
        record_id: id,
        operation_details: JSON.stringify({
          oldData: existingVessel,
          newData: null
        }),
      };
      
      const historyQuery = generateHistoryInsertQuery('OperationLog', historyData);
      await client.query(historyQuery.query, historyQuery.values);
      
      // トランザクションをコミット
      await client.query('COMMIT');
      
      reply.code(204).send();
    } catch (error) {
      // トランザクションをロールバック
      await client.query('ROLLBACK');
      
      fastify.log.error(`容器削除エラー: ${error}`);
      reply.code(500).send({ error: '容器の削除に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  done();
} 