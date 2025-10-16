import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

// 🔧 Cria (ou abre) o banco SQLite
export const db = await open({
  filename: './karate.db',
  driver: sqlite3.Database
});

// 🔧 Cria tabelas caso não existam
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    belt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// 🔧 Executa seed se solicitado
if (process.argv.includes('--seed')) {
  const hashed = await bcrypt.hash('123456', 10);
  await db.run(`
    INSERT OR IGNORE INTO users (name, email, password)
    VALUES (?, ?, ?)`,
    ['Admin', 'admin@local', hashed]
  );
  console.log('✅ Usuário admin criado com sucesso!');
  process.exit(0);
}

console.log(`📁 Banco SQLite inicializado em: ${process.cwd()}\\karate.db`);
