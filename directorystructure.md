├── .cursor-rules/              # Cursorエディタのルール設定 (global.mdcなど)
├── .dockerignore               # Dockerビルド時に除外するファイル設定
├── .gitignore                  # Git管理から除外するファイル設定
├── .react-router/              # React Routerの型定義 (自動生成)
│   └── types/                  # ルート別の型定義
├── Dockerfile                  # Dockerコンテナ構築設定
├── README.md                   # プロジェクト説明書
├── SPECIFICATION.md            # システム仕様書
├── app/                        # アプリケーションのメインコード (フロントエンド: React)
│   ├── components/             # 再利用可能なコンポーネント
│   │   ├── Layout.tsx          # 全体のレイアウトコンポーネント
│   │   ├── form.tsx            # フォーム関連の共通コンポーネント (使用箇所に応じて分割検討)
│   │   ├── navigation/         # ナビゲーション関連コンポーネント
│   │   │   ├── Navbar.tsx      # 上部ナビゲーションバー
│   │   │   └── Sidebar.tsx     # サイドバーメニュー
│   │   └── ui/                 # 基本的なUI要素 (shadcn/uiベース)
│   │       ├── FormGenerator.tsx # フォーム定義に基づきフォームを生成するコンポーネント
│   │       ├── button.tsx      # ボタンコンポーネント
│   │       ├── input.tsx       # 入力フィールドコンポーネント
│   │       ├── label.tsx       # ラベルコンポーネント
│   │       ├── select.tsx      # セレクトコンポーネント
│   │       ├── table.tsx       # テーブルコンポーネント
│   │       ├── tabs.tsx        # タブコンポーネント
│   │       └── textarea.tsx    # テキストエリアコンポーネント
│   ├── lib/                    # フロントエンド用ユーティリティ関数・設定
│   │   ├── api.ts              # APIリクエスト関数 (apiRequest)
│   │   └── utils.ts            # 汎用ユーティリティ (cn関数など)
│   ├── routes/                 # 各画面・機能のルートコンポーネント
│   │   ├── dashboard/          # ダッシュボード関連
│   │   │   └── dashboard.tsx   # ダッシュボード画面
│   │   ├── index.tsx           # ルートインデックス (例: /)
│   │   ├── inventory/          # 在庫管理関連
│   │   │   └── inventory.tsx   # 在庫一覧・詳細画面など
│   │   ├── master/             # マスタデータ管理
│   │   │   ├── index.tsx       # マスタ管理トップ画面
│   │   │   ├── materials.tsx   # 材料マスタ画面
│   │   │   └── suppliers.tsx   # サプライヤーマスタ画面
│   │   └── operations/         # 在庫操作関連
│   │       ├── index.tsx       # 在庫操作トップ画面
│   │       ├── inbound.tsx     # 入庫処理画面
│   │       └── reservation.tsx # 出庫予約画面
│   ├── stores/                 # 状態管理 (Zustand)
│   │   ├── navigationStore.ts  # ナビゲーション関連の状態
│   │   ├── stockStore.ts       # 在庫データ関連の状態
│   │   └── userSessionStore.ts # ユーザーセッション・認証状態
│   ├── sharedSchema/           # フロントエンド・バックエンド共通のZodスキーマ定義
│   │   └── materialSchema.ts   # 材料関連のスキーマ例
│   ├── types/                  # 型定義 (段階的にsharedSchemaへ移行)
│   │   └── index.ts            # 共通の型定義
│   ├── utils/                  # フロントエンド固有のユーティリティ (app/lib/utils.ts と役割分担)
│   ├── welcome/                # ウェルカムページ・初期表示関連
│   ├── app.css                 # アプリケーション全体のグローバルCSS
│   ├── root.tsx                # アプリケーションのエントリーポイント・ルートコンポーネント
│   └── routes.ts               # ルーティング定義 (React Router)
├── directorystructure.md       # このファイル: ディレクトリ構造説明
├── node_modules/               # npmが管理する依存パッケージ
├── prisma/                     # Prisma ORM関連ファイル
│   ├── migrations/             # データベースマイグレーション履歴
│   └── schema/                 # Prismaスキーマ定義ファイル群
│       └── stock.prisma        # 在庫関連のスキーマ定義 (他のモデルもここに追加)
├── package-lock.json           # 依存関係のバージョンロックファイル
├── package.json                # プロジェクト設定・依存パッケージ定義
├── public/                     # ビルド時にそのままコピーされる静的ファイル
│   └── favicon.ico             # ファビコン
├── server/                     # サーバーサイドコード (Node.js)
│   ├── controllers/            # APIエンドポイントのロジック (リクエスト処理)
│   └── server.ts               # Node.jsサーバーのエントリーポイント・設定
├── react-router.config.ts      # React Routerのコード生成設定
├── schema.prisma               # Prismaスキーマのエントリーポイント (他のスキーマファイルをimport)
├── tsconfig.json               # TypeScriptコンパイラ設定
└── vite.config.ts              # Vite (フロントエンドビルドツール) 設定