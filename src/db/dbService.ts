import { db } from './index.ts';
import { users, reports, notifications, orders, notes } from './schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';

// HELPER: Sanitized Error handler
const handleDbError = (context: string, error: any) => {
  console.error(`[DB ERROR] ${context}:`, error);
  throw new Error(`Database operation failed during ${context}. Please try again later.`, { cause: error });
};

// 1. Users Queries
export async function getUserByUsername(username: string) {
  try {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  } catch (error) {
    handleDbError('getUserByUsername', error);
  }
}

export async function createUser(data: {
  username: string;
  password?: string;
  role?: string;
  area?: string;
  ward?: string;
  organizationName?: string;
  email?: string;
  phone?: string;
  status?: string;
  uid?: string;
}) {
  try {
    const result = await db.insert(users).values({
      username: data.username,
      password: data.password,
      role: data.role,
      area: data.area,
      ward: data.ward,
      organizationName: data.organizationName,
      email: data.email,
      phone: data.phone,
      status: data.status || 'active',
      uid: data.uid,
    }).returning();
    return result[0];
  } catch (error) {
    handleDbError('createUser', error);
  }
}

// 2. Reports Queries
export async function getReports() {
  try {
    return await db.select().from(reports).orderBy(desc(reports.timestamp));
  } catch (error) {
    handleDbError('getReports', error);
  }
}

export async function createReport(data: {
  id: string;
  mediaUrl?: string;
  mediaType?: string;
  latitude?: number;
  longitude?: number;
  userDescription?: string;
  issueType?: string;
  description?: string;
  priority?: string;
  solution?: string;
  isIssuePresent?: number;
  status?: string;
  timestamp?: string;
  area?: string;
  ward?: string;
  reporter?: string;
}) {
  try {
    const result = await db.insert(reports).values({
      id: data.id,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      latitude: data.latitude,
      longitude: data.longitude,
      userDescription: data.userDescription,
      issueType: data.issueType,
      description: data.description,
      priority: data.priority,
      solution: data.solution,
      isIssuePresent: data.isIssuePresent,
      status: data.status,
      timestamp: data.timestamp,
      area: data.area,
      ward: data.ward,
      reporter: data.reporter,
    }).returning();
    return result[0];
  } catch (error) {
    handleDbError('createReport', error);
  }
}

export async function updateReportStatus(id: string, status: string) {
  try {
    const result = await db.update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    handleDbError('updateReportStatus', error);
  }
}

// 3. Notifications Queries
export async function getNotifications(userId: number) {
  try {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    handleDbError('getNotifications', error);
  }
}

export async function createNotification(data: {
  userId: number;
  reportId: string;
  message: string;
  type: string;
}) {
  try {
    const result = await db.insert(notifications).values({
      userId: data.userId,
      reportId: data.reportId,
      message: data.message,
      type: data.type,
      isRead: 0,
    }).returning();
    return result[0];
  } catch (error) {
    handleDbError('createNotification', error);
  }
}

export async function markNotificationRead(id: number) {
  try {
    const result = await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    handleDbError('markNotificationRead', error);
  }
}

export async function markAllNotificationsRead(userId: number) {
  try {
    const result = await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.userId, userId))
      .returning();
    return result;
  } catch (error) {
    handleDbError('markAllNotificationsRead', error);
  }
}

// 4. Stats Queries
export async function getDashboardStats() {
  try {
    const totalCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(reports);
    
    const priorityResult = await db.select({
      priority: reports.priority,
      count: sql<number>`count(*)::int`
    }).from(reports).groupBy(reports.priority);

    const statusResult = await db.select({
      status: reports.status,
      count: sql<number>`count(*)::int`
    }).from(reports).groupBy(reports.status);

    const areaResult = await db.select({
      area: reports.area,
      count: sql<number>`count(*)::int`
    }).from(reports).groupBy(reports.area);

    const recentReports = await db.select({
      id: reports.id,
      issueType: reports.issueType,
      timestamp: reports.timestamp,
      status: reports.status,
    }).from(reports).orderBy(desc(reports.timestamp)).limit(5);

    return {
      totalReports: totalCountResult[0]?.count || 0,
      byPriority: priorityResult,
      byStatus: statusResult,
      byArea: areaResult,
      recentActivity: recentReports
    };
  } catch (error) {
    handleDbError('getDashboardStats', error);
  }
}

// 5. Orders Queries
export async function createOrder(data: {
  userId: number;
  productName: string;
  quantity: number;
  address: string;
  phone: string;
}) {
  try {
    const result = await db.insert(orders).values({
      userId: data.userId,
      productName: data.productName,
      quantity: data.quantity,
      address: data.address,
      phone: data.phone,
      status: 'pending',
    }).returning();
    return result[0];
  } catch (error) {
    handleDbError('createOrder', error);
  }
}

export async function getOrders(userId: number) {
  try {
    return await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  } catch (error) {
    handleDbError('getOrders', error);
  }
}

// 6. Authorities Retrieval Helper
export async function getAuthorities(area: string) {
  try {
    return await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      phone: users.phone
    })
    .from(users)
    .where(
      and(
        sql`${users.role} NOT IN ('citizen')`,
        or(
          eq(users.area, area),
          eq(users.area, 'All')
        )
      )
    );
  } catch (error) {
    handleDbError('getAuthorities', error);
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    handleDbError('getUsers', error);
  }
}

