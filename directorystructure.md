├── .cursorrules                # Cursorエディタのルール設定
├── .dockerignore               # Dockerビルド時に除外するファイル設定
├── .gitignore                  # Git管理から除外するファイル設定
├── .react-router/              # React Routerの型定義
│   └── types/                  # ルート別の型定義
├── Dockerfile                  # Dockerコンテナ構築設定
├── README.md                   # プロジェクト説明書
├── SPECIFICATION.md            # システム仕様書
├── app/                        # アプリケーションのメインコード
│   ├── components/             # 再利用可能なコンポーネント
│   │   ├── Layout.tsx          # レイアウトコンポーネント
│   │   ├── form.tsx            # フォームコンポーネント
│   │   ├── navigation/         # ナビゲーション関連コンポーネント
│   │   │   ├── Navbar.tsx      # ナビゲーションバー
│   │   │   └── Sidebar.tsx     # サイドバー
│   │   └── ui/                 # 基本的なUI要素
│   │       ├── FormGenerator.tsx # フォーム生成コンポーネント
│   │       ├── button.tsx      # ボタンコンポーネント
│   │       ├── input.tsx       # 入力フィールドコンポーネント
│   │       ├── label.tsx       # ラベルコンポーネント
│   │       ├── select.tsx      # セレクトコンポーネント
│   │       ├── table.tsx       # テーブルコンポーネント
│   │       ├── tabs.tsx        # タブコンポーネント
│   │       └── textarea.tsx    # テキストエリアコンポーネント
│   ├── lib/                    # ユーティリティ関数
│   │   └── utils.ts            # 汎用ユーティリティ
│   ├── routes/                 # ルーティング構造
│   │   ├── dashboard/          # ダッシュボード関連
│   │   │   └── dashboard.tsx   # ダッシュボード画面
│   │   ├── index.tsx           # ルートインデックス
│   │   ├── inventory/          # 在庫管理関連
│   │   │   └── inventory.tsx   # 在庫一覧画面
│   │   ├── master/             # マスタデータ管理
│   │   │   ├── index.tsx       # マスタ画面のメイン
│   │   │   ├── materials.tsx   # 材料マスタ
│   │   │   └── suppliers.tsx   # サプライヤーマスタ
│   │   └── operations/         # 操作関連
│   │       ├── index.tsx       # 操作画面のメイン
│   │       ├── inbound.tsx     # 入庫処理
│   │       └── reservation.tsx # 予約処理
│   ├── stores/                 # 状態管理（Zustand）
│   │   ├── navigationStore.ts  # ナビゲーション状態管理
│   │   ├── stockStore.ts       # 在庫の状態管理
│   │   └── userSessionStore.ts # ユーザーセッション状態管理
│   ├── sharedSchema/           # zod用型定義
│   │   └── materialSchema.ts   # zod用共通型定義
│   ├── types/                  # 型定義. ただし、段階的にこちらの型使用はやめ、sharedSchema内のファイルを使用する
│   │   └── index.ts            # 共通型定義
│   ├── utils/                  # ユーティリティ関数
│   ├── welcome/                # ウェルカムページ関連
│   ├── app.css                 # アプリケーション全体のスタイル
│   ├── root.tsx                # ルートコンポーネント
│   └── routes.ts               # ルート定義
├── directorystructure.md       # ディレクトリ構造説明
├── node_modules/               # 依存パッケージ
├── prisma/                     # prisma関連フォルダ
│   ├── migrations/             # マイグレーションファイル
│   └── schema/                 # DBスキーマ一式
├── package-lock.json           # npm依存関係ロック
├── package.json                # npm設定
├── public/                     # 静的ファイル
│   └── favicon.ico             # ファビコン
├── server/                     # サーバーサイド
│   ├── controllers/             # API関連
│   └── server.ts               # node.jsサーバー
├── react-router.config.ts      # React Router設定
├── schema.prisma               # Prismaデータベーススキーマ
├── tsconfig.json               # TypeScript設定
└── vite.config.ts              # Vite設定