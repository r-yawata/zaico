import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import supplierRoutes from '../supplierController';
import * as sqlUtils from '../../utils/sqlUtils';

// pgモジュールのモック
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
  };
  return { 
    Pool: jest.fn(() => mockPool) 
  };
});

// SQLユーティリティのモック
jest.mock('../../utils/sqlUtils', () => ({
  generateInsertQuery: jest.fn(),
  generateUpdateQuery: jest.fn(),
  generateDeleteQuery: jest.fn(),
  generateSelectByIdQuery: jest.fn(),
  generateSelectAllQuery: jest.fn(),
  executeQuery: jest.fn(),
}));

// supplierSchemaのモック
jest.mock('../../../app/sharedSchema/supplierSchema', () => ({
  createSupplierSchema: {
    safeParse: jest.fn(),
  },
  updateSupplierSchema: {
    safeParse: jest.fn(),
  },
}));

describe('supplierRoutes', () => {
  let fastify: FastifyInstance;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockClient: any;
  
  beforeEach(() => {
    // Fastifyインスタンスのモック
    fastify = {
      get: jest.fn((path, handler) => {
        handlers.get = handler;
        return fastify;
      }),
      post: jest.fn((path, handler) => {
        handlers.post = handler;
        return fastify;
      }),
      put: jest.fn((path, handler) => {
        handlers.put = handler;
        return fastify;
      }),
      delete: jest.fn((path, handler) => {
        handlers.delete = handler;
        return fastify;
      }),
      log: {
        error: jest.fn(),
      },
    } as unknown as FastifyInstance;
    
    // リクエストとレスポンスのモック
    mockRequest = {
      body: {},
      params: {},
    };
    
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    
    // クライアントのモック
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    // pool.connectのモック
    require('pg').Pool().connect.mockResolvedValue(mockClient);
    
    // ハンドラーをリセット
    handlers = {};
    
    // SQLユーティリティのモックをリセット
    jest.clearAllMocks();
  });
  
  // ハンドラーを保存するオブジェクト
  let handlers: Record<string, any> = {};
  
  // ルート登録
  const registerRoutes = () => {
    supplierRoutes(fastify, {}, () => {});
  };
  
  describe('GET /', () => {
    it('全仕入先を正常に取得できること', async () => {
      // モックデータ
      const mockSuppliers = [
        { id: 1, name: 'テスト仕入先1', contact: '連絡先1', address: '住所1' },
        { id: 2, name: 'テスト仕入先2', contact: '連絡先2', address: '住所2' },
      ];
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectAllQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Supplier" WHERE "enabled" = true',
        values: [],
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: mockSuppliers,
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateSelectAllQuery).toHaveBeenCalledWith('Supplier');
      expect(sqlUtils.executeQuery).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockSuppliers);
    });
    
    it('エラー発生時に500を返すこと', async () => {
      // SQLユーティリティのモック（エラー発生）
      (sqlUtils.executeQuery as jest.Mock).mockRejectedValue(new Error('データベースエラー'));
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '仕入先一覧の取得に失敗しました' 
      });
    });
  });
  
  describe('GET /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('指定したIDの仕入先を正常に取得できること', async () => {
      // モックデータ
      const mockSupplier = { 
        id: 1, 
        name: 'テスト仕入先', 
        contact: '連絡先', 
        address: '住所' 
      };
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Supplier" WHERE id = $1 AND "enabled" = true',
        values: ['1'],
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: [mockSupplier],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateSelectByIdQuery).toHaveBeenCalledWith('Supplier', 'id', '1');
      expect(sqlUtils.executeQuery).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockSupplier);
    });
    
    it('存在しない仕入先IDの場合に404を返すこと', async () => {
      // SQLユーティリティのモック（空の結果）
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: [],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '指定された仕入先が見つかりません' 
      });
    });
  });
  
  describe('POST /', () => {
    it('仕入先を正常に作成できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '新規仕入先',
        contact: '新規連絡先',
        address: '新規住所',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.createSupplierSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // SQLユーティリティのモック
      (sqlUtils.generateInsertQuery as jest.Mock)
        .mockReturnValueOnce({
          query: 'INSERT INTO "Supplier" ...',
          values: ['新規仕入先', '新規連絡先', '新規住所'],
        })
        .mockReturnValueOnce({
          query: 'INSERT INTO "OperationLog" ...',
          values: ['CREATE', 'Supplier', 1, null, '{"id":1,"name":"新規仕入先"}'],
        });
      
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '新規仕入先', contact: '新規連絡先', address: '新規住所' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateInsertQuery).toHaveBeenCalledWith('Supplier', requestBody);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('バリデーションエラー時に400を返すこと', async () => {
      // リクエストボディ
      mockRequest.body = {
        // 必須フィールドが不足
      };
      
      // バリデーションモック（失敗）
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.createSupplierSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          format: () => ({ name: { _errors: ['必須フィールドです'] } }),
        },
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        error: 'バリデーションエラー',
      }));
    });
    
    it('データベースエラー時に500を返し、トランザクションをロールバックすること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '新規仕入先',
        contact: '新規連絡先',
        address: '新規住所',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.createSupplierSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // SQLユーティリティのモック
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "Supplier" ...',
        values: ['新規仕入先', '新規連絡先', '新規住所'],
      });
      
      // クライアントクエリのモック（エラー発生）
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('データベースエラー')); // INSERT
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
  
  describe('PUT /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('仕入先を正常に更新できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新仕入先',
        contact: '更新連絡先',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.updateSupplierSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Supplier" WHERE id = $1 AND "enabled" = true',
        values: ['1'],
      });
      
      (sqlUtils.generateUpdateQuery as jest.Mock).mockReturnValue({
        query: 'UPDATE "Supplier" SET name = $1, contact = $2 WHERE id = $3',
        values: ['更新仕入先', '更新連絡先', '1'],
      });
      
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "OperationLog" ...',
        values: ['UPDATE', 'Supplier', '1', '{"id":1,"name":"元の仕入先"}', '{"id":1,"name":"更新仕入先"}'],
      });
      
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '元の仕入先', contact: '元の連絡先', address: '住所' }] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '更新仕入先', contact: '更新連絡先', address: '住所' }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(sqlUtils.generateUpdateQuery).toHaveBeenCalledWith('Supplier', requestBody, 'id', '1');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('バリデーションエラー時に400を返すこと', async () => {
      // リクエストボディ
      mockRequest.body = {
        name: '', // 無効な値
      };
      
      // バリデーションモック（失敗）
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.updateSupplierSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          format: () => ({ name: { _errors: ['1文字以上である必要があります'] } }),
        },
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        error: 'バリデーションエラー',
      }));
    });
    
    it('存在しない仕入先の更新時に404を返すこと', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新仕入先',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const supplierSchema = require('../../../app/sharedSchema/supplierSchema');
      supplierSchema.updateSupplierSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // クライアントクエリのモック（仕入先なし）
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT（結果なし）
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '更新対象の仕入先が見つかりません' 
      });
    });
  });
  
  describe('DELETE /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('仕入先を正常に論理削除できること', async () => {
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '削除仕入先', contact: '連絡先', address: '住所' }] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 関連データ確認
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '削除仕入先', contact: '連絡先', address: '住所', enabled: false }] }) // 論理削除（UPDATE）
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Supplier" WHERE id = $1 AND "enabled" = true',
        values: ['1'],
      });
      
      (sqlUtils.generateDeleteQuery as jest.Mock).mockReturnValue({
        query: 'UPDATE "Supplier" SET "enabled" = false, "updated_at" = NOW() WHERE id = $1 RETURNING *',
        values: ['1'],
      });
      
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "OperationLog" ...',
        values: ['DELETE', 'Supplier', '1', '{"id":1,"name":"削除仕入先"}', null],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(sqlUtils.generateDeleteQuery).toHaveBeenCalledWith('Supplier', 'id', '1');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockReply.code).toHaveBeenCalledWith(204);
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('存在しない仕入先の削除時に404を返すこと', async () => {
      // クライアントクエリのモック（仕入先なし）
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT（結果なし）
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '削除対象の仕入先が見つかりません' 
      });
    });
    
    it('関連データがある場合に400を返すこと', async () => {
      // クライアントクエリのモック（関連データあり）
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '削除仕入先', contact: '連絡先', address: '住所' }] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // 関連データ確認（データあり）
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '削除できません', 
        message: 'この仕入先に関連する資材データが存在します。' 
      });
    });
  });
}); 