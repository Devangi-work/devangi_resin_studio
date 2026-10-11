import { neon } from '@neondatabase/serverless';


async function migrate() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('Connecting to Neon PostgreSQL...');

  // 1. Add customer columns
  await sql`
    ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS google_id TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
  `;
  console.log('Customers table columns updated successfully.');

  // 2. Add orders columns
  await sql`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'online',
    ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_discarded BOOLEAN DEFAULT FALSE;
  `;
  console.log('Orders table columns updated successfully.');

  // 3. Verify
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers';
  `;
  console.log('Current customers columns:', cols.map(c => c.column_name));
}

migrate()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
