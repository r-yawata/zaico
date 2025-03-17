import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import vesselRoutes from '../vesselController';
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

// vesselSchemaのモック
jest.mock('../../../app/sharedSchema/vesselSchema', () => ({
  createVesselSchema: {
    safeParse: jest.fn(),
  },
  updateVesselSchema: {
    safeParse: jest.fn(),
  },
}));

describe('vesselRoutes', () => {
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
    vesselRoutes(fastify, {}, () => {});
  };
  
  describe('GET /', () => {
    it('全容器を正常に取得できること', async () => {
      // モックデータ
      const mockVessels = [
        { id: 1, name: 'テスト容器1', weight: '1.5', material_id: 1 },
        { id: 2, name: 'テスト容器2', weight: '2.0', material_id: 2 },
      ];
      
      const mockRelatedData = [
        { id: 1, name: '資材1', specification: '仕様1', data_type: 'material' },
        { id: 2, name: '資材2', specification: '仕様2', data_type: 'material' },
      ];
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectAllQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Vessel"',
        values: [],
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: mockVessels,
      });
      
      // pool.queryのモック
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: mockRelatedData });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateSelectAllQuery).toHaveBeenCalledWith('Vessel');
      expect(sqlUtils.executeQuery).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        vessels: mockVessels,
        materials: expect.any(Array),
      });
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
        error: '容器一覧の取得に失敗しました' 
      });
    });
  });
  
  describe('GET /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('指定したIDの容器を正常に取得できること', async () => {
      // モックデータ
      const mockVessel = { 
        id: 1, 
        name: 'テスト容器', 
        weight: '1.5', 
        material_id: 1 
      };
      
      const mockMaterial = {
        id: 1,
        name: '資材1',
        specification: '仕様1'
      };
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Vessel" WHERE id = $1',
        values: ['1'],
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: [mockVessel],
      });
      
      // pool.queryのモック
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockMaterial] });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateSelectByIdQuery).toHaveBeenCalledWith('Vessel', 'id', '1');
      expect(sqlUtils.executeQuery).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        name: 'テスト容器',
        material: expect.any(Object)
      }));
    });
    
    it('存在しない容器IDの場合に404を返すこと', async () => {
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
        error: '指定された容器が見つかりません' 
      });
    });
  });
  
  describe('POST /', () => {
    it('容器を正常に作成できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '新規容器',
        weight: '1.5',
        material_id: 1
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.createVesselSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // pool.queryのモック（資材存在確認）
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      // SQLユーティリティのモック
      (sqlUtils.generateInsertQuery as jest.Mock)
        .mockReturnValueOnce({
          query: 'INSERT INTO "Vessel" ...',
          values: ['新規容器', '1.5', 1],
        })
        .mockReturnValueOnce({
          query: 'INSERT INTO "History" ...',
          values: ['CREATE', 'Vessel', 1, null, '{"id":1,"name":"新規容器"}'],
        });
      
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '新規容器', weight: '1.5', material_id: 1 }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateInsertQuery).toHaveBeenCalledWith('Vessel', requestBody);
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
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.createVesselSchema.safeParse.mockReturnValue({
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
    
    it('無効な資材IDの場合に400を返すこと', async () => {
      // リクエストボディ
      const requestBody = {
        name: '新規容器',
        weight: '1.5',
        material_id: 999 // 存在しない資材ID
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.createVesselSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // pool.queryのモック（資材存在確認 - 存在しない）
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '無効な資材ID', 
        message: '指定された資材が存在しません' 
      });
    });
  });
  
  describe('PUT /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('容器を正常に更新できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新容器',
        weight: '2.0',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.updateVesselSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Vessel" WHERE id = $1',
        values: ['1'],
      });
      
      (sqlUtils.generateUpdateQuery as jest.Mock).mockReturnValue({
        query: 'UPDATE "Vessel" SET name = $1, weight = $2 WHERE id = $3',
        values: ['更新容器', '2.0', '1'],
      });
      
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "History" ...',
        values: ['UPDATE', 'Vessel', '1', '{"id":1,"name":"元の容器"}', '{"id":1,"name":"更新容器"}'],
      });
      
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '元の容器', weight: '1.5', material_id: 1 }] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '更新容器', weight: '2.0', material_id: 1 }] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(sqlUtils.generateUpdateQuery).toHaveBeenCalledWith('Vessel', requestBody, 'id', '1');
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
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.updateVesselSchema.safeParse.mockReturnValue({
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
    
    it('存在しない容器の更新時に404を返すこと', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新容器',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const vesselSchema = require('../../../app/sharedSchema/vesselSchema');
      vesselSchema.updateVesselSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // クライアントクエリのモック（容器なし）
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
        error: '更新対象の容器が見つかりません' 
      });
    });
  });
  
  describe('DELETE /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('容器を正常に削除できること', async () => {
      // クライアントクエリのモック
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '削除容器', weight: '1.5', material_id: 1 }] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // 関連データ確認
        .mockResolvedValueOnce({ rows: [] }) // DELETE
        .mockResolvedValueOnce({ rows: [] }) // History INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      
      // SQLユーティリティのモック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Vessel" WHERE id = $1',
        values: ['1'],
      });
      
      (sqlUtils.generateDeleteQuery as jest.Mock).mockReturnValue({
        query: 'DELETE FROM "Vessel" WHERE id = $1',
        values: ['1'],
      });
      
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "History" ...',
        values: ['DELETE', 'Vessel', '1', '{"id":1,"name":"削除容器"}', null],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(sqlUtils.generateDeleteQuery).toHaveBeenCalledWith('Vessel', 'id', '1');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockReply.code).toHaveBeenCalledWith(204);
      expect(mockClient.release).toHaveBeenCalled();
    });
    
    it('存在しない容器の削除時に404を返すこと', async () => {
      // クライアントクエリのモック（容器なし）
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
        error: '削除対象の容器が見つかりません' 
      });
    });
    
    it('関連データがある場合に400を返すこと', async () => {
      // クライアントクエリのモック（関連データあり）
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '削除容器', weight: '1.5', material_id: 1 }] }) // SELECT
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
        message: 'この容器に関連する在庫データが存在します。' 
      });
    });
  });
}); 