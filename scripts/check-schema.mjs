import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const cols = await sql`
    SELECT column_name, is_nullable, column_default, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'customers';
  `;
  console.log("Customer columns:", cols);
}

check().catch(console.error);
