-- Phase 1 PostgreSQL SQL Draft (Laravel Backend)
-- Target DB: oyiwebbuilder
-- Notes:
-- - Keep names snake_case to match Laravel defaults.
-- - Prefer uuid primary keys if project already uses UUID/ULID.

BEGIN;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id varchar(191) NOT NULL,
  name varchar(191) NOT NULL,
  subdomain varchar(191) NOT NULL UNIQUE,
  custom_domain varchar(191) UNIQUE,
  status varchar(32) NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_owner_user_id ON tenants(owner_user_id);

CREATE TABLE IF NOT EXISTS site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title varchar(191) NOT NULL,
  slug varchar(255) NOT NULL,
  page_type varchar(64) NOT NULL,
  layout_template varchar(191),
  is_system boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_site_pages_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_site_pages_tenant_page_type ON site_pages(tenant_id, page_type);

CREATE TABLE IF NOT EXISTS page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'draft',
  -- required envelope: { "schemaVersion": number, "blocks": [...] }
  blocks_json jsonb NOT NULL,
  seo_json jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_page_versions_page_version UNIQUE (page_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_page_versions_page_status ON page_versions(page_id, status);

CREATE TABLE IF NOT EXISTS navbar_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'draft',
  items_json jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_navbar_configs_tenant_version UNIQUE (tenant_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_navbar_configs_tenant_status ON navbar_configs(tenant_id, status);

COMMIT;

