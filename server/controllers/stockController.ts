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
import { createStockSchema, updateStockSchema } from '../../app/sharedSchema/stockSchema';

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

// 在庫データを取得するクエリ
const stocksQuery = `
  SELECT 
    s.id, s.product_name, s.lot, s.status, s.registration_date, s.update_date,
    s.remarks, s.expiration_date, s.storage_date, s.current_weight, s.net_weight,
    s.vessel_weight, s.inbound_weight, s.material_id, s.vessel_id, s.creator_id,
    s.extra_config, s.parent_stock_id, s.created_at, s.updated_at,
    m.id AS material_id, m.name AS material_name, m.specification AS material_specification,
    m.supplier_id, s2.name AS supplier_name, m.manufacturer_id, mf.name AS manufacturer_name,
    m.category_id, c.name AS category_name,
    v.id AS vessel_id, v.name AS vessel_name, v.weight AS vessel_weight,
    u.id AS creator_id, u.username AS creator_username, u.email AS creator_email
  FROM 
    "Stock" s
  LEFT JOIN
    "Material" m ON s.material_id = m.id
  LEFT JOIN
    "Supplier" s2 ON m.supplier_id = s2.id
  LEFT JOIN
    "Manufacturer" mf ON m.manufacturer_id = mf.id
  LEFT JOIN
    "Category" c ON m.category_id = c.id
  LEFT JOIN
    "Vessel" v ON s.vessel_id = v.id
  LEFT JOIN
    "User" u ON s.creator_id = u.id`;

export default function stockRoutes(fastify: FastifyInstance, opts: any, done: () => void) {
  // 全在庫取得 API
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching stocks...');
      
      // 在庫データを取得
      const stocksResult = await pool.query(stocksQuery);
      
      // 在庫データをそのまま返す
      const stocks = stocksResult.rows;

      // 整形したデータをレスポンスとして送信
      reply.code(200).send({
        stocks
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '在庫一覧の取得に失敗しました' });
    }
  });

  // 在庫取得 API (ID指定)
  fastify.get('/:id', async (request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      // IDで指定した在庫データを取得
      const stockResult = await pool.query(stocksQuery + ` WHERE s.id = $1`, [id]);
      
      if (stockResult.rows.length === 0) {
        return reply.code(404).send({ error: '指定された在庫が見つかりません' });
      }
      
      // 単一の在庫データをそのまま返す
      const stock = stockResult.rows[0];

      reply.code(200).send(stock);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: '在庫の取得に失敗しました' });
    }
  });

  // 在庫登録 API
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // クライアントとのトランザクション開始
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // リクエストボディのデバッグ出力
      console.log('Request body:', request.body);
      
      // バリデーション
      const validation = createStockSchema.safeParse(request.body);
      
      if (!validation.success) {
        console.log('Validation error:', validation.error.format()); // バリデーションエラーの詳細を出力
        return reply.code(400).send({ 
          error: 'バリデーションエラー', 
          details: validation.error.format() 
        });
      }
      
      const stockData = validation.data;
      console.log('Validated data:', stockData);
      
      // スネークケースに変換
      const stockDataSnakeCase = transformToSnakeCase(stockData);
      
      // データベースに存在しないフィールドを削除
      const allowedFields = [
          'product_name', 'lot', 'status', 'registration_date', 'update_date',
          'remarks', 'expiration_date', 'storage_date', 'current_weight',
          'net_weight', 'vessel_weight', 'inbound_weight', 'material_id',
          'vessel_id', 'creator_id', 'extra_config', 'parent_stock_id',
      ];
      
      // 許可されたフィールドだけを含む新しいオブジェクトを作成
      const filteredStockData = Object.fromEntries(
          Object.entries(stockDataSnakeCase).filter(([key]) => allowedFields.includes(key))
      );
      
      // 在庫データをデータベースに登録
      const { query, values } = generateInsertQuery('Stock', filteredStockData);
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return reply.code(500).send({ error: '在庫の登録に失敗しました' });
      }
      
      // 登録された在庫データを返す
      const newStock = result.rows[0];
      
      // 入庫履歴のデータを作成
      const historyData = {
          stock_id: newStock.id,
          action: '入庫',
          weight_change: newStock.inbound_weight,
          remarks: newStock.remarks,
          performed_by_id: newStock.creator_id
      };
      
      // 入庫履歴をデータベースに登録
      const historyQuery = generateHistoryInsertQuery('StockHistory', historyData);
      const historyResult = await client.query(historyQuery.query, historyQuery.values);
      
      if (historyResult.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return reply.code(500).send({ error: '入庫履歴の登録に失敗しました' });
      }
      
      // トランザクションをコミット
      await client.query('COMMIT');

      reply.code(201).send(newStock);
    } catch (error) {
      // エラー発生時はロールバック
      await client.query('ROLLBACK');
      fastify.log.error(error);
      reply.code(500).send({ error: '在庫の登録に失敗しました' });
    } finally {
      // クライアントを解放
      client.release();
    }
  });

  done();
} 