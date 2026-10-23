import { pgTable, serial, text, doublePrecision, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  uid: text('uid').unique(), // Firebase Auth UID
  password: text('password'),
  role: text('role'), // 'admin', 'district_manager', 'ward_manager', 'school_manager', 'department_manager', 'environment_department'
  area: text('area'), // e.g., 'Hai Châu', 'Sơn Trà', 'Hòa Vang'
  ward: text('ward'), // Ward/Commune name
  organizationName: text('organization_name'),
  email: text('email'),
  phone: text('phone'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'reports' table
export const reports = pgTable('reports', {
  id: text('id').primaryKey(), // Using string UUID as primary key matching SQLite
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  userDescription: text('user_description'),
  issueType: text('issue_type'),
  description: text('description'),
  priority: text('priority'),
  solution: text('solution'),
  isIssuePresent: integer('is_issue_present'), // 0 or 1
  status: text('status'),
  timestamp: text('timestamp'),
  area: text('area'),
  ward: text('ward'), // Ward name
  reporter: text('reporter'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'notifications' table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  reportId: text('report_id').references(() => reports.id, { onDelete: 'cascade' }),
  message: text('message'),
  type: text('type'), // 'new_report', 'status_update', 'emergency'
  isRead: integer('is_read').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'orders' table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  productName: text('product_name'),
  quantity: integer('quantity'),
  address: text('address'),
  phone: text('phone'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define 'notes' table
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
  orders: many(orders),
}));

export const reportsRelations = relations(reports, ({ many }) => ({
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  report: one(reports, {
    fields: [notifications.reportId],
    references: [reports.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));
