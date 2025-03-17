import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import materialRoutes from '../materialController';
import * as sqlUtils from '../../utils/sqlUtils';

// pgモジュールのモック
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
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

// materialSchemaのモック
jest.mock('../../../app/sharedSchema/materialSchema', () => ({
  createMaterialSchema: {
    safeParse: jest.fn(),
  },
  updateMaterialSchema: {
    safeParse: jest.fn(),
  },
}));

describe('materialRoutes', () => {
  let fastify: FastifyInstance;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  
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
    
    // ハンドラーをリセット
    handlers = {};
    
    // SQLユーティリティのモックをリセット
    jest.clearAllMocks();
  });
  
  // ハンドラーを保存するオブジェクト
  let handlers: Record<string, any> = {};
  
  // ルート登録
  const registerRoutes = () => {
    materialRoutes(fastify, {}, () => {});
  };
  
  describe('GET /', () => {
    it('全資材を正常に取得できること', async () => {
      // モックデータ
      const mockMaterials = [
        { id: 1, name: 'テスト資材1' },
        { id: 2, name: 'テスト資材2' },
      ];
      
      const mockRelatedData = [
        { id: 1, name: 'サプライヤー1', data_type: 'supplier' },
        { id: 1, name: 'メーカー1', location: '東京', data_type: 'manufacturer' },
        { id: 1, name: 'カテゴリー1', description: '説明', data_type: 'category' },
      ];
      
      // pool.queryのモック
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery
        .mockResolvedValueOnce({ rows: mockMaterials })
        .mockResolvedValueOnce({ rows: mockRelatedData });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        materials: mockMaterials,
        suppliers: expect.any(Array),
        manufacturers: expect.any(Array),
        categories: expect.any(Array),
      });
    });
    
    it('エラー発生時に500を返すこと', async () => {
      // pool.queryのモック（エラー発生）
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockRejectedValueOnce(new Error('データベースエラー'));
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.get(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '資材一覧の取得に失敗しました' 
      });
    });
  });
  
  describe('POST /', () => {
    it('資材を正常に作成できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '新規資材',
        specification: '仕様',
        package_count: 10,
        unit_weight: '1.5',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const materialSchema = require('../../../app/sharedSchema/materialSchema');
      materialSchema.createMaterialSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // SQLユーティリティのモック
      (sqlUtils.generateInsertQuery as jest.Mock).mockReturnValue({
        query: 'INSERT INTO "Material" ...',
        values: ['新規資材', '仕様', 10, '1.5'],
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, name: '新規資材', specification: '仕様', package_count: 10, unit_weight: '1.5' }],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.post(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateInsertQuery).toHaveBeenCalledWith('Material', requestBody);
      expect(sqlUtils.executeQuery).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(201);
    });
    
    it('バリデーションエラー時に400を返すこと', async () => {
      // リクエストボディ
      mockRequest.body = {
        // 必須フィールドが不足
      };
      
      // バリデーションモック（失敗）
      const materialSchema = require('../../../app/sharedSchema/materialSchema');
      materialSchema.createMaterialSchema.safeParse.mockReturnValue({
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
  });
  
  describe('PUT /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('資材を正常に更新できること', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新資材',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const materialSchema = require('../../../app/sharedSchema/materialSchema');
      materialSchema.updateMaterialSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // 既存資材の確認モック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Material" WHERE id = $1',
      });
      
      (sqlUtils.executeQuery as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '元の資材' }] }) // 既存資材確認
        .mockResolvedValueOnce({ rows: [{ id: 1, name: '更新資材' }] }); // 更新後
      
      (sqlUtils.generateUpdateQuery as jest.Mock).mockReturnValue({
        query: 'UPDATE "Material" SET name = $1 WHERE id = $2',
        values: ['更新資材', '1'],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateUpdateQuery).toHaveBeenCalledWith('Material', requestBody, 'id', '1');
      expect(mockReply.code).toHaveBeenCalledWith(200);
    });
    
    it('存在しない資材の更新時に404を返すこと', async () => {
      // リクエストボディ
      const requestBody = {
        name: '更新資材',
      };
      mockRequest.body = requestBody;
      
      // バリデーションモック
      const materialSchema = require('../../../app/sharedSchema/materialSchema');
      materialSchema.updateMaterialSchema.safeParse.mockReturnValue({
        success: true,
        data: requestBody,
      });
      
      // 既存資材の確認モック（資材なし）
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Material" WHERE id = $1',
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.put(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '更新対象の資材が見つかりません' 
      });
    });
  });
  
  describe('DELETE /:id', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });
    
    it('資材を正常に削除できること', async () => {
      // 既存資材の確認モック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Material" WHERE id = $1',
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValueOnce({ 
        rows: [{ id: 1, name: '削除資材' }] 
      });
      
      // 関連データ確認モック
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      
      // 削除クエリモック
      (sqlUtils.generateDeleteQuery as jest.Mock).mockReturnValue({
        query: 'DELETE FROM "Material" WHERE id = $1',
        values: ['1'],
      });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(sqlUtils.generateDeleteQuery).toHaveBeenCalledWith('Material', 'id', '1');
      expect(mockReply.code).toHaveBeenCalledWith(204);
    });
    
    it('存在しない資材の削除時に404を返すこと', async () => {
      // 既存資材の確認モック（資材なし）
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Material" WHERE id = $1',
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '削除対象の資材が見つかりません' 
      });
    });
    
    it('関連データがある場合に400を返すこと', async () => {
      // 既存資材の確認モック
      (sqlUtils.generateSelectByIdQuery as jest.Mock).mockReturnValue({
        query: 'SELECT * FROM "Material" WHERE id = $1',
      });
      
      (sqlUtils.executeQuery as jest.Mock).mockResolvedValueOnce({ 
        rows: [{ id: 1, name: '削除資材' }] 
      });
      
      // 関連データ確認モック（関連データあり）
      const mockPoolQuery = require('pg').Pool().query;
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      
      // ルート登録
      registerRoutes();
      
      // ハンドラー実行
      await handlers.delete(mockRequest, mockReply);
      
      // 検証
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ 
        error: '削除できません', 
        message: 'この資材に関連する在庫データが存在します。' 
      });
    });
  });
}); 