import { pgTable, serial, varchar, text, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    username: varchar('username', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    photo: varchar('photo', { length: 255 }),
    status: varchar('status', { length: 50 }).default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      emailIdx: index('idx_users_email').on(table.email),
      usernameIdx: index('idx_users_username').on(table.username),
      roleIdx: index('idx_users_role').on(table.roleId),
      statusIdx: index('idx_users_status').on(table.status),
    };
  },
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      userIdx: index('idx_refresh_tokens_user').on(table.userId),
      expiresIdx: index('idx_refresh_tokens_expires').on(table.expiresAt),
    };
  },
);
