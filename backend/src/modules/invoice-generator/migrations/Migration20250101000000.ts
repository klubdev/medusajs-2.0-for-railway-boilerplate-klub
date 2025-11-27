import { Migration } from '@mikro-orm/migrations';

export class Migration20250101000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice_config" add column if not exists "company_kvk" text null;`);
    this.addSql(`alter table if exists "invoice_config" add column if not exists "company_vat" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice_config" drop column if exists "company_kvk";`);
    this.addSql(`alter table if exists "invoice_config" drop column if exists "company_vat";`);
  }

}

