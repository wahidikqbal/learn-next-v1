# Data Model Target (Phase 1-2)

## Goals
- Mendukung tenant multi-page.
- Mendukung draft/published versioning.
- Tetap kompatibel sementara dengan model lama `Page`.

## Prisma Target Draft
Catatan: ini draft desain. Implementasi final bisa di Laravel migration.

```prisma
enum TenantStatus {
  DRAFT
  PUBLISHED
  SUSPENDED
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PageType {
  HOME
  CONTACT
  ABOUT
  ARTICLE_INDEX
  PRODUCT_INDEX
  CUSTOM
}

model Tenant {
  id          String        @id @default(cuid())
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name        String
  subdomain   String        @unique
  status      TenantStatus  @default(DRAFT)
  publishedAt DateTime?
  pages       SitePage[]
  navbars     NavbarConfig[]
  articles    Article[]
  products    Product[]
  orders      Order[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model SitePage {
  id             String         @id @default(cuid())
  tenantId       String
  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title          String
  slug           String
  pageType       PageType
  layoutTemplate String?
  isSystem       Boolean        @default(false)
  isDeleted      Boolean        @default(false)
  versions       PageVersion[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, pageType])
}

model PageVersion {
  id          String        @id @default(cuid())
  pageId      String
  page        SitePage      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  versionNo   Int
  status      ContentStatus @default(DRAFT)
  schemaVer   Int           @default(1)
  // Envelope wajib untuk future schema migration
  // { schemaVersion: number, blocks: [...] }
  blocksJson  Json
  seoJson     Json?
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([pageId, versionNo])
  @@index([pageId, status])
}

model Template {
  id         String   @id @default(cuid())
  key        String   @unique
  name       String
  version    Int
  configJson Json
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([key, version])
}

model TenantTemplateInstall {
  id                  String   @id @default(cuid())
  tenantId            String
  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  templateId          String
  template            Template @relation(fields: [templateId], references: [id], onDelete: Restrict)
  templateVersion     Int
  installedConfigJson Json
  createdAt           DateTime @default(now())

  @@index([tenantId, createdAt])
}

model NavbarConfig {
  id          String        @id @default(cuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  versionNo   Int
  status      ContentStatus @default(DRAFT)
  itemsJson   Json
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([tenantId, versionNo])
  @@index([tenantId, status])
}

model Article {
  id          String        @id @default(cuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  slug        String
  excerpt     String?
  contentJson Json
  coverImage  String?
  seoJson     Json?
  status      ContentStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, status])
}

model Product {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String
  slug            String
  descriptionJson Json
  price           Decimal       @db.Decimal(18, 2)
  currency        String        @default("IDR")
  imagesJson      Json?
  seoJson         Json?
  status          ContentStatus @default(DRAFT)
  publishedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, status])
}

model Order {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  buyerJson   Json
  amount      Decimal  @db.Decimal(18, 2)
  currency    String   @default("IDR")
  status      String
  provider    String?
  providerRef String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, createdAt])
}
```

## Legacy Compatibility Mapping
Sumber lama:
- `Page.id`
- `Page.ownerId`
- `Page.subdomain`
- `Page.name`
- `Page.blocks`
- `Page.isPublished`

Target mapping:
1. `Tenant`
- `ownerId = Page.ownerId`
- `subdomain = Page.subdomain`
- `name = Page.name`
- `status = Page.isPublished ? PUBLISHED : DRAFT`

2. `SitePage`
- `title = Page.name`
- `slug = "/"` (sementara untuk data lama)
- `pageType = HOME`
- `isSystem = true`

3. `PageVersion`
- `versionNo = 1`
- `status = Page.isPublished ? PUBLISHED : DRAFT`
- `blocksJson = { schemaVersion: 1, blocks: Page.blocks }`

## Migration Strategy
1. Create new tables in parallel, jangan drop `Page`.
2. Backfill data lama ke tabel baru.
3. Jalankan dual-read (prefer new, fallback old).
4. Setelah stabil, alihkan write ke tabel baru.
5. Baru rencanakan deprecate tabel lama.

## Validation Rules
- `subdomain`: lowercase alnum + hyphen, no leading/trailing hyphen.
- `slug`: wajib prefix `/`, no trailing slash kecuali `/`.
- `tenant_id` selalu jadi filter mandatory untuk semua query private.
- publish wajib atomic transaction:
  - set old published => archived
  - set draft terbaru => published.
- `blocks_json` wajib envelope `{ schemaVersion, blocks }`, bukan array langsung.
