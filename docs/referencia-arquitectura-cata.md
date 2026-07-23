# Cata — Referencia de Arquitectura para Reconstrucción

> Documento de referencia basado en el código existente.
> Úsalo para entender decisiones técnicas y replicarlas (o mejorarlas) en tu nuevo proyecto.

---

## 1. Stack Tecnológico Actual

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | NestJS | ^10.4 |
| Frontend | Next.js (App Router) | ^15.1 |
| ORM | Prisma | ^5.22 |
| DB | PostgreSQL | - |
| Colas | BullMQ + Redis | ^5.34 |
| Auth | BetterAuth | ^1.1 |
| CSS | Tailwind CSS + shadcn/ui | ^3.4 |
| IA | DeepSeek / Gemini | OpenAI SDK / @google/generative-ai |
| Pagos | Binance Pay | API REST |
| Monorepo | pnpm + Turborepo | ^9.15 / ^2.3 |

---

## 2. Estructura del Monorepo

```
/
├── apps/
│   ├── api/          ← NestJS (puerto 3001)
│   └── web/          ← Next.js (puerto 3000)
├── packages/
│   └── shared/       ← Tipos + Zod schemas
├── prisma/
│   └── schema.prisma ← DB schema
├── turbo.json        ← Pipeline
└── pnpm-workspace.yaml
```

### Scripts principales
```bash
pnpm dev          # Turbo: corre api + web en paralelo
pnpm build        # Construye todo
pnpm db:generate  # Prisma generate
pnpm db:push      # Prisma db push
pnpm db:migrate   # Prisma migrate dev
pnpm db:studio    # Prisma Studio
```

---

## 3. Base de Datos — Modelos

### BetterAuth (4 tablas — no modificar estructura)
- **User**: id, name, email, emailVerified, image, (+ plan, aiProvider, aiModel)
- **Session**: id, expiresAt, token, userId
- **Account**: id, accountId, providerId, userId, password, etc.
- **Verification**: id, identifier, value, expiresAt

### Dominio (5 tablas)
- **Product**: id, userId, name, description, type, category, price, sku, keywords[]
- **Article**: id, productId, userId, title, content, metaTitle, metaDescription, slug, status, wordCount
- **BlogConnection**: id, userId, platform, apiUrl, encryptedApiKey, status
- **Subscription**: id, userId, plan, tier, status, binancePaymentId, startDate, endDate
- **GenerationJob**: id, productId, articleId, status, attempts, error

### Patrón importante
Todas las queries de negocio verifican ownership con `findFirst({ where: { id, userId } })`.
Esto asegura que un usuario jamás vea datos de otro.

---

## 4. Backend — Patrón de Módulos NestJS

Cada módulo sigue esta estructura:

```
modulo/
├── modulo.module.ts        ← @Module({ controllers, providers, imports })
├── modulo.controller.ts    ← @Controller('ruta') + @Get, @Post, etc.
├── modulo.service.ts       ← @Injectable() — lógica de negocio
└── dto/                    ← Schemas Zod (CreateXDto, UpdateXDto)
```

### Pipeline de validación (global en main.ts)
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Elimina campos no declarados
  forbidNonWhitelisted: true,   // Rechaza campos extra
  transform: true,              // string → number automático
}));
```

### Formato de respuesta consistente
```typescript
{ success: true, data: { ... } }
{ success: false, error: "mensaje" }
```

---

## 5. Las 3 Interfaces Abstractas (clave arquitectónica)

### IAiProvider — Inteligencia Artificial
```typescript
abstract class IAiProvider {
  abstract generateArticle(context: ArticleGenerationContext): Promise<GeneratedArticle>;
}
```
- **Implementaciones**: DeepSeekProvider, GeminiProvider
- **Selección**: Factory pattern vía `AI_PROVIDER` env var
- **Inyección**: `@Inject(AI_PROVIDER)`

### IBlogConnector — Conexión a Blogs
```typescript
abstract class IBlogConnector {
  abstract publish(context: PublishContext, config: BlogConnectionConfig): Promise<PublishResult>;
  abstract testConnection(config: BlogConnectionConfig): Promise<TestResult>;
}
```
- **Implementaciones**: WordPressConnector, GhostConnector

### IPaymentProvider — Pagos
```typescript
abstract class IPaymentProvider {
  abstract createCheckout(plan: string, userId: string): Promise<CheckoutResult>;
  abstract handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookResult>;
  abstract cancelSubscription(subscriptionId: string): Promise<boolean>;
}
```
- **Implementación**: BinancePayProvider
- **PLAN_CONFIG**: Define precios y límites de cada plan

---

## 6. Flujo Crítico: Generación de Artículo

```
Usuario → Frontend → POST /api/articles/generate/:productId
  │
  ├─ 1. AuthGuard verifica token
  ├─ 2. ArticlesService.verifyProduct() — ownership check
  ├─ 3. Encola en BullMQ: articleQueue.add('generate-article', { productId, userId, keywords })
  ├─ 4. Responde INMEDIATAMENTE: { jobId, status: 'pending' }
  │
  └─ [Background — ArticleGenerationProcessor]
     ├─ 5. Crea GenerationJob { status: 'processing' }
     ├─ 6. Busca producto en DB
     ├─ 7. Fusiona keywords (producto + request)
     ├─ 8. IAiProvider.generateArticle() → llamado API DeepSeek/Gemini
     ├─ 9. buildArticleContent() → HTML estructurado
     ├─ 10. SeoValidator.validate() → score 0-100
     ├─ 11. ensureUniqueSlug() → slug único (evita colisiones)
     ├─ 12. Article.create({ status: 'draft' })
     ├─ 13. GenerationJob.update({ status: 'completed' })
     └─ 14. Si falla → GenerationJob.update({ status: 'failed', error })
```

---

## 7. SEO Validator — Reglas

| Regla | Implementación |
|-------|---------------|
| Meta title length | 50-60 caracteres |
| Meta description length | 150-160 caracteres |
| Heading hierarchy | Exactamente 1 H1, al menos 1 H2, sin saltos de nivel |
| Keyword in title | La keyword principal debe estar en el título |
| Keyword in first 300 chars | Keyword debe aparecer pronto |
| Keyword in meta description | Debe estar en la meta description |
| Keyword in at least one H2 | Debe aparecer en al menos un heading |
| Min word count | Al menos 300 palabras |
| Slug generation | Remove diacríticos, filtra stop words, max 80 chars, hyphens |

---

## 8. Frontend — Clientes HTTP

Cada dominio tiene su propio cliente en `lib/`:

```typescript
class ProductClient {
  private baseUrl: string;
  private sessionToken: string | null;

  private async request<T>(path, options) {
    // Añade Authorization: Bearer <token>
    // Añade Content-Type: application/json
    return fetch(`${this.baseUrl}${path}`, options).json();
  }

  async list(params?) { /* GET /products?page=&search=&category= */ }
  async create(data) { /* POST /products */ }
  async update(id, data) { /* PUT /products/:id */ }
  async delete(id) { /* DELETE /products/:id */ }
  async importCsv(file) { /* POST /products/import/csv (FormData) */ }
}
```

### Manejo de sesión
```typescript
// AuthClient
login() → guarda sessionToken en localStorage
register() → guarda sessionToken en localStorage
logout() → elimina sessionToken de localStorage
getMe() → GET /auth/me con token actual
```

---

## 9. Temas (Claro / Oscuro)

```css
:root {
  --color-primary: #EC4899;        /* Rosa */
  --color-accent: #0891B2;         /* Cyan */
  --color-background: #FDF2F8;     /* Rosa claro */
  --color-foreground: #831843;
}

.dark {
  --color-primary: #0F172A;        /* Azul oscuro */
  --color-accent: #22C55E;         /* Verde */
  --color-background: #020617;     /* Negro azulado */
  --color-foreground: #F8FAFC;
}
```

Estrategia: `class` (next-themes añade clase `.dark` al `<html>`)

---

## 10. Lo que NO está implementado (para que lo hagas mejor ⚠️)

| Funcionalidad | Dónde va | Prioridad |
|--------------|----------|-----------|
| Password reset flow | Auth | 🔴 Alta |
| Business $79 tier | Subscription | 🔴 Alta |
| Monthly auto-charge (cron) | Subscription | 🔴 Alta |
| Abandoned checkout timeout | Subscription | 🟡 Media |
| Tests (unit + integration + e2e) | Global | 🟡 Media |
| Rate limiting | API | 🟡 Media |
| Logging estructurado | API | 🟢 Baja |
| Error handling consistente | API | 🟢 Baja |

---

## 11. Planes de Suscripción

```typescript
PLAN_CONFIG = {
  free:    { label: 'Gratuito',  price: 0,   articlesPerMonth: 0,   features: [...] },
  starter: { label: 'Starter',   price: 19,  articlesPerMonth: 10,  features: [...] },
  pro:     { label: 'Pro',       price: 39,  articlesPerMonth: 50,  features: [...] },
  agency:  { label: 'Agencia',   price: 199, articlesPerMonth: 200, features: [...] },
  // ⚠️ Falta: business: { label: 'Business', price: 79, articlesPerMonth: 100, features: [...] }
};
```

---

## 12. Comandos de Desarrollo

```bash
# Iniciar todo en desarrollo
pnpm dev

# Solo API
pnpm --filter @cata/api dev

# Solo Web
pnpm --filter @cata/web dev

# Prisma
pnpm db:generate    # Generar cliente Prisma
pnpm db:push        # Push schema a DB
pnpm db:studio      # UI de base de datos
pnpm db:migrate     # Crear migración
```

---

## 13. Variables de Entorno Necesarias

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cata"

# Auth
BETTER_AUTH_SECRET="<generar random>"
BETTER_AUTH_URL="http://localhost:3001"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Frontend
FRONTEND_URL="http://localhost:3000"

# API Key (para sync externo)
CATA_API_KEY="<random>"

# AI Provider: deepseek | gemini
AI_PROVIDER="deepseek"

# DeepSeek
DEEPSEEK_API_KEY=""
DEEPSEEK_MODEL="deepseek-chat"

# Gemini (free tier)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.0-flash"

# Binance Pay
BINANCE_API_KEY=""
BINANCE_SECRET_KEY=""
```

---

> Este documento es una referencia. Cuando inicies tu nuevo proyecto,
> puedes consultarlo para recordar cómo estaba estructura cada cosa,
> qué decisiones se tomaron, y qué puedes hacer mejor.
