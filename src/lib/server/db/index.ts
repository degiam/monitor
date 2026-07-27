import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(env.DATABASE_URL);

// Otomatis buat tabel jika belum ada saat server/koneksi dinyalakan
client.exec(`
	CREATE TABLE IF NOT EXISTS \`endpoints\` (
		\`id\` text PRIMARY KEY NOT NULL,
		\`name\` text NOT NULL,
		\`url\` text NOT NULL,
		\`group\` text DEFAULT '' NOT NULL,
		\`interval\` integer DEFAULT 60 NOT NULL,
		\`last_check\` text,
		\`created_at\` text NOT NULL,
		\`updated_at\` text NOT NULL
	);
`);

export const db = drizzle(client, { schema });
