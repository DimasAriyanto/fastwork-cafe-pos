import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  date,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './auth.ts';
import { outlets } from './organization.ts';

export const employees = pgTable(
  'employees',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    outletId: integer('outlet_id').references(() => outlets.id, { onDelete: 'set null' }),
    biographyData: text('biography_data'),
    name: varchar('name', { length: 255 }).notNull(),
    position: varchar('position', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    salary: varchar('salary', { length: 50 }).notNull(),
    imagePath: varchar('image_path', { length: 255 }),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      userIdx: index('idx_employees_user').on(table.userId),
      createdByIdx: index('idx_employees_created_by').on(table.createdBy),
      emailIdx: index('idx_employees_email').on(table.email),
      outletIdx: index('idx_employees_outlet').on(table.outletId),
      positionIdx: index('idx_employees_position').on(table.position),
    };
  },
);

export const attendances = pgTable(
  'attendances',
  {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    checkIn: timestamp('check_in'),
    checkOut: timestamp('check_out'),
    attendanceStatus: varchar('attendance_status', { length: 50 }).default('present'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      employeeIdx: index('idx_attendances_employee').on(table.employeeId),
      dateIdx: index('idx_attendances_date').on(table.date),
      uniqueEmployeeDate: unique('unique_employee_date').on(table.employeeId, table.date),
    };
  },
);
