import { Migration } from '@mikro-orm/migrations';

export class Migration20250506215932 extends Migration {
  override async up(): Promise<void> {
    // Add product fields
    this.addSql(`
      ALTER TABLE "product"
      ADD COLUMN IF NOT EXISTS "is_pack_sale" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "pack_chart" text,
      ADD COLUMN IF NOT EXISTS "size_chart" text,
      ADD COLUMN IF NOT EXISTS "unit_price" money
    `);
  }

  override async down(): Promise<void> {
    // Remove product fields
    this.addSql(`
      ALTER TABLE "product"
      DROP COLUMN IF EXISTS "unit_price",
      DROP COLUMN IF EXISTS "size_chart",
      DROP COLUMN IF EXISTS "pack_chart",
      DROP COLUMN IF EXISTS "is_pack_sale"
    `);
  }
}
