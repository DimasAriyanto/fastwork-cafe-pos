import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  index 
} from 'drizzle-orm/mysql-core';

export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  roleId: int('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'restrict' }),
  username: varchar('username', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  photo: varchar('photo', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  usernameIdx: index('idx_users_username').on(table.username),
  roleIdx: index('idx_users_role').on(table.roleId),
  statusIdx: index('idx_users_status').on(table.status),
}));

export const refreshTokens = mysqlTable('refresh_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('idx_refresh_tokens_user').on(table.userId),
  expiresIdx: index('idx_refresh_tokens_expires').on(table.expiresAt),
}));