# OpenAPI/Redoc自動生成機能 設計書

## 概要

Next.js App RouterベースのAPIエンドポイントから、OpenAPI 3.0仕様のドキュメントを自動生成し、Swagger UI / Redoc / Scalarなどの対話的なAPIドキュメントUIを提供する機能を実装する。

## 目的

### ユーザーのニーズ
1. **APIドキュメントの自動生成**
   - 手動でのドキュメント作成・メンテナンスの負担削減
   - コードとドキュメントの同期を保証
   - OpenAPI標準に準拠したAPI仕様

2. **コマンド一つで生成可能**
   - `npm run openapi:generate` で即座に生成
   - CI/CDパイプラインへの統合
   - 開発環境での自動更新

3. **複数のUI形式をサポート**
   - Swagger UI（インタラクティブなAPI試行）
   - Redoc（読みやすいドキュメント）
   - Scalar（モダンなデザイン）

## 技術選定

### 採用ライブラリ: next-openapi-gen

#### 選定理由
1. **Next.js App Router専用**
   - Next.js 15のApp Routerに完全対応
   - ファイルシステムベースのルーティングを自動認識

2. **Zodスキーマ統合**
   - 既存の `lib/validations.ts` のZodスキーマをそのまま活用
   - 追加のスキーマ定義が不要

3. **JSDocアノテーション**
   - コード内にJSDocコメントを追加するだけで生成可能
   - TypeScriptの型情報も活用

4. **複数UI対応**
   - Swagger UI
   - Redoc
   - Scalar
   - カスタムUI

5. **コマンド一発で生成**
   - `npx next-openapi-gen generate` で即座に生成
   - 開発サーバー起動時に自動生成も可能

### 代替案との比較

#### zod-to-openapi
- **メリット**: より細かい制御が可能
- **デメリット**:
  - 手動でのレジストリ登録が必要
  - Next.js App Routerとの統合が複雑
  - コード量が多い

#### swagger-jsdoc
- **メリット**: 広く使われている
- **デメリット**:
  - Zodスキーマとの統合が弱い
  - Next.js App Routerの自動認識がない
  - 手動でのルート登録が必要

## アーキテクチャ設計

### ディレクトリ構造

```
work-management/
├── app/
│   └── api/
│       ├── projects/
│       │   ├── route.ts          # JSDoc アノテーション追加
│       │   └── [id]/route.ts     # JSDoc アノテーション追加
│       ├── work-categories/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── work-logs/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── batch/route.ts
│       ├── teams/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/members/
│       │       ├── route.ts
│       │       └── [userId]/route.ts
│       └── api-docs/
│           └── page.tsx          # API ドキュメントUIページ
├── lib/
│   └── validations.ts            # 既存Zodスキーマ（そのまま活用）
├── openapi/
│   ├── openapi.json              # 生成されたOpenAPI仕様
│   ├── openapi.yaml              # YAML版（オプション）
│   └── schemas/                  # カスタムスキーマ（必要に応じて）
│       ├── responses.ts          # 共通レスポンススキーマ
│       └── errors.ts             # エラーレスポンススキーマ
├── next.openapi.json             # next-openapi-gen設定ファイル
└── package.json                  # npm scripts追加
```

### 設定ファイル

#### next.openapi.json

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Work Management API",
    "version": "1.0.0",
    "description": "Work management system API for tracking work hours, projects, and team collaboration",
    "contact": {
      "name": "API Support",
      "email": "support@example.com"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Local development server"
    },
    {
      "url": "https://work-management.vercel.app",
      "description": "Production server"
    }
  ],
  "apiDir": "app/api",
  "schemaDir": "lib",
  "schemaType": "zod",
  "outputFile": "openapi/openapi.json",
  "docsUrl": "/api-docs",
  "includeOpenApiRoutes": false,
  "defaultResponseSet": "common",
  "responseSets": {
    "common": ["400", "401", "500"],
    "auth": ["400", "401", "403", "500"],
    "public": ["400", "500"]
  },
  "errorConfig": {
    "template": {
      "type": "object",
      "properties": {
        "success": {
          "type": "boolean",
          "example": false
        },
        "error": {
          "type": "object",
          "properties": {
            "code": {
              "type": "string",
              "example": "{{ERROR_CODE}}"
            },
            "message": {
              "type": "string",
              "example": "{{ERROR_MESSAGE}}"
            },
            "details": {
              "type": "object",
              "nullable": true
            }
          }
        }
      },
      "required": ["success", "error"]
    },
    "codes": {
      "400": {
        "description": "Bad Request - Invalid input parameters",
        "variables": {
          "ERROR_MESSAGE": "Invalid request parameters",
          "ERROR_CODE": "BAD_REQUEST"
        }
      },
      "401": {
        "description": "Unauthorized - Authentication required",
        "variables": {
          "ERROR_MESSAGE": "Authentication required",
          "ERROR_CODE": "UNAUTHORIZED"
        }
      },
      "403": {
        "description": "Forbidden - Insufficient permissions",
        "variables": {
          "ERROR_MESSAGE": "Insufficient permissions",
          "ERROR_CODE": "FORBIDDEN"
        }
      },
      "404": {
        "description": "Not Found - Resource does not exist",
        "variables": {
          "ERROR_MESSAGE": "Resource not found",
          "ERROR_CODE": "NOT_FOUND"
        }
      },
      "500": {
        "description": "Internal Server Error",
        "variables": {
          "ERROR_MESSAGE": "An unexpected error occurred",
          "ERROR_CODE": "INTERNAL_ERROR"
        }
      }
    }
  },
  "securitySchemes": {
    "bearer": {
      "type": "http",
      "scheme": "bearer",
      "bearerFormat": "JWT",
      "description": "JWT authentication via NextAuth.js"
    }
  },
  "debug": false
}
```

## JSDocアノテーション例

### 基本的なGETエンドポイント

```typescript
// app/api/projects/route.ts

import { NextRequest, NextResponse } from "next/server";
import { listProjectsQuerySchema } from "@/lib/validations";
import type { Project } from "@/drizzle/schema";

/**
 * List all projects
 * @description Retrieve a list of all projects, optionally filtered by active status
 * @params listProjectsQuerySchema
 * @response Project[]
 * @responseDescription Array of project objects
 * @auth bearer
 * @openapi
 */
export async function GET(request: NextRequest) {
  // 実装...
}
```

### POSTエンドポイント

```typescript
// app/api/projects/route.ts

/**
 * Create a new project
 * @description Create a new project with the provided details
 * @body createProjectSchema
 * @bodyDescription Project information including name and description
 * @response 201:Project:Successfully created project
 * @add 409:ConflictError:Project with this name already exists
 * @auth bearer
 * @openapi
 */
export async function POST(request: NextRequest) {
  // 実装...
}
```

### パスパラメータを持つエンドポイント

```typescript
// app/api/projects/[id]/route.ts

import { z } from "zod";

const ProjectParams = z.object({
  id: z.string().uuid().describe("Project UUID"),
});

/**
 * Get project by ID
 * @description Fetch detailed information for a specific project
 * @pathParams ProjectParams
 * @response Project
 * @responseDescription Detailed project information
 * @add 404:NotFoundError:Project not found
 * @auth bearer
 * @openapi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 実装...
}

/**
 * Update project
 * @description Update an existing project's information
 * @pathParams ProjectParams
 * @body updateProjectSchema
 * @response Project:Updated project information
 * @add 404:NotFoundError:Project not found
 * @auth bearer
 * @openapi
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 実装...
}

/**
 * Delete project
 * @description Soft delete a project (mark as inactive)
 * @pathParams ProjectParams
 * @response 200:EmptyResponse:Project successfully deleted
 * @add 404:NotFoundError:Project not found
 * @auth bearer
 * @openapi
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 実装...
}
```

### 複雑なクエリパラメータ

```typescript
// app/api/work-logs/route.ts

/**
 * List work logs
 * @description Retrieve work logs with advanced filtering and pagination
 * @params workLogSearchSchema
 * @response WorkLog[]
 * @responseDescription Paginated list of work logs with user and project details
 * @auth bearer
 * @openapi
 */
export async function GET(request: NextRequest) {
  // 実装...
}
```

## 共通レスポンススキーマ

### openapi/schemas/responses.ts

```typescript
import { z } from "zod";

/**
 * Standard API response wrapper
 */
export const ApiSuccessResponse = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiErrorResponse = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

/**
 * Pagination metadata
 */
export const PaginationMetadata = z.object({
  page: z.number().int().positive().describe("Current page number"),
  limit: z.number().int().positive().describe("Results per page"),
  total: z.number().int().nonnegative().describe("Total number of results"),
  totalPages: z.number().int().nonnegative().describe("Total number of pages"),
});

export const PaginatedResponse = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    pagination: PaginationMetadata,
  });

/**
 * Empty response for DELETE operations
 */
export const EmptyResponse = z.object({
  success: z.literal(true),
});

/**
 * Common error responses
 */
export const NotFoundError = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal("NOT_FOUND"),
    message: z.string(),
  }),
});

export const ConflictError = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal("CONFLICT"),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const ValidationError = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal("VALIDATION_ERROR"),
    message: z.string(),
    details: z.record(z.array(z.string())).optional(),
  }),
});
```

## npm Scripts

### package.json

```json
{
  "scripts": {
    "openapi:init": "next-openapi-gen init --ui scalar --docs-url api-docs --schema zod",
    "openapi:generate": "next-openapi-gen generate",
    "openapi:generate:yaml": "next-openapi-gen generate --format yaml",
    "openapi:watch": "next-openapi-gen generate --watch",
    "dev": "next dev",
    "dev:openapi": "concurrently \"npm run dev\" \"npm run openapi:watch\"",
    "build": "npm run openapi:generate && next build",
    "lint": "biome check .",
    "format": "biome format --write .",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "next-openapi-gen": "^latest",
    "concurrently": "^latest"
  }
}
```

## API ドキュメントUIページ

### app/api-docs/page.tsx

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation - Work Management",
  description: "Interactive API documentation for Work Management system",
};

export default function ApiDocsPage() {
  return (
    <div className="h-screen w-full">
      <iframe
        src="/api-docs-ui"
        className="h-full w-full border-0"
        title="API Documentation"
      />
    </div>
  );
}
```

### app/api-docs-ui/route.ts (自動生成)

このファイルは `next-openapi-gen` が自動生成します。

## 実装手順

### Phase 1: セットアップ

1. **パッケージインストール**
   ```bash
   npm install --save-dev next-openapi-gen concurrently
   ```

2. **初期化**
   ```bash
   npm run openapi:init
   ```
   - `next.openapi.json` が生成される
   - `/api-docs` ページが作成される

3. **設定ファイルのカスタマイズ**
   - サーバーURLの設定
   - エラーレスポンスの定義
   - セキュリティスキームの追加

### Phase 2: 共通スキーマの作成

1. **レスポンススキーマの定義**
   - `openapi/schemas/responses.ts` の作成
   - 成功レスポンス・エラーレスポンスの標準化

2. **既存スキーマの拡張**
   - `lib/validations.ts` のスキーマにdescriptionを追加
   - OpenAPI用のexampleを追加（オプション）

### Phase 3: APIルートへのアノテーション追加

優先順位に従って順次追加：

#### 高優先度
1. **Projects API** (`app/api/projects/*`)
   - GET /api/projects
   - POST /api/projects
   - GET /api/projects/[id]
   - PUT /api/projects/[id]
   - DELETE /api/projects/[id]

2. **Work Categories API** (`app/api/work-categories/*`)
   - 同様のエンドポイント

3. **Work Logs API** (`app/api/work-logs/*`)
   - GET /api/work-logs
   - POST /api/work-logs
   - GET /api/work-logs/[id]
   - PUT /api/work-logs/[id]
   - DELETE /api/work-logs/[id]
   - POST /api/work-logs/batch

#### 中優先度
4. **Teams API** (`app/api/teams/*`)
   - 全エンドポイント

5. **Dashboard API** (`app/api/dashboard/*`)
   - 統計エンドポイント

### Phase 4: 生成とテスト

1. **ドキュメント生成**
   ```bash
   npm run openapi:generate
   ```

2. **ローカルでの確認**
   ```bash
   npm run dev
   # http://localhost:3000/api-docs にアクセス
   ```

3. **生成されたJSONの検証**
   - OpenAPI仕様に準拠しているか確認
   - [Swagger Editor](https://editor.swagger.io/) で検証

### Phase 5: CI/CD統合

1. **GitHub Actionsへの組み込み**
   ```yaml
   # .github/workflows/ci.yml

   - name: Generate OpenAPI Documentation
     run: npm run openapi:generate

   - name: Validate OpenAPI Specification
     run: |
       npm install -g @apidevtools/swagger-cli
       swagger-cli validate openapi/openapi.json

   - name: Upload OpenAPI Artifact
     uses: actions/upload-artifact@v3
     with:
       name: openapi-spec
       path: openapi/openapi.json
   ```

2. **プルリクエストでの自動生成チェック**
   - OpenAPIドキュメントが最新か確認
   - 変更があればコミット要求

## UIオプション

### Scalar (推奨・デフォルト)

```bash
npx next-openapi-gen init --ui scalar
```

**特徴:**
- モダンで美しいデザイン
- 高速なレンダリング
- インタラクティブなAPI試行
- ダークモード対応

### Swagger UI

```bash
npx next-openapi-gen init --ui swagger
```

**特徴:**
- 業界標準のUI
- 豊富な機能
- 広く認知されている

### Redoc

```bash
npx next-openapi-gen init --ui redoc
```

**特徴:**
- ドキュメント重視
- 読みやすいレイアウト
- 印刷に適している

### 複数UI同時提供

```typescript
// app/api-docs/swagger/page.tsx - Swagger UI
// app/api-docs/redoc/page.tsx - Redoc
// app/api-docs/scalar/page.tsx - Scalar
```

## ベストプラクティス

### 1. JSDocコメントの一貫性

```typescript
/**
 * [動詞] [リソース] - 簡潔な1行説明
 * @description 詳細な説明（複数行可）
 * @params [クエリパラメータスキーマ]
 * @pathParams [パスパラメータスキーマ]
 * @body [リクエストボディスキーマ]
 * @response [レスポンススキーマ]:[説明]
 * @add [ステータスコード]:[エラースキーマ]:[説明]
 * @auth [認証方式]
 * @openapi
 */
```

### 2. スキーマの再利用

```typescript
// 良い例
export const UserSchema = z.object({...});
export type User = z.infer<typeof UserSchema>;

/**
 * @response UserSchema
 */
export async function GET() {}

// 悪い例 - インラインスキーマ
/**
 * @response { id: string, name: string } // 推奨されない
 */
```

### 3. Descriptionの充実

```typescript
const ProjectSchema = z.object({
  id: z.string().uuid().describe("Unique project identifier (UUID v4)"),
  name: z.string().min(1).max(255).describe("Project name (1-255 characters)"),
  description: z.string().optional().describe("Optional project description"),
  isActive: z.boolean().describe("Whether the project is active"),
  createdAt: z.date().describe("Project creation timestamp (ISO 8601)"),
});
```

### 4. エラーレスポンスの明示

```typescript
/**
 * @response 200:Project
 * @add 400:ValidationError:Invalid input parameters
 * @add 401:UnauthorizedError:Authentication required
 * @add 404:NotFoundError:Project not found
 * @add 500:InternalError:Server error occurred
 */
```

## セキュリティ考慮事項

### 1. 本番環境での公開範囲

```typescript
// middleware.ts で API ドキュメントへのアクセス制限

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 本番環境ではAPI ドキュメントを非公開または認証を要求
  if (
    process.env.NODE_ENV === "production" &&
    pathname.startsWith("/api-docs")
  ) {
    // 管理者のみアクセス可能にする
    const session = await getAuthenticatedSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}
```

### 2. 機密情報の除外

- パスワードハッシュ
- API キー
- 内部IDやシークレット
- 個人情報（必要最小限のみ）

```typescript
// レスポンスから機密情報を除外
export const PublicUserSchema = UserSchema.omit({
  passwordHash: true,
  emailVerified: true,
});
```

## メンテナンス

### 定期的な更新

1. **新しいエンドポイント追加時**
   - JSDocアノテーションを必ず追加
   - `npm run openapi:generate` を実行

2. **スキーマ変更時**
   - Zodスキーマを更新
   - ドキュメントを再生成
   - 破壊的変更の場合はバージョン番号を更新

3. **レビュープロセス**
   - プルリクエストでOpenAPI仕様の差分を確認
   - APIの後方互換性をチェック

### バージョニング

```json
// next.openapi.json
{
  "info": {
    "version": "1.0.0"
  }
}
```

セマンティックバージョニングを採用：
- **Major (1.0.0)**: 破壊的変更
- **Minor (0.1.0)**: 新機能追加（後方互換）
- **Patch (0.0.1)**: バグフィックス

## テスト

### OpenAPI仕様の検証

```bash
# Swagger CLI でバリデーション
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi/openapi.json
```

### 生成されたスキーマのテスト

```typescript
// __tests__/openapi.test.ts

import { describe, it, expect } from "vitest";
import openapiSpec from "@/openapi/openapi.json";

describe("OpenAPI Specification", () => {
  it("should have valid OpenAPI version", () => {
    expect(openapiSpec.openapi).toBe("3.0.0");
  });

  it("should have info section", () => {
    expect(openapiSpec.info).toBeDefined();
    expect(openapiSpec.info.title).toBe("Work Management API");
  });

  it("should have paths defined", () => {
    expect(openapiSpec.paths).toBeDefined();
    expect(Object.keys(openapiSpec.paths).length).toBeGreaterThan(0);
  });

  it("should have security schemes", () => {
    expect(openapiSpec.components.securitySchemes).toBeDefined();
    expect(openapiSpec.components.securitySchemes.bearer).toBeDefined();
  });
});
```

## パフォーマンス最適化

### 1. 生成の高速化

```json
// next.openapi.json
{
  "cache": true,
  "cacheDir": ".next/openapi-cache",
  "parallelProcessing": true
}
```

### 2. ドキュメントUIの遅延ロード

```typescript
// app/api-docs/page.tsx
import dynamic from "next/dynamic";

const ApiDocs = dynamic(() => import("@/components/ApiDocs"), {
  ssr: false,
  loading: () => <div>Loading API Documentation...</div>,
});
```

## トラブルシューティング

### よくある問題

#### 1. Zodスキーマが認識されない

**原因:** スキーマがexportされていない

**解決策:**
```typescript
// 悪い例
const UserSchema = z.object({...});

// 良い例
export const UserSchema = z.object({...});
```

#### 2. パスパラメータが自動認識されない

**原因:** `@pathParams` アノテーションがない

**解決策:**
```typescript
/**
 * @pathParams ProjectParams
 */
```

#### 3. 生成されたJSONが空

**原因:** `@openapi` タグがない

**解決策:**
```typescript
/**
 * @openapi  // このタグが必須
 */
```

## まとめ

このOpenAPI自動生成機能により、以下が実現されます:

✅ コマンド一つでOpenAPIドキュメント生成
✅ 既存のZodスキーマを活用
✅ JSDocコメントによる簡単なアノテーション
✅ Swagger UI / Redoc / Scalar の複数UI対応
✅ CI/CDパイプラインへの統合
✅ APIドキュメントとコードの同期を保証
✅ 型安全なAPI開発

---

**作成日:** 2024-10-26
**バージョン:** 1.0
