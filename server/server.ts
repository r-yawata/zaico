import Fastify from 'fastify';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fastifyCors from '@fastify/cors';
import { materialRoutes, categoryRoutes, manufacturerRoutes, supplierRoutes, vesselRoutes } from './controllers';

dotenv.config();

const fastify = Fastify({ logger: true });

// PostgreSQL クライアントの設定
const pgClient = new Client({
    //   connectionString: process.env.DATABASE_URL,
    host: 'localhost',
    port: 5432,
    database: 'zaicobox', // Supabaseはデフォルトで "postgres" を使用
    user: 'postgres',  // Supabaseのダッシュボードから取得
    password: 'btechnexcell', // Supabaseのダッシュボードから取得
    ssl: false,
    // ssl: {
    //     rejectUnauthorized: false 
    // }
});

pgClient.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error", err));

// CORSの設定
fastify.register(fastifyCors, {
  origin: true, // すべてのオリジンを許可（開発時のみ）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 許可するHTTPメソッドを明示的に指定
  allowedHeaders: ['Content-Type', 'Authorization'] // 許可するヘッダーを指定
});

// API ルートを登録
fastify.register(materialRoutes, { prefix: '/api/materials' });
fastify.register(categoryRoutes, { prefix: '/api/categories' });
fastify.register(manufacturerRoutes, { prefix: '/api/manufacturers' });
fastify.register(supplierRoutes, { prefix: '/api/suppliers' });
fastify.register(vesselRoutes, { prefix: '/api/vessels' });

// // 古いエンドポイント（参考のために残しておく）
// fastify.get('/materials', async (request, reply) => {
//   try {
//     const result = await pgClient.query('SELECT * FROM test');
//     console.log(result.rows);
//     reply.send(result.rows);
//   } catch (err) {
//     fastify.log.error(err);
//     reply.status(500).send({ error: 'Failed to fetch test' });
//   }
// });

// サーバー起動
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
