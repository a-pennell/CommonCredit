-- Migration: Add Organization model and update Member for identity spec
-- See: shared/IDENTITY_SPEC.md

-- ============================================================
-- 1. Enums
-- ============================================================

CREATE TYPE "OrgType" AS ENUM (
  'COOPERATIVE', 'LAND_TRUST', 'HOUSING_COOP', 'INTENTIONAL_COMMUNITY',
  'MUTUAL_AID', 'NONPROFIT', 'INSTITUTION', 'NETWORK', 'OTHER'
);

CREATE TYPE "OrgSize" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');

CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- ============================================================
-- 2. Organization table
-- ============================================================

CREATE TABLE "Organization" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"        TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "type"        "OrgType"   NOT NULL DEFAULT 'COOPERATIVE',
  "size"        "OrgSize"   NOT NULL DEFAULT 'MICRO',
  "status"      "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
  "products"    TEXT[]      NOT NULL DEFAULT ARRAY['common_credit'],
  "website"     TEXT,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"  TIMESTAMP(3),
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- ============================================================
-- 3. CreditNetworkConfig table
-- ============================================================

CREATE TABLE "CreditNetworkConfig" (
  "id"                 TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId"              TEXT           NOT NULL,
  "currencyName"       TEXT           NOT NULL DEFAULT 'CommonCredit',
  "currencySymbol"     TEXT           NOT NULL DEFAULT 'CC',
  "creditUnitBasis"    TEXT           NOT NULL DEFAULT 'USD',
  "defaultCreditLimit" DECIMAL(12,2)  NOT NULL DEFAULT 500,
  "defaultDebitLimit"  DECIMAL(12,2)  NOT NULL DEFAULT -200,
  "createdAt"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditNetworkConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreditNetworkConfig_orgId_fkey" FOREIGN KEY ("orgId")
    REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CreditNetworkConfig_orgId_key" ON "CreditNetworkConfig"("orgId");

-- ============================================================
-- 4. Update Member table
-- ============================================================

-- Add identity spec columns (all nullable during migration)
ALTER TABLE "Member"
  ADD COLUMN "orgId"      TEXT,
  ADD COLUMN "userId"     TEXT,
  ADD COLUMN "avatarUrl"  TEXT,
  ADD COLUMN "timezone"   TEXT,
  ADD COLUMN "departedAt" TIMESTAMP(3);

-- Add FK (deferred — orgId is NULL until seed populates it)
ALTER TABLE "Member"
  ADD CONSTRAINT "Member_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Member_orgId_idx" ON "Member"("orgId");
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- ============================================================
-- 5. Add orgId to high-query-volume exchange models
-- ============================================================

ALTER TABLE "Offer" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Need"  ADD COLUMN "orgId" TEXT;

CREATE INDEX "Offer_orgId_idx" ON "Offer"("orgId");
CREATE INDEX "Need_orgId_idx"  ON "Need"("orgId");

-- Backfill orgId from member's org
UPDATE "Offer" o SET "orgId" = m."orgId"
  FROM "Member" m WHERE o."memberId" = m."id" AND m."orgId" IS NOT NULL;

UPDATE "Need" n SET "orgId" = m."orgId"
  FROM "Member" m WHERE n."memberId" = m."id" AND m."orgId" IS NOT NULL;

-- ============================================================
-- 5. Default organization seed
-- Assign all existing Members to it.
-- Run this script via: psql $DATABASE_URL -f this_file
-- Then run: npx prisma db seed to populate with dev data
-- ============================================================

-- Insert the default org (idempotent via DO block)
DO $$
DECLARE
  default_org_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO "Organization" ("id", "slug", "name", "type", "status", "products")
  VALUES (default_org_id, 'default-network', 'CommonCredit Network', 'COOPERATIVE', 'ACTIVE', ARRAY['common_credit']);

  INSERT INTO "CreditNetworkConfig" ("id", "orgId", "currencyName", "currencySymbol", "creditUnitBasis", "defaultCreditLimit", "defaultDebitLimit")
  VALUES (gen_random_uuid()::text, default_org_id, 'CommonCredit', 'CC', 'USD', 500, -200);

  UPDATE "Member" SET "orgId" = default_org_id WHERE "orgId" IS NULL;
END $$;
