import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  date, 
  index,
  unique, 
  datetime,
  boolean,
  uniqueIndex,
  // uniqueIndex
} from 'drizzle-orm/mysql-core';
// import { users } from './auth';
// import { outlets } from './organization';

export const employees = mysqlTable('employees', {
  id: int('id').autoincrement().primaryKey(),
  
  // Hapus .unique() disini agar tidak redundant dengan index di bawah, 
  // atau biarkan tapi logic-nya kita rapikan.
  userId: int('user_id').notNull(), 
  
  outletId: int('outlet_id').default(1),
  
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  imagePath: varchar('image_path', { length: 255 }),
  
  isActive: boolean('is_active').default(true),
  
  createdBy: int('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => {
  return [
    // 👇 SOLUSI: Gunakan Array [] alih-alih Object {}
    
    // Ganti index biasa jadi uniqueIndex untuk userId (pengganti .unique() di atas)
    uniqueIndex('idx_employees_user').on(table.userId),
    
    index('idx_employees_outlet').on(table.outletId),
    index('idx_employees_created_by').on(table.createdBy),
    
    // Index tambahan untuk performa search nama & posisi
    index('idx_employees_name').on(table.name),
    index('idx_employees_position').on(table.position)
  ];
});

export const attendances = mysqlTable('attendances', {
  id: int('id').autoincrement().primaryKey(),
  employeeId: int('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  checkIn: datetime('check_in'),
  checkOut: datetime('check_out'),
  attendanceStatus: varchar('attendance_status', { length: 50 }).default('present'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => {
  return [
    index('idx_attendances_employee').on(table.employeeId),
    index('idx_attendances_date').on(table.date),
    unique('unique_employee_date').on(table.employeeId, table.date),
  ];
});