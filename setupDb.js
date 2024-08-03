import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Replace with your actual database file path or connection string
const dbPath = 'db.sqlite';

(async () => {
  // Open the SQLite database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // SQL statements to create tables
  const createConversationsTable = `
  CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  `;

  const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      type TEXT,
      text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
  `;

  const deleteMessagesTable = `
  DELETE FROM messages;
  `;

  const deleteConversationsTable = `
  DELETE FROM conversations;
  `;

  // Run the SQL commands to create tables
  await db.exec(createConversationsTable);
  console.log('Conversations table created or already exists.');

  await db.exec(createMessagesTable);
  console.log('Messages table created or already exists.');

  // await db.exec(deleteMessagesTable);
  // console.log('Messages table data deleted.');

  // await db.exec(deleteConversationsTable);
  // console.log('Conversations table data deleted.');

  // Close the database connection
  await db.close();
  console.log('Database connection closed.');
})();
