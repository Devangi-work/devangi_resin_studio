import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fix() {
  console.log("Updating customers.phone nullability...");
  await sql`ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;`;
  await sql`ALTER TABLE customers ALTER COLUMN phone SET DEFAULT '';`;
  console.log("Success! Checking columns:");
  const cols = await sql`
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'phone';
  `;
  console.log(cols);
}

fix().catch(console.error);
