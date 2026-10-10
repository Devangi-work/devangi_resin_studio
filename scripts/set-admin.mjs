import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbUrlLine ? dbUrlLine.split('DATABASE_URL=')[1].replace(/["']/g, '').trim() : '';
const sql = neon(dbUrl);

async function setAdmin() {
  console.log('Setting admin credentials in Neon PostgreSQL...');

  const email = 'devangiresin@gmail.com';
  const plainPassword = 'Deepa@04';
  const fullName = 'Devangi Resin Studio Admin';
  const role = 'owner';

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Upsert into admin_users
  await sql`
    INSERT INTO admin_users (id, email, full_name, password_hash, role)
    VALUES ('adm_devangi', ${email}, ${fullName}, ${passwordHash}, ${role})
    ON CONFLICT (email) DO UPDATE SET
      password_hash = ${passwordHash},
      full_name = ${fullName},
      updated_at = NOW();
  `;

  console.log('✓ Successfully set admin in Neon database:');
  console.log('  Email:   ', email);
  console.log('  Password:', plainPassword);
  console.log('  Role:    ', role);

  const check = await sql`SELECT id, email, full_name, role FROM admin_users WHERE email = ${email};`;
  console.log('Verification query:', check);
}

setAdmin().catch(err => {
  console.error('Error setting admin:', err);
  process.exit(1);
});
