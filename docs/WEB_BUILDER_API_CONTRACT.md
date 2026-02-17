# Web Builder API Contract (Laravel)

## Conventions
- Base URL: `/api`
- Auth: `Authorization: Bearer <token>` (untuk endpoint private)
- Content-Type: `application/json`
- Error shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Slug already exists",
    "details": {}
  }
}
```

## Tenant

### POST `/api/tenants`
Create tenant + seed pages dari template.

Request:
```json
{
  "name": "Acme Studio",
  "subdomain": "acme-studio",
  "templateId": "business"
}
```

Response `201`:
```json
{
  "tenant": {
    "id": "tnt_123",
    "name": "Acme Studio",
    "subdomain": "acme-studio",
    "status": "draft"
  }
}
```

### PATCH `/api/tenants/:tenantId/subdomain`
Request:
```json
{
  "subdomain": "acme-new"
}
```

Response `200`:
```json
{
  "tenant": {
    "id": "tnt_123",
    "subdomain": "acme-new"
  }
}
```

## Pages

### GET `/api/tenants/:tenantId/pages`
Response `200`:
```json
{
  "items": [
    {
      "id": "pg_1",
      "title": "Beranda",
      "slug": "/",
      "pageType": "home",
      "isSystem": true,
      "hasDraft": true,
      "hasPublished": true
    }
  ]
}
```

### POST `/api/tenants/:tenantId/pages`
Create custom page.

Request:
```json
{
  "title": "FAQ",
  "slug": "/faq",
  "layoutTemplate": "default"
}
```

### PATCH `/api/pages/:pageId`
Update page metadata/slug.

Request:
```json
{
  "title": "About Us",
  "slug": "/about",
  "seo": {
    "metaTitle": "About Acme",
    "metaDescription": "Tentang Acme",
    "ogImage": "https://cdn.example.com/og-about.jpg"
  }
}
```

### DELETE `/api/pages/:pageId`
Soft delete page.

Response `200`:
```json
{
  "ok": true
}
```

### PUT `/api/pages/:pageId/draft`
Save draft blocks.

Request:
```json
{
  "schemaVersion": 1,
  "blocks": [],
  "seo": {
    "metaTitle": "Draft title",
    "metaDescription": "Draft description",
    "ogImage": null
  }
}
```

### POST `/api/pages/:pageId/publish`
Promote latest draft => published.

Response `200`:
```json
{
  "page": {
    "id": "pg_1",
    "slug": "/about",
    "publishedAt": "2026-02-17T12:00:00Z"
  }
}
```

## Navbar

### GET `/api/tenants/:tenantId/navbar`
Response `200`:
```json
{
  "status": "draft",
  "versionNo": 3,
  "items": [
    {
      "id": "nav_1",
      "label": "Home",
      "type": "link",
      "href": "/",
      "hidden": false
    }
  ]
}
```

### PUT `/api/tenants/:tenantId/navbar`
Request:
```json
{
  "status": "draft",
  "items": [
    {
      "id": "nav_2",
      "label": "Services",
      "type": "mega_menu",
      "hidden": false,
      "items": [
        { "id": "child_1", "label": "Web Dev", "href": "/web-dev", "hidden": false }
      ]
    }
  ]
}
```

## Articles

### GET `/api/tenants/:tenantId/articles`
### POST `/api/tenants/:tenantId/articles`
### PATCH `/api/articles/:articleId`
### DELETE `/api/articles/:articleId`

Article payload fields:
- `title`, `slug`, `excerpt`, `content`, `coverImage`, `seo`, `status`

## Products

### GET `/api/tenants/:tenantId/products`
### POST `/api/tenants/:tenantId/products`
### PATCH `/api/products/:productId`
### DELETE `/api/products/:productId`

Product payload fields:
- `name`, `slug`, `description`, `price`, `currency`, `images`, `seo`, `status`

## Checkout

### POST `/api/checkout/session`
Request:
```json
{
  "tenantId": "tnt_123",
  "productId": "prd_1",
  "buyer": {
    "name": "Iqbal",
    "email": "iqbal@example.com",
    "phone": "0812xxxx"
  }
}
```

Response `200`:
```json
{
  "checkoutUrl": "https://payment-gateway/session/abc",
  "orderId": "ord_1"
}
```

## Public SSR Endpoints

### GET `/api/public/site?host={host}&slug={slug}`
Stable single-fetch render payload. Jangan return graph relational mentah.

Response `200`:
```json
{
  "version": 1,
  "tenant": {
    "name": "Acme Studio",
    "theme": {
      "font": "plus-jakarta-sans",
      "primaryColor": "#2563eb"
    }
  },
  "navbar": {
    "items": [
      {
        "id": "nav_1",
        "label": "Home",
        "type": "link",
        "href": "/",
        "hidden": false
      }
    ]
  },
  "page": {
    "slug": "/about",
    "blocks": {
      "schemaVersion": 1,
      "blocks": []
    },
    "seo": {
      "metaTitle": "About Acme",
      "metaDescription": "About page",
      "ogImage": "https://cdn.example.com/og.jpg"
    }
  },
  "collections": {
    "articles": [],
    "products": []
  }
}
```

### GET `/api/public/preview?token={token}`
Response shape sama dengan `/api/public/site`, namun sumbernya draft.

### GET `/api/public/sitemap?host={host}`
Response:
```json
{
  "urls": [
    { "loc": "https://acme.domain.com/", "lastmod": "2026-02-17T12:00:00Z" }
  ]
}
```

### GET `/api/public/robots?host={host}`
Response:
```json
{
  "rules": "User-agent: *\nAllow: /\nSitemap: https://acme.domain.com/sitemap.xml"
}
```
