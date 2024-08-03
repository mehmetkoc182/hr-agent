import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: text('created_at').default(new Date().toISOString()),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id').references(() => conversations.id),
  type: text('type'), // 'user' or 'ai'
  text: text('text'),
  createdAt: text('created_at').default(new Date().toISOString()),
});
