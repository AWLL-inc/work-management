# ADR-002: Server-side Implementation Architecture

## Status
Accepted

## Context
work-managementプロジェクトにおいて、サーバーサイドの実装方針を決定する必要がある。API設計、認証・認可、ミドルウェア、エラーハンドリング、セキュリティ対策を包括的に考慮した技術選択が求められる。

## Decision

### API Architecture
- **Next.js App Router API Routes** (`app/api/`)
- **RESTful API Design** with resource-based endpoints
- **TypeScript-first API Development**
- **Edge Runtime** for optimal performance

### Authentication & Authorization
- **NextAuth.js v5** (Auth.js)
- **JWT Strategy** with secure token management
- **Role-based Access Control (RBAC)**
- **Session Management** with database persistence

### Middleware & Security
- **Next.js Middleware** (`middleware.ts`)
- **CORS Configuration**
- **Rate Limiting** 
- **Input Validation** with Zod
- **CSRF Protection**
- **Security Headers**

### Error Handling & Monitoring
- **Structured Error Responses**
- **Request/Response Logging**
- **Vercel Analytics** integration
- **Health Check Endpoints**

## Directory Structure
```
work-management/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── [...nextauth]/
│   │   │   └── route.ts
│   │   ├── users/             # User management
│   │   │   ├── route.ts       # GET /api/users, POST /api/users
│   │   │   └── [id]/
│   │   │       └── route.ts   # GET /api/users/:id
│   │   ├── tasks/             # Task management
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── health/
│   │       └── route.ts       # Health check endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/                       # Shared utilities
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Database connection
│   ├── validations.ts        # Zod schemas
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   └── utils.ts              # Utility functions
├── types/                    # TypeScript type definitions
│   ├── api.ts
│   ├── auth.ts
│   └── database.ts
├── middleware.ts             # Next.js middleware
└── auth.config.ts           # Auth configuration
```

## API Design Principles

### RESTful Endpoints
```typescript
// Resource-based routing
GET    /api/users              # List users
POST   /api/users              # Create user
GET    /api/users/[id]         # Get user by ID
PUT    /api/users/[id]         # Update user
DELETE /api/users/[id]         # Delete user

GET    /api/tasks              # List tasks
POST   /api/tasks              # Create task
GET    /api/tasks/[id]         # Get task by ID
PUT    /api/tasks/[id]         # Update task
DELETE /api/tasks/[id]         # Delete task
```

### Request/Response Format
```typescript
// Standard API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Authentication Flow
```typescript
// NextAuth.js Configuration
export const authConfig = {
  providers: [
    // Email/Password provider
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      authorize: async (credentials) => {
        // Validate credentials against database
        const user = await validateUser(credentials);
        return user ? { id: user.id, email: user.email, role: user.role } : null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.role = token.role;
      return session;
    }
  }
};
```

### Middleware Implementation
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Rate limiting
    if (isRateLimited(req)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // CORS headers
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes
        if (req.nextUrl.pathname.startsWith('/api/health')) {
          return true;
        }
        
        // Protected routes require authentication
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return !!token;
        }
        
        return true;
      }
    }
  }
);

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
};
```

### Input Validation
```typescript
// lib/validations.ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user')
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional()
});
```

## Rationale

### Next.js App Router API Routes
- **Edge Runtime**: Vercelエッジでの高速実行
- **TypeScript Native**: 型安全なAPI開発
- **Zero Configuration**: 追加設定不要の自動デプロイ
- **File-based Routing**: 直感的なAPI構造

### NextAuth.js v5
- **Production Ready**: 企業レベルの認証ライブラリ
- **Security Best Practices**: CSRF、セッション管理の自動処理
- **Provider Flexibility**: 将来的なOAuth連携対応
- **Database Integration**: セッション永続化サポート

### Zod Validation
- **TypeScript Integration**: スキーマからの型自動生成
- **Runtime Safety**: 実行時の型検証
- **Developer Experience**: 明確なバリデーションエラー

### Edge Runtime
- **Global Performance**: 世界中での低レイテンシ
- **Auto Scaling**: リクエスト量に応じた自動スケーリング
- **Cost Efficiency**: 実行時間課金による最適化

## Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with appropriate salt rounds
- **JWT Security**: Short-lived tokens with refresh rotation
- **Session Management**: Secure session storage and invalidation

### API Security
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Per-endpoint and per-user rate limits
- **CORS Configuration**: Strict origin and method controls
- **Security Headers**: HSTS, CSP, X-Frame-Options

### Data Protection
- **Sanitization**: Input sanitization for XSS prevention
- **SQL Injection**: Parameterized queries only
- **Sensitive Data**: No sensitive data in logs or client-side

## Performance Optimizations

### API Performance
- **Edge Runtime**: Sub-100ms response times globally
- **Connection Pooling**: Efficient database connections
- **Response Caching**: Appropriate cache headers
- **Compression**: Automatic response compression

### Monitoring & Observability
- **Request Tracing**: Comprehensive request logging
- **Error Tracking**: Structured error reporting
- **Performance Metrics**: API response time monitoring
- **Health Checks**: Service availability monitoring

## Consequences

### Positive
- **Type Safety**: End-to-end TypeScript safety
- **Security**: Industry-standard security practices
- **Performance**: Edge-optimized global performance
- **Maintainability**: Clear structure and patterns
- **Scalability**: Auto-scaling with demand

### Negative
- **Complexity**: Additional abstraction layers
- **Learning Curve**: NextAuth.js and Edge Runtime specifics
- **Vendor Lock-in**: Vercel-specific optimizations

### Mitigation
- **Documentation**: Comprehensive API documentation
- **Testing**: Unit and integration test coverage
- **Monitoring**: Proactive performance monitoring
- **Fallback**: Graceful degradation for edge failures

## References
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Documentation](https://authjs.dev/)
- [Zod Documentation](https://zod.dev/)
- [Vercel Edge Runtime](https://vercel.com/docs/edge-functions)