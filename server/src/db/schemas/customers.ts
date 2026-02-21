import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  index 
} from 'drizzle-orm/mysql-core';
import { users } from './auth';

export const customers = mysqlTable('customers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  nameIdx: index('idx_customers_name').on(table.name),
  phoneIdx: index('idx_customers_phone').on(table.phoneNumber),
  createdByIdx: index('idx_customers_created_by').on(table.createdBy),
}));
